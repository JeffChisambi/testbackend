const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gtms_database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection helper
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database:', process.env.DB_NAME || 'gtms_database');
    connection.release();
    return true;
  } catch (error) {
    console.warn('⚠️ Database Connection Warning:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  query: (sql, params) => pool.execute(sql, params),
  testConnection
};
