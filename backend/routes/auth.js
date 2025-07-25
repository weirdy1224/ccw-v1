const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (db) => {
  const router = express.Router();

  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    try {
      const [results] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
      if (results.length === 0) {
        return res.status(400).json({ message: 'Invalid username or password' });
      }

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid password' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '2h',
      });

      res.json({ token, role: user.role });
    } catch (err) {
      res.status(500).json({ message: 'Login failed', error: err.message });
    }
  });

  return router;
};
