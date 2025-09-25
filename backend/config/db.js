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
    // Initial connection (without DB)
    const tempConn = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
    });

    console.log('✅ Connected to MySQL (no DB selected)');

    // Create DB if missing
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    console.log(`✅ Database '${DB_NAME}' ensured`);
    await tempConn.end();

    // Connect to DB
    const db = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    });

    console.log('✅ Connected to MySQL with database selected');

    // Users table → only admin & controller
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role ENUM('admin', 'controller') NOT NULL
      );
    `);

    // CCPS table → only CCPS users
    await db.query(`
      CREATE TABLE IF NOT EXISTS ccps (
        ccps_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role ENUM('CCPS') DEFAULT 'CCPS',
        zone ENUM('SP 1', 'NZ', 'WZ', 'CZ', 'SZ') DEFAULT 'SP 1'
      );
    `);

    // Requests table
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
        status_reason TEXT,             
        detailed_report TEXT,           
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_to) REFERENCES ccps(ccps_id)
          ON DELETE SET NULL
          ON UPDATE CASCADE
      );
    `);

    // Seed default admin & controller
    const users = [
      ['admin', await bcrypt.hash('admin123', 10), 'admin'],
      ['controller1', await bcrypt.hash('controller123', 10), 'controller'],
    ];

    await db.query(
      `INSERT IGNORE INTO users (username, password, role) VALUES ?`,
      [users]
    );

    console.log('✅ Default users ensured (admin, controller)');

    return db;
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    throw err;
  }
}

// Singleton init
async function init() {
  if (!dbInstance) {
    dbInstance = await connectToDatabase();
  }
  return dbInstance;
}

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
