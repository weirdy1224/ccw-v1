// routes/ccpsAuth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/db.js');
require('dotenv').config();

const router = express.Router();

// POST /api/auth/ccps-login
router.post('/ccps-login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  try {
    const db = getConnection();

    // Fetch CCPS user by name
    const [rows] = await db.query('SELECT * FROM ccps WHERE name = ?', [username]);

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const ccpsUser = rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, ccpsUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Sign JWT with ccps_id
    const token = jwt.sign(
      { ccps_id: ccpsUser.ccps_id, role: 'CCPS' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, role: 'CCPS', name: ccpsUser.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
