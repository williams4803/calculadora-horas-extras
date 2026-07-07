const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'db.json');

function ensureDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ history: [], funcionarios: [] }, null, 2), 'utf8');
  }
}

function readDb() {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { history: [], funcionarios: [] };
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/history', (req, res) => {
  const db = readDb();
  res.json(db.history || []);
});

app.post('/api/history', (req, res) => {
  const db = readDb();
  const item = req.body || {};
  item.id = Date.now();
  db.history = [item, ...(db.history || [])].slice(0, 100);
  writeDb(db);
  res.json(item);
});

app.delete('/api/history', (req, res) => {
  const db = readDb();
  db.history = [];
  writeDb(db);
  res.json({ ok: true });
});

// Funcionarios endpoints
app.get('/api/funcionarios', (req, res) => {
  const db = readDb();
  res.json(db.funcionarios || []);
});

app.post('/api/funcionarios', (req, res) => {
  const db = readDb();
  const item = req.body || {};
  item.id = Date.now();
  db.funcionarios = [item, ...(db.funcionarios || [])];
  writeDb(db);
  res.json(item);
});

app.delete('/api/funcionarios', (req, res) => {
  const db = readDb();
  db.funcionarios = [];
  writeDb(db);
  res.json({ ok: true });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`CHE server listening on http://localhost:${port}`));
