require('dotenv').config({ path: '.env' });
const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

/**
 * 데이터베이스 초기화 스크립트
 * Initialize database with schema and initial data
 */
async function initializeDatabase() {
  let connection = null;
  
  try {
    // 데이터베이스 없이 연결 (스키마 생성을 위해)
    const connectionConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: 'utf8mb4',
      timezone: '+09:00'
    };

    connection = await mysql.createConnection(connectionConfig);
    logger.info('Connected to MySQL server for database initialization');

    // 스키마 파일 읽기
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');

    // 주석 제거 및 SQL 문 정리
    const cleanSQL = schemaSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // SQL 문을 세미콜론으로 분리하여 실행
    const statements = cleanSQL
      .split(';')
      .map(stmt => stmt.trim().replace(/\s+/g, ' '))
      .filter(stmt => stmt.length > 0)
      .filter(stmt => !stmt.match(/^\s*$/)); // 빈 문자열 제거

    logger.info(`Executing ${statements.length} SQL statements...`);

    // 데이터베이스 생성 먼저 실행
    const dbStatements = statements.filter(stmt => 
      stmt.toUpperCase().startsWith('CREATE DATABASE'));
    
    for (const statement of dbStatements) {
      try {
        logger.info(`Creating database: ${statement.substring(0, 50)}...`);
        await connection.query(statement);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    // 올바른 데이터베이스 선택
    const dbName = process.env.DB_NAME || 'yuseong_care_sms';
    await connection.query(`USE ${dbName}`);
    logger.info(`Using database: ${dbName}`);
    
    // 테이블 및 데이터 생성
    const tableStatements = statements.filter(stmt => 
      stmt.toUpperCase().startsWith('CREATE TABLE') || 
      stmt.toUpperCase().startsWith('INSERT'));

    for (const [index, statement] of tableStatements.entries()) {
      try {
        logger.info(`Creating table/data ${index + 1}: ${statement.substring(0, 50)}...`);
        await connection.execute(statement);
      } catch (error) {
        if (!error.message.includes('already exists') && 
            !error.message.includes('Duplicate entry')) {
          logger.error(`Failed to execute statement ${index + 1}: ${statement}`);
          throw error;
        } else {
          logger.info(`Skipped existing: ${statement.substring(0, 50)}...`);
        }
      }
    }

    logger.info('Database schema initialized successfully');
    
    // 테이블 확인
    const [tables] = await connection.query('SHOW TABLES');
    logger.info(`Database ${dbName} contains ${tables.length} tables:`, 
      tables.map(row => Object.values(row)[0]));

  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * 데이터베이스 연결 상태 확인
 */
async function checkDatabaseHealth() {
  let connection = null;
  
  try {
    const connectionConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'yuseong_care_sms',
      charset: 'utf8mb4',
      timezone: '+09:00'
    };

    connection = await mysql.createConnection(connectionConfig);
    
    // 기본 테이블 존재 확인
    const requiredTables = [
      'recipients', 'messages', 'message_logs', 
      'custom_reminders', 'public_data_cache', 
      'admin_users', 'system_settings'
    ];

    const [tables] = await connection.execute('SHOW TABLES');
    const existingTables = tables.map(row => Object.values(row)[0]);
    
    const missingTables = requiredTables.filter(
      table => !existingTables.includes(table)
    );

    if (missingTables.length > 0) {
      throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
    }

    // 관리자 계정 존재 확인
    const [adminUsers] = await connection.execute(
      'SELECT COUNT(*) as count FROM admin_users WHERE is_active = TRUE'
    );
    
    if (adminUsers[0].count === 0) {
      logger.warn('No active admin users found in database');
    }

    logger.info('Database health check passed');
    return {
      status: 'healthy',
      tables: existingTables.length,
      adminUsers: adminUsers[0].count
    };

  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      error: error.message
    };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = {
  initializeDatabase,
  checkDatabaseHealth
};