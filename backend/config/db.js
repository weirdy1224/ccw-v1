// config/db.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'unfreeze_db';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASSWORD || '';
const DB_HOST = process.env.DB_HOST || 'localhost';

let dbInstance = null;

async function connectToDatabase() {
  try {
    // Initial connection without DB selected (to create DB if needed)
    const tempConn = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
    });

    console.log('✅ Connected to MySQL (no DB selected)');

    // Create DB if it doesn't exist
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    console.log(`✅ Database '${DB_NAME}' ensured`);

    await tempConn.end();

    // Connect with DB selected
    const db = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    });

    console.log('✅ Connected to MySQL with database selected');

    // Create users table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role ENUM('admin', 'controller', 'CCPS', 'sp') DEFAULT 'CCPS'
      );
    `);

    // Create requests table with only required columns per your latest form and backend
 await db.query(`
  CREATE TABLE IF NOT EXISTS requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_number VARCHAR(100) UNIQUE,
    assigned_to INT NULL,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    account_type VARCHAR(50) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    ncrp_ack_number VARCHAR(100),
    business_description TEXT,
    transaction_reason TEXT,
    id_proof_type VARCHAR(50) NOT NULL,
    document_paths TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    status_reason TEXT,             -- 20 words, remarks for user
    detailed_report TEXT,           -- 50 words, report for admin/controller
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE
  );
`);


    // Seed default users (only if not exist)
    const users = [
      ['admin', await bcrypt.hash('admin123', 10), 'admin'],
      ['controller1', await bcrypt.hash('controller123', 10), 'controller'],
      ['CCPS1', await bcrypt.hash('CCPS123', 10), 'CCPS'],
    ];

    await db.query(
      `INSERT IGNORE INTO users (username, password, role) VALUES ?`,
      [users]
    );

    console.log('✅ Default users ensured');

    return db;
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    throw err;
  }
}

// Initialize and store singleton instance
async function init() {
  if (!dbInstance) {
    dbInstance = await connectToDatabase();
  }
  return dbInstance;
}

// Return existing instance
function getConnection() {
  if (!dbInstance) {
    throw new Error('❌ DB not initialized. Call init() first.');
  }
  return dbInstance;
}

module.exports = {
  init,
  getConnection,
};
