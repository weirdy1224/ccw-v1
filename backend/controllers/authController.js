// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getConnection } = require('../config/db.js');
require('dotenv').config();

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const db = getConnection();
    const [rows] = await db.query(`SELECT * FROM users WHERE username = ?`, [username]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const token = generateToken(user);
    res.status(200).json({
      message: 'Login successful',
      token,
      role: user.role,
      username: user.username,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};
