// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios'); // ✅ for calling Google reCAPTCHA API
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
  const { username, password, captchaToken } = req.body; // ✅ Expect captchaToken from frontend

  try {
    // 1️⃣ Verify captcha with Google
    const captchaVerifyUrl =` https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captchaToken}`;
    const captchaResponse = await axios.post(captchaVerifyUrl);

    if (!captchaResponse.data.success) {
      return res.status(400).json({ message: 'Captcha verification failed' });
    }

    // 2️⃣ Normal login flow
    const db = getConnection();
    const [rows] = await db.query(`SELECT * FROM users WHERE username = ?, [username]`);

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