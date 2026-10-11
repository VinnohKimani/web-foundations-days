# TicketHub: Event Ticketing System Design

TicketHub is a website that sells tickets for concerts and events. This document follows the six-part design framework:

1. [Requirements](#1-requirements)
2. [Estimates](#2-estimates)
3. [API](#3-api)
4. [Data model](#4-data-model) (includes [how double-booking is prevented](#44-how-the-design-prevents-two-people-buying-the-same-seat))
5. [Architecture](#5-architecture)
6. [Trade-offs](#6-trade-offs)

**Facts used:** 2 million registered users; 50,000 visitors on a normal day, each viewing 10 pages; 5,000 tickets sold on a normal day; when a popular concert goes on sale, 200,000 people try to buy its 20,000 seats within the first 10 minutes.

---

## 1. Requirements

### Functional requirements

- Users can register and log in.
- Users can browse and search upcoming events.
- Users can view an event's seat map and see which seats are available.
- Users can **hold** one or more seats (up to 6) for 5 minutes while they pay.
- Users can pay for held seats and receive their tickets.
- Users can view their tickets and past orders.
- Held seats that are not paid for are released automatically.

### Non-functional requirements

| Quality          | Requirement                                                                                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Speed**        | Browsing pages respond in under 300 ms (95th percentile). Seat holds respond in under 500 ms, even during a big sale.                                                                                                           |
| **Correctness**  | **A seat is never sold to two people.** A user is never charged without receiving a ticket, and never charged twice for the same order. Paid orders are never lost.                                                             |
| **Fairness**     | Selling is first-come, first-served, with no advantage for bots or for people with faster connections. Each user can hold a limited number of seats. Everyone gets a clear answer (a place in line, a held seat or "sold out"). |
| **Availability** | 99.9% uptime, with the highest priority on the days a popular event goes on sale. No single point of failure.                                                                                                                   |
| **Scalability**  | Handles normal days cheaply and the "big sale" spike (about 600–2,900 times normal traffic) without crashing.                                                                                                                   |
| **Durability**   | Orders and payments are stored safely with replication and backups.                                                                                                                                                             |
| **Security**     | HTTPS everywhere, hashed passwords, and card details handled only by the payment provider (TicketHub never stores card numbers).                                                                                                |

Of these, **correctness is non-negotiable**. We may make users wait (speed) or limit them (fairness), but we must never sell the same seat twice.

---

## 2. Estimates

**Assumptions:** 86,400 seconds per day; a normal-day peak is 5× the average; during the big sale each user makes about 10 requests (event page, seat-map refreshes, about 3 hold attempts, payment); half of the 200,000 people arrive in the first minute.

### Normal day

| Metric                              | Calculation                    | Result                                     |
| ----------------------------------- | ------------------------------ | ------------------------------------------ |
| Page views per day                  | 50,000 visitors × 10 pages     | 500,000                                    |
| **Page views per second (average)** | 500,000 / 86,400               | **≈ 5.8 /s**                               |
| Page views per second (peak)        | 5.8 × 5                        | ≈ 29 /s                                    |
| Tickets sold per day                | given                          | 5,000                                      |
| **Tickets per second (average)**    | 5,000 / 86,400                 | **≈ 0.06 /s** (about one every 17 seconds) |
| Storage growth                      | 5,000 tickets/day × 1 KB × 365 | ≈ 1.8 GB/year                              |

A normal day is tiny: one small database could handle it.

### Big sale (200,000 people, 20,000 seats, 10 minutes)

| Metric                                        | Calculation            | Result                           |
| --------------------------------------------- | ---------------------- | -------------------------------- |
| Window                                        | 10 × 60                | 600 s                            |
| People arriving per second (average)          | 200,000 / 600          | ≈ 333 /s                         |
| People arriving per second (first minute)     | 100,000 / 60           | ≈ 1,667 /s                       |
| Total requests                                | 200,000 × 10           | 2,000,000                        |
| **Requests per second (average)**             | 2,000,000 / 600        | **≈ 3,333 /s**                   |
| **Requests per second (first-minute spike)**  | 1,000,000 / 60         | **≈ 16,700 /s**                  |
| Hold attempts per second (first-minute spike) | 200,000 × 3 × 50% / 60 | ≈ 5,000 /s                       |
| **Tickets sold per second**                   | 20,000 / 600           | **≈ 33 /s**                      |
| People per seat                               | 200,000 / 20,000       | 10 people compete for every seat |

### Comparison

| Metric                  | Normal day | Big sale                         | Increase            |
| ----------------------- | ---------- | -------------------------------- | ------------------- |
| Requests per second     | 5.8        | 3,333 (average) / 16,700 (spike) | **≈ 575× / 2,900×** |
| Tickets sold per second | 0.06       | 33                               | **≈ 575×**          |

**What this tells us:**

- The big sale is hundreds to thousands of times busier than a normal day, and it lasts only minutes. We cannot run that capacity all year, so the system must **scale up in advance** and protect itself.
- **90% of the people lose** (180,000 of 200,000 get no ticket). Most requests end in "sold out" or "seat taken", so the design must make those answers very cheap.
- The number of _successful sales_ (33/s) is small. The real danger is the flood of reads and failed hold attempts, not the writes. This is why caching, rate limiting and a waiting room matter more than a bigger database.

---

## 3. API

**Base URL:** `https://api.tickethub.example/v1`. JSON requests and responses. Authenticated endpoints use `Authorization: Bearer <token>`.

| #   | Method   | Path                               | Purpose                                                        | Success          |
| --- | -------- | ---------------------------------- | -------------------------------------------------------------- | ---------------- |
| 1   | `GET`    | `/events?query=&date=&page=`       | Browse and search events                                       | `200 OK`         |
| 2   | `GET`    | `/events/{eventId}`                | Event details (artist, venue, time, price range, availability) | `200 OK`         |
| 3   | `GET`    | `/events/{eventId}/seats?section=` | View the seat map and each seat's status                       | `200 OK`         |
| 4   | `POST`   | `/events/{eventId}/queue`          | Join the waiting room for a popular sale                       | `202 Accepted`   |
| 5   | `POST`   | `/events/{eventId}/holds`          | **Hold** seats for 5 minutes                                   | `201 Created`    |
| 6   | `DELETE` | `/holds/{holdId}`                  | Release a hold early                                           | `204 No Content` |
| 7   | `POST`   | `/orders`                          | **Pay** for a hold (requires `Idempotency-Key` header)         | `201 Created`    |
| 8   | `GET`    | `/orders/{orderId}`                | Check the status of an order                                   | `200 OK`         |
| 9   | `GET`    | `/me/tickets`                      | **View my tickets**                                            | `200 OK`         |

### Example: hold seats

```http
POST /v1/events/42/holds
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json
```

```json
{ "seatIds": [88121, 88122] }
```

**`201 Created`: both seats are now held for this user**

```json
{
  "holdId": "hold_9f2c",
  "eventId": 42,
  "seatIds": [88121, 88122],
  "expiresAt": "2026-10-11T18:05:00Z"
}
```

**`409 Conflict`: someone else got a seat first (nothing is held)**

```json
{
  "error": {
    "code": "SEAT_UNAVAILABLE",
    "message": "One or more seats were just taken. Choose different seats.",
    "unavailableSeatIds": [88122]
  }
}
```

### Example: pay for a hold

```http
POST /v1/orders
Authorization: Bearer eyJhbGciOi...
Idempotency-Key: 3b0c6a5e-7f24-4c53-8f56-0c7a8b9d1e22
```

```json
{ "holdId": "hold_9f2c", "paymentToken": "tok_visa_abc123" }
```

**`201 Created`**

```json
{
  "orderId": 5001,
  "status": "paid",
  "totalCents": 24000,
  "tickets": [
    { "seatId": 88121, "section": "A", "row": "12", "number": 7 },
    { "seatId": 88122, "section": "A", "row": "12", "number": 8 }
  ]
}
```

### Error codes

| Status        | Meaning in TicketHub                                         |
| ------------- | ------------------------------------------------------------ |
| `400`         | Invalid request (for example, more than 6 seats)             |
| `401`         | Not logged in                                                |
| `403`         | Not your hold or order                                       |
| `404`         | Event, hold or order not found                               |
| `409`         | Seat already held or sold; hold expired                      |
| `410`         | The hold has expired                                         |
| `402`         | Payment declined                                             |
| `429`         | Too many requests, or the user must wait in the waiting room |
| `500` / `503` | Server error or temporarily overloaded                       |

`Idempotency-Key` on `POST /orders` means that if the client retries (slow network, double-click), the server returns the first result instead of charging twice.

---

## 4. Data model

### 4.1 Tables

| Table         | Purpose                                                                   |
| ------------- | ------------------------------------------------------------------------- |
| `users`       | People who can buy tickets                                                |
| `events`      | Concerts and events                                                       |
| `seats`       | One row per seat per event, with its status (`available`, `held`, `sold`) |
| `orders`      | A purchase made by a user                                                 |
| `order_items` | Which seats belong to which order (one row per ticket)                    |

### 4.2 Relationships

- A **user** has many **orders** (one-to-many).
- An **event** has many **seats** (one-to-many) and many **orders** (one-to-many).
- An **order** has one or more **order items** (one-to-many); each order item points to exactly one **seat**.
- **Orders ↔ seats** is modelled through `order_items`: one order can contain several seats. A **UNIQUE** constraint on `order_items.seat_id` means each seat can appear in **at most one** order item. This is the database-level guard against double-booking.
- A **seat** can be temporarily held by one **user** (`held_by`).

```text
users 1 ──< orders 1 ──< order_items >── 1 seats >── 1 events
  │                                         │              │
  └────────── (held_by) ────────────────────┘              └──< orders
```

### 4.3 SQL (PostgreSQL)

```sql
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE events (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    venue       VARCHAR(200) NOT NULL,
    starts_at   TIMESTAMPTZ  NOT NULL,
    on_sale_at  TIMESTAMPTZ  NOT NULL,
    total_seats INT          NOT NULL CHECK (total_seats > 0)
);

CREATE TABLE seats (
    id              BIGSERIAL PRIMARY KEY,
    event_id        BIGINT      NOT NULL REFERENCES events(id),
    section         VARCHAR(20) NOT NULL,
    row_label       VARCHAR(10) NOT NULL,
    seat_number     INT         NOT NULL,
    price_cents     INT         NOT NULL CHECK (price_cents >= 0),
    status          VARCHAR(10) NOT NULL DEFAULT 'available'
                    CHECK (status IN ('available', 'held', 'sold')),
    held_by         BIGINT      REFERENCES users(id),
    hold_expires_at TIMESTAMPTZ,

    -- a physical seat exists only once per event
    UNIQUE (event_id, section, row_label, seat_number),

    -- a seat has a holder and an expiry if and only if it is 'held'
    CHECK (
        (status = 'held' AND held_by IS NOT NULL AND hold_expires_at IS NOT NULL)
        OR
        (status <> 'held' AND held_by IS NULL AND hold_expires_at IS NULL)
    )
);

CREATE TABLE orders (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES users(id),
    event_id        BIGINT      NOT NULL REFERENCES events(id),
    status          VARCHAR(10) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    total_cents     INT         NOT NULL CHECK (total_cents >= 0),
    payment_ref     VARCHAR(100),
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,   -- stops double charging on retries
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at         TIMESTAMPTZ
);

CREATE TABLE order_items (
    order_id    BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seat_id     BIGINT NOT NULL UNIQUE REFERENCES seats(id),  -- a seat can be in only ONE order
    price_cents INT    NOT NULL,
    PRIMARY KEY (order_id, seat_id)
);

-- Indexes
CREATE INDEX idx_seats_event_status ON seats (event_id, status);          -- seat map and availability counts
CREATE INDEX idx_seats_expiring     ON seats (hold_expires_at)
    WHERE status = 'held';                                                -- fast sweep for expired holds
CREATE INDEX idx_orders_user        ON orders (user_id, created_at DESC); -- "my tickets"
```

### 4.4 How the design prevents two people buying the same seat

Two users, A and B, click the same seat at the same moment. Three layers of protection make sure only one succeeds. The first two use **transactions**, and the third uses **constraints**. Each layer still works if the one before it has a bug.

**Layer 1: an atomic conditional hold (transaction + row lock).**
The hold is **one SQL statement** that checks and claims the seat at the same time. It never reads the status first and updates later, because that gap is where double-booking happens.

```sql
BEGIN;

UPDATE seats
SET    status = 'held',
       held_by = $user_id,
       hold_expires_at = now() + interval '5 minutes'
WHERE  event_id = $event_id
  AND  id = ANY($seat_ids)
  AND (status = 'available'
       OR (status = 'held' AND hold_expires_at < now()));  -- expired holds count as free

-- The application checks the number of rows changed:
--   = number of seats requested  -> COMMIT   (return 201)
--   < number of seats requested  -> ROLLBACK (return 409; user holds nothing)
COMMIT;
```

When A and B update the same row, PostgreSQL **locks the row** for whoever arrives first (A). B's update waits. When A commits, B's condition is checked again against the new data (`status = 'held'`, not expired), no longer matches, and changes **0 rows**. B gets `409 Conflict`. Because the check is inside the `UPDATE`, it is impossible for both to win. Holding several seats is **all or nothing**: if any seat fails, the whole transaction rolls back so the user is never left with a partial hold. To avoid deadlocks when two users want overlapping seats, the application always sorts `seat_ids` ascending.

**Layer 2: a transaction when paying.**
When the user pays, a second transaction locks and re-checks the seats before creating the order:

```sql
BEGIN;
SELECT id FROM seats
WHERE  id = ANY($seat_ids) AND status = 'held'
  AND  held_by = $user_id AND hold_expires_at > now()
FOR UPDATE;                        -- lock; must return every seat, or ROLLBACK

INSERT INTO orders (user_id, event_id, status, total_cents, idempotency_key)
VALUES ($user_id, $event_id, 'pending', $total, $key) RETURNING id;

INSERT INTO order_items (order_id, seat_id, price_cents) ...;

UPDATE seats SET hold_expires_at = now() + interval '2 minutes'
WHERE  id = ANY($seat_ids);        -- protect seats while the payment provider responds
COMMIT;
```

The payment provider is called **after** this transaction commits (never inside it, so we do not hold database locks while waiting for an outside service). When payment succeeds, a final transaction sets the order to `paid` and the seats to `sold`. If payment fails, we set the order to `failed`, delete its `order_items` and release the seats.

**Layer 3: constraints (the safety net).**
Even if a bug or a race got past the application code, the database refuses to store a double sale:

- `UNIQUE (seat_id)` on `order_items`: a seat can appear in at most one order, ever. A second insert fails with an error and the whole transaction rolls back.
- `UNIQUE (event_id, section, row_label, seat_number)`: the same physical seat cannot be created twice.
- `CHECK` on `seats`: a seat is `held` only if it has a holder and expiry.
- `UNIQUE (idempotency_key)` on `orders`: a retried or double-clicked payment cannot create a second order or charge twice.

**Other protections.**

- **Holds expire.** If a user abandons checkout, the hold lapses after 5 minutes and the seat goes back on sale. A background worker also sweeps expired holds so the seat map stays accurate.
- **The cache is never the source of truth.** Redis is used for speed (seat map, waiting room, rate limits), but only the database decides who owns a seat.
- **Hold limit.** A user can hold at most 6 seats, which also limits hoarding.

**Example race:**

| Time | User A              | User B                                | Database result              |
| ---- | ------------------- | ------------------------------------- | ---------------------------- |
| t0   | `UPDATE` seat 88122 | `UPDATE` seat 88122                   | A gets the row lock; B waits |
| t1   | commit              | (waiting)                             | Seat is `held` by A          |
| t2   |                     | condition re-checked: not `available` | B updates **0 rows**         |
| t3   | `201 Created`       | `409 Conflict`                        | **Only A holds the seat**    |

---

## 5. Architecture

### 5.1 Diagram

```text
                               ┌───────────────┐
                               │    Client     │
                               │ (web / mobile)│
                               └───────┬───────┘
                                       │
                               ┌───────▼───────┐
                               │      DNS      │
                               └───────┬───────┘
                                       │
                  ┌────────────────────┴────────────────────┐
                  │ static files, event pages               │ API calls
                  ▼                                         ▼
          ┌───────────────┐                         ┌───────────────┐
          │      CDN      │                         │ Load Balancer │
          └───────────────┘                         │ + rate limit  │
                                                    └───────┬───────┘
                                                            │
                                                    ┌───────▼───────┐        ┌──────────────┐
                                                    │ Waiting Room  │◄──────►│    Redis     │
                                                    │ (admission)   │        │ (cache, queue│
                                                    └───────┬───────┘        │ position,    │
                                                            │ admitted       │ rate limits) │
                                          ┌─────────────────┼────────┐       └──────▲───────┘
                                          ▼                 ▼        ▼              │
                                   ┌────────────┐   ┌────────────┐  ┌────────────┐  │
                                   │App Server 1│   │App Server 2│  │App Server N│──┘
                                   └─────┬──────┘   └─────┬──────┘  └─────┬──────┘
                                         │                │               │  (autoscaled)
              ┌──────────────────────────┼────────────────┼───────────────┘
              │ reads (browse, seat map) │ writes (holds, orders)         │ jobs
              ▼                          ▼                                ▼
      ┌────────────────┐         ┌────────────────┐               ┌───────────────┐
      │ Read Replicas  │◄────────│  Primary DB    │               │ Message Queue │
      └────────────────┘ replica-│  (PostgreSQL)  │               └───────┬───────┘
                         tion    └────────────────┘                       │
                                                                          ▼
                                                                  ┌───────────────┐      ┌──────────────────┐
                                                                  │    Workers    │─────►│ Payment Provider │
                                                                  │ (expire holds,│      │ + Email service  │
                                                                  │ email tickets)│      └──────────────────┘
                                                                  └───────────────┘
```

### 5.2 Components

| Component                        | What it does and why it is there                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Client**                       | The browser or app where users browse events, pick seats and pay. It shows the waiting-room status and polls the server calmly instead of hammering it.                                                                  |
| **DNS**                          | Finds the service by name and lets us route traffic to healthy regions.                                                                                                                                                  |
| **CDN**                          | Serves static files and cached public event pages from locations near users. During a sale, most of the 200,000 people's page loads never reach our servers.                                                             |
| **Load balancer + rate limiter** | Spreads requests across app servers, removes unhealthy servers, and limits requests per user, IP and token to block bots and retry storms.                                                                               |
| **Waiting room**                 | Holds users in a virtual line and lets them through to the buying pages at a steady rate the system can handle (for example about 200 users per second, tuned by load tests). It also assigns places fairly (see below). |
| **App servers**                  | Run the API logic (validation, holds, orders). They are **stateless**, so we can scale them out before a big sale and add more automatically.                                                                            |
| **Redis (cache)**                | Holds the seat-map snapshot (1–2 seconds old), the "sold out" flag, waiting-room positions and rate-limit counters. It takes the read load off the database. It is never the source of truth for who owns a seat.        |
| **Primary database**             | Handles all writes and the transactions from [section 4.4](#44-how-the-design-prevents-two-people-buying-the-same-seat): holds, orders and sales. It is the single source of truth.                                      |
| **Read replicas**                | Answer browsing and search queries so reads never slow the holds and orders on the primary.                                                                                                                              |
| **Message queue**                | Takes slow or non-urgent jobs off the request path so a purchase finishes quickly.                                                                                                                                       |
| **Workers**                      | Run queued jobs: release expired holds, email tickets, and reconcile payments with the provider. They can retry failed jobs safely.                                                                                      |
| **Payment provider**             | A third party that charges cards, so TicketHub never stores card numbers. Calls use idempotency keys.                                                                                                                    |

### 5.3 How it survives the big sale

The sale brings up to 16,700 requests per second, but only about 33 sales per second can succeed. The design protects the database and keeps the answers fast:

1. **Pre-scale before the sale.** The on-sale time is known in advance, so we add app servers, cache capacity and database connections beforehand rather than waiting for autoscaling to react.
2. **CDN absorbs page loads.** Event pages and assets are cached at the edge, removing most of the 2 million page requests from our servers.
3. **A waiting room controls the flow.** Instead of 200,000 people hitting the seat-holding code at once, only a steady stream is admitted. The load on the primary database stays at a level we have tested, and everyone else sees their place in line rather than an error.
4. **Cached seat map.** Seat availability is read from Redis (1–2 seconds old), not from the database. The seat map is only a hint; the hold in the database decides.
5. **Cheap "sold out".** When the last seat is sold, a `sold_out` flag is set in Redis and every later request is answered immediately without touching the database. This matters because about 180,000 people lose.
6. **Rate limits** protect against bots and impatient refresh clicking.
7. **Work off the request path.** Emailing tickets and releasing expired holds run through the queue, so a purchase only waits for the essentials (hold, pay, mark sold).
8. **Brief database transactions.** Each hold or order is a short transaction touching a few rows. The payment provider is never called while locks are held.

**Fairness.** A first-come, first-served race at millisecond precision favours bots and people with faster connections. Instead, everyone who joins the waiting room in the first few minutes before the sale gets a **random position**, and anyone who joins later is placed behind them in arrival order. Each account can hold at most 6 seats and have one active hold, and requests need a logged-in account, which makes bulk buying by bots harder.

### 5.4 Avoiding single points of failure

| Component                  | Protection                                                                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DNS / CDN                  | Managed, distributed services                                                                                                                                    |
| Load balancer              | Multi-zone pair with failover                                                                                                                                    |
| Waiting room / app servers | Many stateless instances in different availability zones; any can fail without losing data                                                                       |
| Redis                      | Primary with replica and automatic failover. If Redis is lost, the app falls back to the database (slower but still correct) because the cache only holds copies |
| Primary database           | A standby in another zone with automatic failover, point-in-time backups, and read replicas                                                                      |
| Queue and workers          | Replicated queue; several workers; failed jobs are retried and are safe to run twice                                                                             |

---

## 6. Trade-offs

### Trade-off 1: Waiting room (fairness and stability) vs. speed and complexity

- **Benefit:** The database sees a controlled load, bots have less advantage, and users see a clear position instead of errors.
- **Cost:** Some users wait several minutes before they can even pick seats, and the waiting room is one more system to build, test and keep available.
- **Why we accept it:** A crash during the sale would be far worse for every user and for the business than a managed wait. The admission rate can be tuned, and we keep it high enough to sell out quickly.

### Trade-off 2: Strong consistency for seats vs. horizontal scale

- **Benefit:** One relational database with transactions and constraints gives us a hard guarantee that no seat is sold twice, using simple, proven tools.
- **Cost:** All holds and orders go through one primary database, so write capacity is limited by a single machine.
- **Why we accept it:** The sale needs only about 33 successful sales (and, with the waiting room, a few hundred hold attempts) per second, which is well within one primary. If TicketHub grows, we can shard by `event_id`, because seats for different events never interact.

### Trade-off 3: Cached seat map (fast, but slightly stale) vs. always accurate

- **Benefit:** Redis serves the seat map to many thousands of users per second, so the database is not overloaded by reads.
- **Cost:** A user may see a seat as available that was taken a second ago, and their hold attempt then fails with `409`, which feels frustrating.
- **Why we accept it:** The cache is only a display hint. The atomic hold in the database makes the real decision, so stale data can cause a failed click but never a double sale. We keep the cache lifetime to 1–2 seconds and return the updated seat status with the `409` so the client can refresh the map.

### Trade-off 4: Seat holds (a fair checkout) vs. seats temporarily locked

- **Benefit:** Users can pay without losing their seat in the middle of checkout.
- **Cost:** Seats held by users who abandon checkout are unavailable for up to 5 minutes, which can slow the sell-out.
- **Why we accept it:** A short expiry (5 minutes), a limit of 6 seats per hold, and automatic release keep the cost small, and the alternative (charging the card first and apologising later) is worse.
