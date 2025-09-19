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
      // 1️⃣ Check users table (admin/controller)
      const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
      if (users.length > 0) {
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
        return res.json({ token, role: user.role, username: user.username });
      }

      // 2️⃣ Check CCPS table
      const [ccps] = await db.query('SELECT * FROM ccps WHERE name = ?', [username]);
      if (ccps.length > 0) {
        const station = ccps[0];

        // ✅ Ensure passwords are hashed in CCPS table
        if (!station.password) return res.status(400).json({ message: 'Password not set for this station' });

        const isMatch = await bcrypt.compare(password, station.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        const token = jwt.sign({ id: station.ccps_id, role: 'CCPS' }, process.env.JWT_SECRET, { expiresIn: '2h' });
        return res.json({ token, role: 'CCPS', username: station.name });
      }

      return res.status(400).json({ message: 'Invalid username or password' });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Login failed', error: err.message });
    }
  });

  return router;
};
