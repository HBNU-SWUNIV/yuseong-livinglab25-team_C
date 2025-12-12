const { getPool } = require("../config/database");
const logger = require("../utils/logger");

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = null;
  }

  getDbPool() {
    if (!this.pool) {
      this.pool = getPool();
    }
    return this.pool;
  }

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
        error: error.message,
      });
      throw error;
    }
  }

  // ★★★ [추가됨] 대량 Insert를 위한 최적화 메서드 ★★★
  // mysql2의 execute 대신 query를 사용해야 중첩 배열(Bulk insert) 처리가 가능합니다.
  async bulkInsert(fields, values) {
    try {
      const pool = this.getDbPool();
      const connection = await pool.getConnection();

      const query = `INSERT INTO ${this.tableName} (${fields.join(
        ", "
      )}) VALUES ?`;

      // execute가 아닌 query를 사용
      const [results] = await connection.query(query, [values]);

      connection.release();
      return results;
    } catch (error) {
      logger.error(`Bulk insert failed in ${this.tableName}:`, error);
      throw error;
    }
  }

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

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const results = await this.executeQuery(query, [id]);
    return results[0] || null;
  }

  async findAll(conditions = {}, orderBy = "id DESC", limit = null) {
    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key) => `${key} = ?`)
        .join(" AND ");
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    if (limit) {
      query += ` LIMIT ?`;
      params.push(limit);
    }

    return await this.executeQuery(query, params);
  }

  async create(data) {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => "?").join(", ");
    const query = `INSERT INTO ${this.tableName} (${fields.join(
      ", "
    )}) VALUES (${placeholders})`;

    const result = await this.executeQuery(query, Object.values(data));
    return result.insertId;
  }

  async update(id, data) {
    const fields = Object.keys(data);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;

    const params = [...Object.values(data), id];
    const result = await this.executeQuery(query, params);
    return result.affectedRows > 0;
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await this.executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  async count(conditions = {}) {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key) => `${key} = ?`)
        .join(" AND ");
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    const results = await this.executeQuery(query, params);
    return results[0].count;
  }

  async paginate(
    page = 1,
    pageSize = 10,
    conditions = {},
    orderBy = "id DESC"
  ) {
    const offset = (page - 1) * pageSize;
    const totalCount = await this.count(conditions);

    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key) => `${key} = ?`)
        .join(" AND ");
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
        hasPrev: page > 1,
      },
    };
  }
}

module.exports = BaseModel;
