# SnapShare System Scaling Plan

## 1. Core Assumptions & Daily Active Users (DAU)

- **Registered Users:** 10,000,000
- **Active User Ratio:** 10% active daily[cite: 14, 15]
- **Daily Active Users (DAU):** $10,000,000 \times 0.10 = 1,000,000\text{ users/day}$[cite: 14, 15]
- **User Activity:** Each DAU uploads 1 photo/day and views 50 feed pages/day[cite: 14, 15].
- **File Sizes:** Original photo average = 2 MB ($2,000\text{ KB}$); Thumbnail = 50 KB ($0.05\text{ MB}$)[cite: 14, 15]. Total storage per upload = 2.05 MB[cite: 14, 15].
- **Seconds per Day:** $24 \times 60 \times 60 = 86,400\text{ seconds}$.

---

## 2. Capacity Estimates & Traffic Calculations

### Uploads Per Second

- **Daily Uploads:** $1,000,000 \times 1 = 1,000,000\text{ uploads/day}$[cite: 14, 15]
- **Average Uploads/sec:** $1,000,000 / 86,400 \approx 11.57\text{ uploads/sec}$
- **Peak Uploads/sec ($5\times$ multiplier):** $11.57 \times 5 \approx 57.87\text{ uploads/sec}$[cite: 14, 15]

### Feed Views Per Second

- **Daily Feed Views:** $1,000,000 \times 50 = 50,000,000\text{ views/day}$[cite: 14, 15]
- **Average Views/sec:** $50,000,000 / 86,400 \approx 578.70\text{ views/sec}$
- **Peak Views/sec ($5\times$ multiplier):** $578.70 \times 5 \approx 2,893.52\text{ views/sec}$[cite: 14, 15]

### Photo Storage Per Year

- **Daily Storage Added:** $1,000,000 \text{ photos/day} \times 2.05\text{ MB/photo} = 2,050,000\text{ MB/day} = 2.05\text{ TB/day}$[cite: 14, 15]
- **Yearly Storage Added ($365\text{ days}$):** $2.05\text{ TB/day} \times 365 = 748.25\text{ TB/year}$

---

## 3. Read vs. Write Workload Profile

SnapShare is heavily **read-heavy**[cite: 14, 15]. The ratio of feed views (read operations) to photo uploads (write operations) is $50:1$ ($50,000,000\text{ reads}$ vs. $1,000,000\text{ writes}$ per day)[cite: 14, 15].

### Architectural Design Implications

Because reads outnumber writes by 50 to 1[cite: 14, 15]:

1. **Aggressive Caching:** Frequently accessed feeds, user profile details, and photo metadata must be cached in memory (e.g., Redis) to keep read latency sub-millisecond and offload the primary database.
2. **Read Replicas:** Database writes are isolated to a single primary database, while read traffic is distributed across multiple read-only database replicas.
3. **CDN Integration:** Image files (photos and thumbnails) are served almost exclusively via a Content Delivery Network (CDN) directly to clients, bypassing application servers for static content reads[cite: 14].

---

## 4. Storage Architecture Choice: Database vs. Object Storage

Photos should **never** be stored directly inside a relational database as BLOB data[cite: 14, 15].

### Why Database Storage Fails

- Binary data bloats database backups, index memory, and disk space dramatically, degrading query performance.
- Relational databases are expensive to scale horizontally for multi-terabyte file workloads.

### Target Location

Photos and thumbnails must be stored in an **Object Storage Service** (such as AWS S3 or MinIO)[cite: 14]. Only the file metadata (such as `photo_id`, `user_id`, `s3_url`, `created_at`) is saved in the relational database.

---

## 5. System Architecture Diagram

# SnapShare System Scaling Plan

## 1. Core Assumptions & Daily Active Users (DAU)

