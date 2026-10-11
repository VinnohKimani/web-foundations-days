# Library Books REST API Design

## Endpoints

### 1. List All Books

- **Method:** GET
- **Path:** `/api/v1/books`
- **Description:** Retrieves a list of all available books in the library.
- **Success Status Code:** 200 OK

### 2. Get Single Book

- **Method:** GET
- **Path:** `/api/v1/books/:id`
- **Description:** Retrieves detailed information for a specific book by ID.
- **Success Status Code:** 200 OK

### 3. Create Book

- **Method:** POST
- **Path:** `/api/v1/books`
- **Description:** Creates and adds a new book record to the library catalog.
- **Request Body:**

```json
{
  "title": "The Pragmatic Programmer",
  "author": "Andrew Hunt",
  "isbn": "978-0201616224",
  "publishedYear": 1999
}
Success Status Code: 201 Created
```

### 4. Update Book

- **Method:** PUT
- **Path:** `/api/v1/books/:id`
- **Description:** Updates all details of an existing book by its ID.
- **Request Body:**

```JSON
{
  "title": "The Pragmatic Programmer: 20th Anniversary Edition",
  "author": "Andrew Hunt & David Thomas",
  "isbn": "978-0135957059",
  "publishedYear": 2019
}
Success Status Code: 200 OK
```

### 5. Delete Book

- **Method:** DELETE
- **Path:** `/api/v1/books/:id`
- **Lescription:** Removes a book record from the library catalog by ID.
- **Success Status Code:** 200 OK

### 6. Filter Books by Author

- **Method:** GET
- **Path:** `/api/v1/books?author=Andrew%20Hunt`
- **Description:** Retrieves books filtered by a specific author using a query parameter.
- **Success Status Code:** 200 OK

### Common Error Codes

- **400 Bad Request:** Occurs when a POST or PUT request payload is missing required fields (e.g., attempting to create a book without providing a title).
- **404 Not Found:** Occurs when a client requests, updates, or deletes a book ID that does not exist in the system (e.g., requesting GET /api/v1/books/999999).
