const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const db = new Database(path.join(__dirname, 'students.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_no TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    course TEXT NOT NULL,
    year_level INTEGER NOT NULL,
    grade REAL NOT NULL
  )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function validate(body) {
  const { student_no, name, email, course, year_level, grade } = body;
  if (![student_no, name, email, course].every(v => typeof v === 'string' && v.trim())) {
    return 'Student no., name, email and course are required.';
  }
  const y = Number(year_level);
  const g = Number(grade);
  if (!Number.isInteger(y) || y < 1 || y > 6) return 'Year level must be 1 to 6.';
  if (Number.isNaN(g) || g < 0 || g > 100) return 'Grade must be 0 to 100.';
  return null;
}

function clean(body) {
  return {
    student_no: body.student_no.trim(),
    name: body.name.trim(),
    email: body.email.trim(),
    course: body.course.trim(),
    year_level: Number(body.year_level),
    grade: Number(body.grade),
  };
}

// READ all (with optional search)
app.get('/api/students', (req, res) => {
  const q = `%${(req.query.q || '').trim()}%`;
  const rows = db.prepare(`
    SELECT * FROM students
    WHERE name LIKE ? OR student_no LIKE ? OR course LIKE ?
    ORDER BY id DESC
  `).all(q, q, q);
  res.json(rows);
});

// Dashboard stats
app.get('/api/stats', (req, res) => {
  const s = db.prepare(`
    SELECT COUNT(*) AS total,
           ROUND(AVG(grade), 1) AS average,
           COUNT(DISTINCT course) AS courses,
           MAX(grade) AS highest
    FROM students
  `).get();
  res.json(s);
});

// READ one
app.get('/api/students/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Student not found.' });
  res.json(row);
});

// CREATE
app.post('/api/students', (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  const s = clean(req.body);
  try {
    const info = db.prepare(`
      INSERT INTO students (student_no, name, email, course, year_level, grade)
      VALUES (@student_no, @name, @email, @course, @year_level, @grade)
    `).run(s);
    res.status(201).json({ id: info.lastInsertRowid, ...s });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'That student number already exists.' });
    }
    res.status(500).json({ error: 'Could not save student.' });
  }
});

// UPDATE
app.put('/api/students/:id', (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  const s = clean(req.body);
  try {
    const info = db.prepare(`
      UPDATE students SET student_no=@student_no, name=@name, email=@email,
        course=@course, year_level=@year_level, grade=@grade
      WHERE id=@id
    `).run({ ...s, id: req.params.id });
    if (!info.changes) return res.status(404).json({ error: 'Student not found.' });
    res.json({ id: Number(req.params.id), ...s });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'That student number already exists.' });
    }
    res.status(500).json({ error: 'Could not update student.' });
  }
});

// DELETE
app.delete('/api/students/:id', (req, res) => {
  const info = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Student not found.' });
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Student dashboard running at http://localhost:${PORT}`));