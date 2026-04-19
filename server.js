require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// ── Auth middleware ──
function requireAuth(req, res, next) {
  try {
    jwt.verify(req.cookies.authToken, process.env.JWT_SECRET);
    next();
  } catch {
    res.redirect('/login.html');
  }
}

// ── Public: assets + login page ──
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/', (req, res) => res.redirect('/login.html'));

// ── Login API ──
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.APP_USERNAME && password === process.env.APP_PASSWORD) {
    const token = jwt.sign({ authenticated: true }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('authToken', token, { httpOnly: true, sameSite: 'strict' });
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'שם משתמש או סיסמה שגויים' });
  }
});

// ── Logout API ──
app.post('/api/logout', (req, res) => {
  res.clearCookie('authToken');
  res.redirect('/login.html');
});

// ── Protected pages ──
app.get('/index.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/invoice.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'invoice.html')));

// ── Local dev server ──
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}

// ── Vercel export ──
module.exports = app;