- **Registered Users:** 10,000,000
- **Active User Ratio:** 10% active daily[cite: 14, 15]
- **Daily Active Users (DAU):** $10,000,000 \times 0.10 = 1,000,000\text{ users/day}$[cite: 14, 15]
- **User Activity:** Each DAU uploads 1 photo/day and views 50 feed pages/day[cite: 14, 15].
- **File Sizes:** Original photo average = 2 MB ($2,000\text{ KB}$); Thumbnail = 50 KB ($0.05\text{ MB}$)[cite: 14, 15]. Total storage per upload = 2.05 MB[cite: 14, 15].
- **Seconds per Day:** $24 \times 60 \times 60 = 86,400\text{ seconds}$.

---

## 2. Capacity Estimates & Traffic Calculations

### Uploads Per Second

- **Daily Uploads:** $1,000,000 \times 1 = 1,000,000\text{ uploads/day}$[cite: 14, 15]
- **Average Uploads/sec:** $1,000,000 / 86,400 \approx 11.57\text{ uploads/sec}$
- **Peak Uploads/sec ($5\times$ multiplier):** $11.57 \times 5 \approx 57.87\text{ uploads/sec}$[cite: 14, 15]

### Feed Views Per Second

- **Daily Feed Views:** $1,000,000 \times 50 = 50,000,000\text{ views/day}$[cite: 14, 15]
- **Average Views/sec:** $50,000,000 / 86,400 \approx 578.70\text{ views/sec}$
- **Peak Views/sec ($5\times$ multiplier):** $578.70 \times 5 \approx 2,893.52\text{ views/sec}$[cite: 14, 15]

### Photo Storage Per Year

- **Daily Storage Added:** $1,000,000 \text{ photos/day} \times 2.05\text{ MB/photo} = 2,050,000\text{ MB/day} = 2.05\text{ TB/day}$[cite: 14, 15]
- **Yearly Storage Added ($365\text{ days}$):** $2.05\text{ TB/day} \times 365 = 748.25\text{ TB/year}$

---

## 3. Read vs. Write Workload Profile

SnapShare is heavily **read-heavy**[cite: 14, 15]. The ratio of feed views (read operations) to photo uploads (write operations) is $50:1$ ($50,000,000\text{ reads}$ vs. $1,000,000\text{ writes}$ per day)[cite: 14, 15].

### Architectural Design Implications

Because reads outnumber writes by 50 to 1[cite: 14, 15]:

1. **Aggressive Caching:** Frequently accessed feeds, user profile details, and photo metadata must be cached in memory (e.g., Redis) to keep read latency sub-millisecond and offload the primary database.
2. **Read Replicas:** Database writes are isolated to a single primary database, while read traffic is distributed across multiple read-only database replicas.
3. **CDN Integration:** Image files (photos and thumbnails) are served almost exclusively via a Content Delivery Network (CDN) directly to clients, bypassing application servers for static content reads[cite: 14].

---

## 4. Storage Architecture Choice: Database vs. Object Storage

Photos should **never** be stored directly inside a relational database as BLOB data[cite: 14, 15].

### Why Database Storage Fails

- Binary data bloats database backups, index memory, and disk space dramatically, degrading query performance.
- Relational databases are expensive to scale horizontally for multi-terabyte file workloads.

### Target Location

Photos and thumbnails must be stored in an **Object Storage Service** (such as AWS S3 or MinIO)[cite: 14]. Only the file metadata (such as `photo_id`, `user_id`, `s3_url`, `created_at`) is saved in the relational database.

---

## 5. System Architecture Diagram

# SnapShare System Scaling Plan

## 1. Core Assumptions & Daily Active Users (DAU)

- **Registered Users:** 10,000,000
- **Active User Ratio:** 10% active daily[cite: 14, 15]
- **Daily Active Users (DAU):** $10,000,000 \times 0.10 = 1,000,000\text{ users/day}$[cite: 14, 15]
- **User Activity:** Each DAU uploads 1 photo/day and views 50 feed pages/day[cite: 14, 15].
- **File Sizes:** Original photo average = 2 MB ($2,000\text{ KB}$); Thumbnail = 50 KB ($0.05\text{ MB}$)[cite: 14, 15]. Total storage per upload = 2.05 MB[cite: 14, 15].
- **Seconds per Day:** $24 \times 60 \times 60 = 86,400\text{ seconds}$.

