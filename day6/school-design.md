# School Database Architecture & Design

## Table Explanations

- **`students`**: Stores core information about registered students, including a primary key (`id`), full `name`, and a unique `email` address.
- **`courses`**: Stores information on available academic courses, including a primary key (`id`), descriptive `title`, and a unique course `code`.
- **`enrolments`**: Acts as a join (junction) table managing student registrations across courses. It stores primary keys referencing both `students` and `courses`, alongside specific enrollment attributes like `grade`.

---

## Entity Relationships & Join Table Necessity

- **One-to-Many Relationships:** A single student can have multiple enrollment records, and a single course can have multiple enrollment records.
- **Many-to-Many Relationship:** The direct relationship between `students` and `courses` is **many-to-many**, because one student can enroll in multiple courses, and one course can contain multiple students.
- **Why a Join Table is Needed:** Relational databases cannot natively represent many-to-many relationships in a single table without severe data redundancy or violating normal forms. The `enrolments` join table breaks the many-to-many relationship down into two separate one-to-many relationships (`students` $\rightarrow$ `enrolments` and `courses` $\rightarrow$ `enrolments`), while providing a natural place to store relationship-specific attributes such as `grade`.

---

## Index Selection & Justification

- **Index Created:** `CREATE INDEX idx_enrolments_student_id ON enrolments(student_id);`
- **Reasoning:** In academic management systems, querying all courses and grades for a specific student is an extremely frequent operation. Without an index, the database engine must perform a full table scan on `enrolments` for every student lookup. Indexing `student_id` significantly improves JOIN performance for student-centric queries as dataset size grows.

---

## SQL vs. NoSQL Selection

For a school management system, **SQL** is the superior architectural choice. School databases rely heavily on strict relational integrity, complex multi-table joins (e.g., retrieving schedules, transcripts, and enrollment counts), and transaction guarantees (ACID compliance) to prevent anomalies like duplicate course registrations or orphan records. NoSQL document stores lack native foreign key enforcement and relational join efficiency, making SQL the standard choice for structured domain models.
