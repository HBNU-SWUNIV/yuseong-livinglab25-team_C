const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

let pool = null;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'yuseong_care_sms',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+09:00'
};

async function connectDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    
    // Test the connection
    const testConnection = await pool.getConnection();
    await testConnection.ping();
    testConnection.release();
    
    logger.info('Database connection pool established successfully');
    logger.info(`Connected to database: ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port}`);
    return pool;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDatabase() first.');
  }
  return pool;
}

async function executeQuery(query, params = []) {
  try {
    const connection = await pool.getConnection();
    const [results] = await connection.execute(query, params);
    connection.release();
    return results;
  } catch (error) {
    logger.error('Query execution failed:', { query, params, error: error.message });
    throw error;
  }
}

async function executeTransaction(queries) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }
    
    await connection.commit();
    connection.release();
    return results;
  } catch (error) {
    await connection.rollback();
    connection.release();
    logger.error('Transaction failed:', error);
    throw error;
  }
}

async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
}

module.exports = {
  connectDatabase,
  getPool,
  executeQuery,
  executeTransaction,
  closeConnection
};