---

## 2. Capacity Estimates & Traffic Calculations

### Uploads Per Second

- **Daily Uploads:** $1,000,000 \times 1 = 1,000,000\text{ uploads/day}$[cite: 14, 15]
- **Average Uploads/sec:** $1,000,000 / 86,400 \approx 11.57\text{ uploads/sec}$
- **Peak Uploads/sec ($5\times$ multiplier):** $11.57 \times 5 \approx 57.87\text{ uploads/sec}$[cite: 14, 15]

### Feed Views Per Second

- **Daily Feed Views:** $1,000,000 \times 50 = 50,000,000\text{ views/day}$[cite: 14, 15]
- **Average Views/sec:** $50,000,000 / 86,400 \approx 578.70\text{ views/sec}$
- **Peak Views/sec ($5\times$ multiplier):** $578.70 \times 5 \approx 2,893.52\text{ views/sec}$[cite: 14, 15]

### Photo Storage Per Year

- **Daily Storage Added:** $1,000,000 \text{ photos/day} \times 2.05\text{ MB/photo} = 2,050,000\text{ MB/day} = 2.05\text{ TB/day}$[cite: 14, 15]
- **Yearly Storage Added ($365\text{ days}$):** $2.05\text{ TB/day} \times 365 = 748.25\text{ TB/year}$

---

## 3. Read vs. Write Workload Profile

SnapShare is heavily **read-heavy**[cite: 14, 15]. The ratio of feed views (read operations) to photo uploads (write operations) is $50:1$ ($50,000,000\text{ reads}$ vs. $1,000,000\text{ writes}$ per day)[cite: 14, 15].

### Architectural Design Implications

Because reads outnumber writes by 50 to 1[cite: 14, 15]:

1. **Aggressive Caching:** Frequently accessed feeds, user profile details, and photo metadata must be cached in memory (e.g., Redis) to keep read latency sub-millisecond and offload the primary database.
2. **Read Replicas:** Database writes are isolated to a single primary database, while read traffic is distributed across multiple read-only database replicas.
3. **CDN Integration:** Image files (photos and thumbnails) are served almost exclusively via a Content Delivery Network (CDN) directly to clients, bypassing application servers for static content reads[cite: 14].

---

## 4. Storage Architecture Choice: Database vs. Object Storage

Photos should **never** be stored directly inside a relational database as BLOB data[cite: 14, 15].

### Why Database Storage Fails

- Binary data bloats database backups, index memory, and disk space dramatically, degrading query performance.
- Relational databases are expensive to scale horizontally for multi-terabyte file workloads.

### Target Location

Photos and thumbnails must be stored in an **Object Storage Service** (such as AWS S3 or MinIO)[cite: 14]. Only the file metadata (such as `photo_id`, `user_id`, `s3_url`, `created_at`) is saved in the relational database.

---

## 5. System Architecture Diagram

