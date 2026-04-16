# EventScale Architecture & System Analysis
*A Hybrid High-Concurrency Event Registration Platform*

## 1. Motivation & Problem Statement
Modern event ticketing systems operate smoothly until highly anticipated events ("drop events") go live. This creates a **Thundering Herd Problem**: thousands of users attempt to purchase a strictly limited inventory within milliseconds.

Traditional monolith systems relying entirely on Relational Databases (like standard PostgreSQL or MySQL) fail during these traffic spikes due to:
- **Race Conditions:** Two users read that `1` seat is available simultaneously, and both are allowed to book it, causing severe **overselling**.
- **Database Thrashing:** High simultaneous read/write locks on the same SQL row cause the database to block, spike in latency, and eventually crash.
- **Heavy Read Strain:** Thousands of users rapidly hitting refresh to check ticket availability unnecessarily cripples backend relational engines.

## 2. Core Objective
**EventScale** solves these bottlenecks by implementing a highly scalable **Hybrid Database Architecture**. It offloads volatile, high-velocity transactions to an in-memory datastore while preserving critical user ledgers in a relational schema.

## 3. The Solution Architecture
The system decouples the "booking" logic from the "ledger" logic by pairing **PostgreSQL** with **Redis**.

### A. PostgreSQL (The Ledger)
Acts as the **immutable source of truth**. It strictly handles persistent, relational, and business-critical data where ACID compliance is non-negotiable:
- User Identity & Authentication (JWTs)
- Event Metadata & Organizers
- Financial Payments Ledger
- Final Booking Confirmations

### B. Redis (The Accelerator & Enforcer)
Acts as the **volatile memory layer** directly handling the brunt of the high-concurrency traffic:
- **Cache-Aside Reads:** Heavy read operations (like loading the event dashboard) bypass Postgres entirely and fetch cached JSON directly from Redis, dropping latency from hundreds of milliseconds to `< 2ms`.
- **Concurrency Control Engine:** Handles the volatile seat inventory counts.

## 4. How It Solves Race Conditions (The "Secret Sauce")
To guarantee absolute zero overselling, EventScale leverages **Single-Threaded Atomic Lua Scripting** in Redis.

**The Workflow:**
1. A user attempts to book a ticket.
2. The Node.js API hits Redis with a raw Lua script. 
3. Because Redis operates uniformly on a single thread, it securely queues the 50,000 incoming requests and processes them one-by-one in microseconds.
4. Intimately within Redis memory, the script performs a strict **Check-And-Decrement**: *Is capacity > requested? If yes, decrement. If no, reject.* 
5. This is **Atomic**. There is no window of time between checking the seat boundary and mutating it for another user to sneak in.
6. The user receives a sub-millisecond rejection (`409 Conflict`) if the event is full, **without ever querying or taxing PostgreSQL.**
7. If Redis approves the transaction, the API then proceeds to safely append the receipt to the PostgreSQL database.

## 5. Resilient Engineering (Graceful Degradation)
EventScale is engineered for High Availability. If the Redis infrastructure catastrophically fails or goes offline, the Node.js backend seamlessly catches the failure state and dynamically degrades into **DB-Only Mode**. 
- The system continues to operate by redirecting capacity checks through PostgreSQL aggregations. 
- The business remains online, prioritizing survival over pure speed until Redis is restored.

## 6. Real-time Architecture Visualizer
To strictly prove the backend logic, EventScale includes a dedicated frontend dashboard injected with Server-Sent Events (SSE). 
- It allows stakeholders to manually **Reseed the Database**, flushing memory layers clean.
- It triggers deliberate **Concurrency Stress Tests**—firing synchronous booking arrays simultaneously and directly capturing and visualizing the backend's exact instantaneous queue and Atomic Rejection rate on the frontend.
