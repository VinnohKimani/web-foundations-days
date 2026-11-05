# Power Learn Project (PLP) — Web & Software Engineering Foundations

A comprehensive repository documenting hands-on projects, assignments, and architectural designs completed during the **Power Learn Project (PLP)** Web Foundations program. 

This repository traces a complete developer progression: from foundational web technologies (HTML5, CSS3, JavaScript) and asynchronous client-server communication, to relational database modeling with SQL, high-scale system capacity planning, and concurrent distributed system architecture.

---

## 📚 Curriculum & Assignment Overview

| Day | Topic / Focus | Core Deliverables & Technologies | Key Highlights |
| :--- | :--- | :--- | :--- |
| **Day 1** | **Semantic Web Markup** | `day1/index.html`<br>`day1/about.html` | Semantic HTML5 structure, accessible forms, multi-page site navigation. |
| **Day 2** | **Modern CSS Styling** | `day2/style.css`<br>`day2/index.html` | Flexbox layout, responsive navigation, box-model resets, modern UI styling. |
| **Day 3** | **JavaScript Data Logic** | `day3/scripts.js`<br>`day3/index.html` | Array processing, filtering, aggregation with `reduce`, validation rules, test suites. |
| **Day 4** | **DOM & UI Interaction** | `day4/script.js`<br>`day4/style.css` | Real-time character & word counters, warning state classes, dark/light theme toggle. |
| **Day 5** | **Async JS & API Design** | `day5/users.js`<br>`day5/library-api.md` | Fetch API consumption, real-time client search filter, RESTful Library API specification. |
| **Day 6** | **Relational Databases (SQL)** | `day6/school.sql`<br>`day6/school-design.md` | Normalized SQLite schema, many-to-many junction tables, JOIN queries, index justification. |
| **Day 7** | **System Scaling & Estimates** | `day7/photo-app-scaling.md` | 1M DAU capacity planning for SnapShare, QPS calculations, storage projections (748 TB/yr). |
| **Day 8** | **Capstone System Design** | `day8/ticketing-design.md`<br>`day8/reflection.md` | TicketHub high-concurrency event ticketing system, double-booking prevention, reflection. |

---

## 📂 Day-by-Day Breakdown