```text
                              ┌────────────────┐
                              │  Client / Web  │
                              └───────┬────────┘
                                      │
                   ┌──────────────────┴──────────────────┐
                   │                                     │
             [ Media Requests ]                 [ API Requests ]
                   │                                     │
                   ▼                                     ▼
           ┌───────────────┐                    ┌─────────────────┐
           │   CDN Edge    │                    │  Load Balancer  │
           └───────┬───────┘                    └────────┬────────┘
                   │                                     │
                   │                             ┌───────┴───────┐
                   │                             ▼               ▼
                   │                      ┌─────────────┐ ┌─────────────┐
                   │                      │ App Server 1│ │ App Server 2│
                   │                      └──────┬──────┘ └──────┬──────┘
                   │                             │               │
                   │                ┌────────────┼───────────────┤
                   │                │            │               │
                   │                ▼            ▼               ▼
                   │        ┌──────────────┐ ┌───────┐ ┌──────────────────┐
                   │        │ Object Store │ │ Cache │ │ Primary DB (W)   │
                   │        │  (S3 / Blob) │ └───────┘ └────────┬─────────┘
                   │        └───────▲──────┘                    │ (Sync)
                   │                │                           ▼
                   │        ┌───────┴──────┐           ┌──────────────────┐
                   │        │ Queue Worker │           │ Read Replica (R) │
                   │        └───────▲──────┘           └──────────────────┘
                   │                │
                   │        ┌───────┴──────┐
                   │        │ Message Queue│
                   │        └──────────────┘
```

## 6. Component Explanations

1. **CDN:** Caches and serves static photo files and thumbnails from edge locations close to users to reduce latency and origin bandwidth[cite: 14].
2. **Load Balancer:** Evenly distributes incoming HTTP API traffic across multiple application servers to prevent any single server bottleneck[cite: 14].
3. **App Servers:** Executes business logic, handles authentication, routes API requests, and processes photo upload submissions[cite: 14].
4. **Cache (Redis/Memcached):** Stores frequently retrieved feed data and user sessions in memory to deliver sub-millisecond response times[cite: 14].
5. **Database with Read Replica:** Handles write operations on the primary node while scaling read queries across replicas to ensure data persistence[cite: 14].
6. **Object Storage:** Scalably and cost-effectively stores raw image files and processed thumbnails outside the database layer[cite: 14].
7. **Message Queue:** Decouples heavy asynchronous background tasks from the main upload HTTP request cycle[cite: 14].
8. **Queue Worker:** Consumes background processing tasks from the message queue to generate optimized 50 KB thumbnail images[cite: 14, 15].

---

## 7. Step-by-Step Photo Upload Flow

1. **Client Request:** The user selects a photo and sends a `POST /photos` upload request containing image data to the Load Balancer, which forwards it to an App Server[cite: 14].
2. **Raw File Storage:** The App Server uploads the original 2 MB photo file directly to the Object Storage bucket and receives a unique object URI[cite: 14, 15].
3. **Database Record Creation:** The App Server writes the initial photo metadata (e.g., `user_id`, `photo_url`, `status: pending`) to the Primary Database[cite: 14].
4. **Task Enqueueing:** The App Server publishes a `generate_thumbnail` background task (containing `photo_id` and raw object URI) to the Message Queue[cite: 14].
5. **Fast HTTP Response:** The App Server immediately returns a `201 Created` status to the client without waiting for thumbnail generation to finish.
6. **Async Worker Processing:** A Queue Worker picks up the job from the queue, fetches the 2 MB photo, generates a 50 KB thumbnail, and uploads the thumbnail to Object Storage[cite: 14, 15].
7. **Final Metadata & Cache Invalidation:** The Worker updates the photo record in the Primary Database with the `thumbnail_url`, marks status as `ready`, and invalidates relevant feed caches[cite: 14].

---

## 8. System Architecture Trade-Offs

1. **Eventual Consistency vs. Strong Consistency (Feed Updates):**
   - _Trade-off:_ By serving user feeds from distributed read replicas and caches, a newly uploaded photo may take a few seconds to appear in a follower's feed.
   - _Justification:_ Prioritizing high availability and low read latency outweighs the strict necessity for immediate global read consistency in a social photo-sharing app.

2. **Asynchronous Thumbnail Processing vs. Synchronous Processing:**
   - _Trade-off:_ Offloading thumbnail generation to a background queue adds system infrastructure complexity (queues, worker pools, error retry logic)[cite: 14].
   - _Justification:_ Synchronous image processing during the HTTP upload request would block app servers, increase request timeouts, and severely degrade end-user performance during peak upload bursts[cite: 14, 15].
