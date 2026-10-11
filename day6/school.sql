-- Disable foreign key constraints during table creation/cleanup
PRAGMA foreign_keys = ON;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- 1. Create students table
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- 2. Create courses table
CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

-- 3. Create enrolments table (Join table)
CREATE TABLE enrolments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE (student_id, course_id) -- Prevents duplicate enrollment for the same course
);

-- Insert Sample Data: At least 3 students, 3 courses, and 5 enrolments
INSERT INTO students (name, email) VALUES
('Alice Smith', 'alice@example.com'),
('Bob Jones', 'bob@example.com'),
('Charlie Brown', 'charlie@example.com'),
('David Miller', 'david@example.com'); -- Added 4th student to demonstrate "no enrolments" query

INSERT INTO courses (title, code) VALUES
('Web Development Foundations', 'CS101'),
('Database Systems', 'CS102'),
('Software Engineering', 'CS103');

INSERT INTO enrolments (student_id, course_id, grade) VALUES
(1, 1, 'A'),
(1, 2, 'B'),
(2, 1, 'B'),
(2, 3, 'A'),
(3, 2, 'C');



-- Query 1: All courses for one student (by name)
SELECT c.id, c.title, c.code, e.grade
FROM courses c
JOIN enrolments e ON c.id = e.course_id
JOIN students s ON s.id = e.student_id
WHERE s.name = 'Alice Smith';

-- Query 2: All students on one course (by course title)
SELECT s.id, s.name, s.email, e.grade
FROM students s
JOIN enrolments e ON s.id = e.student_id
JOIN courses c ON c.id = e.course_id
WHERE c.title = 'Web Development Foundations';

-- Query 3: The number of students per course
SELECT c.title, COUNT(e.student_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON c.id = e.course_id
GROUP BY c.id, c.title;

-- Query 4: Students who have no enrolments
SELECT s.id, s.name, s.email
FROM students s
LEFT JOIN enrolments e ON s.id = e.student_id
WHERE e.id IS NULL;

-- Query 5: Update of one enrolment's grade
UPDATE enrolments
SET grade = 'A+'
WHERE student_id = 1 AND course_id = 2;