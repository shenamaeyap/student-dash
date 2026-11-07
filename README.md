# Student Dashboard

A dashboard app with full CRUD for student records.

- Backend: Express.js
- Database: SQLite (better-sqlite3)
- Frontend: HTML, CSS and JavaScript

## Run it

```bash
npm install
npm start
```

Open http://localhost:3000

## API

| Method | Route | Action |
| --- | --- | --- |
| GET | /api/students?q= | List and search students |
| GET | /api/students/:id | Get one student |
| POST | /api/students | Create a student |
| PUT | /api/students/:id | Update a student |
| DELETE | /api/students/:id | Delete a student |
| GET | /api/stats | Dashboard summary |