### 🔹 [Day 1: Semantic HTML5 Structure](./day1/)
- **Project**: *QuickNotes* (Base HTML)
- **Concepts**: Semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`), structured forms for capturing input, and cross-page navigation between Home and About pages.
- **Key Files**:
  - [`day1/index.html`](./day1/index.html): Main note entry dashboard and list structure.
  - [`day1/about.html`](./day1/about.html): Information page detailing application purpose.

### 🔹 [Day 2: CSS Layouts & Visual Hierarchy](./day2/)
- **Project**: *QuickNotes* (Styled UI)
- **Concepts**: CSS Box Model, global reset (`box-sizing: border-box`), Flexbox alignment, accessible typography, card-based layout styling, button interactions, and hover micro-interactions.
- **Key Files**:
  - [`day2/style.css`](./day2/style.css): Custom stylesheet incorporating color palettes, flex containers, and responsive form components.
  - [`day2/index.html`](./day2/index.html) & [`day2/about.html`](./day2/about.html): Linked pages with clean modern presentation.

### 🔹 [Day 3: JavaScript Core & Data Structures](./day3/)
- **Project**: *Notes Toolkit*
- **Concepts**: Functional array methods (`filter`, `reduce`, `some`, `map`), string normalization, object frequency mapping, input validation, and unit-style console assertions.
- **Key Functions in [`day3/scripts.js`](./day3/scripts.js)**:
  - `searchNotes(word)`: Case-insensitive sub-string filtering.
  - `longestNote()`: Accumulator search for character length using `reduce`.
  - `countByCategory()`: Category frequency counter.
  - `getSummary()`: Formatted natural-language string with singular/plural inflection.
  - `isDuplicate(text)`: Whitespace- and case-insensitive uniqueness check.
  - `addNote(text, category)`: Strict validator enforcing allowed categories and length constraints.

### 🔹 [Day 4: DOM Events & Dynamic UI](./day4/)
- **Project**: *Interactive Note Editor*
- **Concepts**: DOM event listeners (`input`, `click`), dynamic CSS class toggling based on numeric thresholds, CSS custom properties (`:root` variables) for theming, and dark mode toggling.
- **Features in [`day4/script.js`](./day4/script.js)**:
  - Live character counter (`X / 200 characters`) with warning states (orange at >180, red at >200).
  - Accurate live word counter handling multi-whitespace and empty inputs.
  - Dark mode / Light mode persistent toggle altering custom property tokens.
  - Clear button resetting state and updating counters synchronously.

### 🔹 [Day 5: Asynchronous JavaScript & REST API Architecture](./day5/)
- **Project**: *User Directory & Library REST API Design*
- **Concepts**: Consuming third-party JSON APIs using `fetch`, `async/await` handling, loading and error states in the UI, client-side filtering without refetching, and RESTful API endpoint design.
- **Key Deliverables**:
  - [`day5/users.js`](./day5/users.js) / [`day5/index.html`](./day5/index.html): Fetches user records from JSONPlaceholder, displays status feedback, and provides an instant client-side search filter by name.
  - [`day5/library-api.md`](./day5/library-api.md): Industry-standard REST specification covering CRUD operations (`GET`, `POST`, `PUT`, `DELETE`), URL path conventions, query parameters (`?author=...`), HTTP status codes, and error formats.

### 🔹 [Day 6: Relational Database Modeling & SQL](./day6/)
- **Project**: *School Management Database*
- **Concepts**: Relational database architecture, 3NF normalization, Many-to-Many (`N:M`) modeling via junction tables, foreign key constraints (`ON DELETE CASCADE`), database indexing, and SQL vs. NoSQL evaluation.
- **Key Deliverables**:
  - [`day6/school.sql`](./day6/school.sql): DDL and DML script for SQLite with `students`, `courses`, and `enrolments` tables, sample data seeding, and real-world queries (`JOIN`, `LEFT JOIN`, `GROUP BY`, `COUNT`, conditional updates).
  - [`day6/school-design.md`](./day6/school-design.md): In-depth architectural writeup explaining entity relationships, why join tables are necessary, index selection rationale, and SQL selection justification over NoSQL.

### 🔹 [Day 7: System Scaling & Capacity Planning](./day7/)
- **Project**: *SnapShare Photo-Sharing Platform Architecture*
- **Concepts**: Back-of-the-envelope estimations, Daily Active Users (DAU) modelling, peak traffic calculation (5x burst), storage requirement forecasting, read vs. write workload profiling, caching tiers, and CDN distribution.
- **Key Deliverable**:
  - [`day7/photo-app-scaling.md`](./day7/photo-app-scaling.md):
    - **Scale**: 10,000,000 registered users, 1,000,000 DAU.
    - **Throughput**: ~11.57 uploads/sec average (57.87 peak); ~578.7 views/sec average (2,893.5 peak).
    - **Storage**: 2.05 TB/day $\rightarrow$ ~748.25 TB/year.
    - **Architecture Strategy**: Cloud object storage (e.g., S3), global CDN edge caching, Redis caching for user feeds, and write-through thumbnail processing pipelines.

### 🔹 [Day 8: Capstone System Design & Reflection](./day8/)
- **Project**: *TicketHub High-Concurrency Ticketing Platform & Learning Reflection*
- **Concepts**: Distributed systems design, peak flash-sale handling (200,000 users attempting to buy 20,000 seats in 10 minutes), concurrency control, short-lived seat holds, ACID transaction isolation, and preventing double-booking.
- **Key Deliverables**:
  - [`day8/ticketing-design.md`](./day8/ticketing-design.md): End-to-end 6-part system design covering functional and non-functional requirements, traffic math, API contracts, relational data models with atomic conditional updates, virtual waiting rooms, Redis seat-hold mechanisms, and payment webhook reconciliation.
  - [`day8/reflection.md`](./day8/reflection.md): Retrospective covering key engineering takeaways (understanding scale, concurrency, queues), areas for future improvement, and next steps in cloud infrastructure and load testing.

---

## 📁 Repository Structure

```text
.
├── day1/
│   ├── index.html              # QuickNotes semantic HTML home
│   └── about.html              # QuickNotes semantic about page
├── day2/
│   ├── index.html              # QuickNotes styled home
│   ├── about.html              # QuickNotes styled about page
│   └── style.css               # Flexbox & responsive styling
├── day3/
│   ├── index.html              # Notes Toolkit test harness
│   └── scripts.js              # Array manipulation & validation algorithms
├── day4/
│   ├── index.html              # Interactive note editor UI
│   ├── style.css               # Themed UI with CSS variables
│   └── script.js               # Real-time event listeners & theme toggling
├── day5/
│   ├── index.html              # User directory dashboard
│   ├── users.js                # Async fetch & filter implementation
│   └── library-api.md          # RESTful Library API technical specification
├── day6/
│   ├── school.sql              # Schema, constraints, seed data & queries
│   └── school-design.md        # Database schema design & index analysis
├── day7/
│   └── photo-app-scaling.md    # Capacity planning & scaling architecture
├── day8/
│   ├── ticketing-design.md     # TicketHub distributed system design
│   └── reflection.md           # Program learning reflection & retrospective
└── README.md                   # Repository documentation
```

---

## 🚀 Getting Started & Execution

### 1. Web Projects (Days 1, 2, 4, 5)
Simply open any `index.html` file in your preferred web browser, or use a local development server (such as VS Code Live Server or Python's HTTP server):

```bash
# Example: Run a quick local server from the root directory
python3 -m http.server 8000
```
Navigate to `http://localhost:8000/day4/index.html` or `http://localhost:8000/day5/index.html`.

### 2. JavaScript Algorithms (Day 3)
Run the script using [Node.js](https://nodejs.org/) or view the browser console in `day3/index.html`:

```bash
node day3/scripts.js
```

### 3. Database & SQL Queries (Day 6)
Execute the SQL script using [SQLite](https://www.sqlite.org/):

```bash
# Run schema creation, insertions, and analytical queries in SQLite
sqlite3 :memory: < day6/school.sql
```

---

## 🛠 Skills & Technologies

- **Frontend Development**: HTML5, CSS3, Flexbox, CSS Custom Properties, Vanilla JavaScript (ES6+), DOM Manipulation, Event Handling.
- **Asynchronous Programming & APIs**: Fetch API, Promises, Async/Await, RESTful API Design, JSON Data Exchange.
- **Databases & Data Modeling**: Relational Schema Design, SQLite/PostgreSQL principles, Foreign Keys, Normalization, Junction Tables, Indexing.
- **System Design & Architecture**: Capacity & Bandwidth Estimation, High-Concurrency Strategies, Distributed Locking, Caching (Redis/CDN), Double-Booking Prevention.

