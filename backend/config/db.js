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
    // Initial connection to create DB if needed
    const tempConn = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
    });

    console.log('✅ Connected to MySQL (no DB)');
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    console.log(`✅ Database '${DB_NAME}' ensured`);
    await tempConn.end();

    // Main connection with DB
    const db = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    });

    console.log('✅ Connected to MySQL with selected DB');

    // Ensure users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role ENUM('admin', 'controller', 'police') DEFAULT 'police'
      );
    `);

    // Ensure requests table
    await db.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reference_number VARCHAR(100) UNIQUE,
        assigned_to INT,
        name VARCHAR(255),
        mobile VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        account_type VARCHAR(50),
        account_ownership VARCHAR(50),
        account_number VARCHAR(100),
        ncrp_ack_number VARCHAR(100),
        account_opening_year VARCHAR(10),
        business_description TEXT,
        transaction_reason TEXT,
        id_proof_type VARCHAR(50),
        document_paths TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        status_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      );
    `);
      await db.query(`
  CREATE TABLE IF NOT EXISTS transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT,
  from_station VARCHAR(255),
  to_station VARCHAR(255),
  transferred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
);
`);
console.log('✅ Transfers table ensured');
    // Seed default users
    const users = [
      ['admin', await bcrypt.hash('admin123', 10), 'admin'],
      ['controller1', await bcrypt.hash('controller123', 10), 'controller'],
      ['police1', await bcrypt.hash('police123', 10), 'police'],
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

// Initialize and store instance
async function init() {
  dbInstance = await connectToDatabase();
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
