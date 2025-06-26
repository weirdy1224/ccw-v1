const jwt = require('jsonwebtoken');  // ✅ Make sure this line exists
require('dotenv').config();

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  const token = authHeader?.split(' ')[1];
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Invalid token:', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};
