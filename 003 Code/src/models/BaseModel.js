const { getPool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * 기본 모델 클래스
 * Base model class with common database operations
 */
class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = null;
  }

  /**
   * 데이터베이스 풀 가져오기
   */
  getDbPool() {
    if (!this.pool) {
      this.pool = getPool();
    }
    return this.pool;
  }

  /**
   * 쿼리 실행
   */
  async executeQuery(query, params = []) {
    try {
      const pool = this.getDbPool();
      const connection = await pool.getConnection();
      const [results] = await connection.execute(query, params);
      connection.release();
      return results;
    } catch (error) {
      logger.error(`Query execution failed in ${this.tableName}:`, {
        query,
        params,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 트랜잭션 실행
   */
  async executeTransaction(queries) {
    const pool = this.getDbPool();
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
      logger.error(`Transaction failed in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * 단일 레코드 조회
   */
  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const results = await this.executeQuery(query, [id]);
    return results[0] || null;
  }

  /**
   * 모든 레코드 조회
   */
  async findAll(conditions = {}, orderBy = 'id DESC', limit = null) {
    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];

    // WHERE 조건 추가
    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    // ORDER BY 추가
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    // LIMIT 추가
    if (limit) {
      query += ` LIMIT ?`;
      params.push(limit);
    }

    return await this.executeQuery(query, params);
  }

  /**
   * 레코드 생성
   */
  async create(data) {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    const query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    
    const result = await this.executeQuery(query, Object.values(data));
    return result.insertId;
  }

  /**
   * 레코드 수정
   */
  async update(id, data) {
    const fields = Object.keys(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    
    const params = [...Object.values(data), id];
    const result = await this.executeQuery(query, params);
    return result.affectedRows > 0;
  }

  /**
   * 레코드 삭제
   */
  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await this.executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * 레코드 수 조회
   */
  async count(conditions = {}) {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    const results = await this.executeQuery(query, params);
    return results[0].count;
  }

  /**
   * 페이지네이션 조회
   */
  async paginate(page = 1, pageSize = 10, conditions = {}, orderBy = 'id DESC') {
    const offset = (page - 1) * pageSize;
    
    // 전체 개수 조회
    const totalCount = await this.count(conditions);
    
    // 데이터 조회
    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    const data = await this.executeQuery(query, params);

    return {
      data,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNext: page < Math.ceil(totalCount / pageSize),
        hasPrev: page > 1
      }
    };
  }
}

module.exports = BaseModel;