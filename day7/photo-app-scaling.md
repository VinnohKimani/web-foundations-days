# SnapShare System Scaling Plan

## 1. Core Assumptions & Daily Active Users (DAU)

- **Registered Users:** 10,000,000
- **Active User Percentage:** 10% daily
- **Daily Active Users (DAU):** 10,000,000 × 0.10 = 1,000,000 DAU
- **User Activity:** Each DAU uploads 1 photo/day and views 50 feed pages/day.
- **File Sizes:** Original photo = 2 MB (2,000 KB); Thumbnail = 50 KB (0.05 MB). Total storage per uploaded post = 2.05 MB.
- **Seconds per Day:** 24 hours × 60 minutes × 60 seconds = 86,400 seconds.

---

## 2. Capacity & Traffic Estimates

### Uploads Per Second

- **Daily Uploads:** 1,000,000 users × 1 photo/day = 1,000,000 uploads/day
- **Average Uploads/sec:** 1,000,000 / 86,400 ≈ **11.57 uploads/sec**
- **Peak Uploads/sec (5x peak):** 11.57 × 5 ≈ **57.87 uploads/sec**

### Feed Views Per Second

- **Daily Feed Views:** 1,000,000 users × 50 feed pages/day = 50,000,000 views/day
- **Average Feed Views/sec:** 50,000,000 / 86,400 ≈ **578.70 views/sec**
- **Peak Feed Views/sec (5x peak):** 578.70 × 5 ≈ **2,893.52 views/sec**

### Photo Storage Per Year

- **Daily Storage Added:** 1,000,000 uploads/day × 2.05 MB/upload = 2,050,000 MB/day = 2,050 GB/day = 2.05 TB/day
- **Yearly Photo Storage:** 2.05 TB/day × 365 days = **748.25 TB/year**

---

## 3. Workload Profile (Read-Heavy vs. Write-Heavy)

SnapShare is a **read-heavy** system.

The workload ratio between feed views (reads) and photo uploads (writes) is **50:1** (50,000,000 daily reads versus 1,000,000 daily writes).

### Design Implications

1. **Aggressive Caching:** We must implement memory caching (e.g., Redis) to store popular feeds and metadata, drastically reducing direct database reads.
2. **Database Read Replicas:** Primary database handles writes while multiple read replicas scale out read queries.
3. **CDN Offloading:** Photo and thumbnail media reads bypass application servers entirely by serving static assets from CDN edge locations.

---

## 4. Storage Architecture: Database vs. Object Storage

Photos and thumbnails **must not** be stored directly inside a database as binary (BLOB) data.

### Why Database Storage Fails

Storing gigabytes and terabytes of raw binary files in a relational database degrades query performance, inflates index memory requirements, creates massive database backup overhead, and increases horizontal scaling costs exponentially.

### Target Location

All raw photos and generated thumbnails are stored in an **Object Storage Service** (e.g., AWS S3 or MinIO). The database stores only lightweight structured metadata (such as `photo_id`, `user_id`, `s3_object_key`, and `created_at`).

---

## 5. System Architecture Diagram

```text
                               ┌───────────────┐
                               │  Client App   │
                               └───────┬───────┘
                                       │
                   ┌───────────────────┴───────────────────┐
                   │                                       │
           [ Media Requests ]                      [ API Requests ]
                   │                                       │
                   ▼                                       ▼
           ┌───────────────┐                       ┌───────────────┐
           │   CDN Edge    │                       │ Load Balancer │
           └───────┬───────┘                       └───────┬───────┘
                   │                                       │
                   │                               ┌───────┴───────┐
                   │                               ▼               ▼
                   │                        ┌─────────────┐ ┌─────────────┐
                   │                        │ App Server 1│ │ App Server 2│
                   │                        └──────┬──────┘ └──────┬──────┘
                   │                               │               │
                   │                 ┌─────────────┼───────────────┤
                   │                 │             │               │
                   │                 ▼             ▼               ▼
                   │         ┌──────────────┐  ┌───────┐  ┌────────────────┐
                   │         │ Object Store │  │ Cache │  │ Primary DB (W) │
                   │         │ (S3 / Blob)  │  └───────┘  └───────┬────────┘
                   │         └───────▲──────┘                     │
                   │                 │                            ▼
                   │         ┌───────┴──────┐             ┌────────────────┐
                   │         │ Queue Worker │             │ Read Replica(R)│
                   │         └───────▲──────┘             └────────────────┘
                   │                 │
                   │         ┌───────┴──────┐
                   │         │ Message Queue│
                   │         └──────────────┘
```

---

## 6. Component Explanations

- **CDN:** Delivers static photos and thumbnails from edge nodes close to users to reduce latency and origin server bandwidth.
- **Load Balancer:** Distributes incoming HTTP API requests evenly across application servers to prevent any single server from becoming a bottleneck.
- **App Servers:** Process business logic, user authentication, upload workflows, and client API endpoints.
- **Cache (Redis):** Serves cached user feeds, session data, and frequent metadata queries from memory to deliver sub-millisecond response times.
- **Primary Database:** Handles data writes and maintains data integrity for users, post relations, and photo metadata.
- **Read Replica:** Scales read query capacity by offloading read-only traffic from the primary database.
- **Object Storage:** Provides scalable, highly available, and cost-effective cloud storage for raw image files and processed thumbnails.
- **Message Queue:** Offloads long-running thumbnail generation tasks asynchronously from the main HTTP upload request path.
- **Queue Worker:** Consumes background jobs from the queue to process image transformations and generate 50 KB thumbnails.

---

## 7. Step-by-Step Photo Upload Flow

1. **Client Submission:** The client issues a `POST /photos` upload request containing image data to the Load Balancer, which routes it to an App Server.
2. **Object Upload:** The App Server uploads the raw 2 MB photo directly to Object Storage and receives a unique file key.
3. **Database Insertion:** The App Server inserts a new metadata record into the Primary Database with status set to `processing`.
4. **Queue Enqueueing:** The App Server places a `generate_thumbnail` job into the Message Queue containing the `photo_id` and raw image storage key.
5. **Immediate Client Response:** The App Server returns a `201 Created` HTTP response to the client immediately without waiting for thumbnail processing.
6. **Async Thumbnail Processing:** A Queue Worker picks up the job, retrieves the 2 MB photo from Object Storage, generates the 50 KB thumbnail, and saves it back to Object Storage.
7. **Database & Cache Update:** The Queue Worker updates the photo metadata status to `ready` with the thumbnail URI in the Primary Database and invalidates relevant feed caches.

---

## 8. System Trade-Offs

### Eventual Consistency vs. Immediate Consistency (Feed Caching)

- **Trade-off:** Serving feeds from distributed read replicas and Redis caches means followers may experience a slight delay (a few seconds) before seeing a newly published photo.
- **Justification:** High availability and fast read response times are significantly more critical for a social photo feed than immediate global consistency.

### Asynchronous Background Processing vs. Synchronous Processing

- **Trade-off:** Offloading thumbnail generation to a message queue adds infrastructure complexity, requiring worker management and retry handling.
- **Justification:** Synchronous image processing during the HTTP request lifecycle would tie up server connection pools, cause request timeouts, and severely degrade user experience during traffic spikes.
