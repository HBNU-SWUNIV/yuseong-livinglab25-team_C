const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');

class Admin extends BaseModel {
  constructor() {
    super('admins');
  }

  /**
   * 관리자 생성
   */
  async create(adminData) {
    const { username, password, name, role = 'operator', email, phone } = adminData;

    // 비밀번호 해시화
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO admins (username, password, name, role, email, phone, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, true, NOW())
    `;

    const params = [username, hashedPassword, name, role, email, phone];
    const result = await this.executeQuery(query, params);

    return {
      id: result.insertId,
      username,
      name,
      role,
      email,
      phone,
      is_active: true
    };
  }

  /**
   * 사용자명으로 관리자 조회 (로그인용)
   */
  async findByUsername(username) {
    const query = `
      SELECT id, username, password, name, role, email, phone, is_active, 
             created_at, updated_at, last_login_at
      FROM admins 
      WHERE username = ? AND is_active = true
    `;

    const results = await this.executeQuery(query, [username]);
    return results[0] || null;
  }

  /**
   * 비밀번호 검증
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * 마지막 로그인 시간 업데이트
   */
  async updateLastLogin(adminId) {
    const query = `
      UPDATE admins 
      SET last_login_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `;

    await this.executeQuery(query, [adminId]);
  }

  /**
   * 관리자 목록 조회
   */
  async findAll(options = {}) {
    const { page = 1, limit = 20, role } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE is_active = true';
    const params = [];

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    const query = `
      SELECT id, username, name, role, email, phone, is_active, 
             created_at, updated_at, last_login_at
      FROM admins 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const results = await this.executeQuery(query, params);

    // 총 개수 조회
    const countQuery = `SELECT COUNT(*) as total FROM admins ${whereClause}`;
    const countParams = params.slice(0, -2); // limit, offset 제외
    const countResult = await this.executeQuery(countQuery, countParams);
    const total = countResult[0].total;

    return {
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 관리자 정보 업데이트
   */
  async update(id, updateData) {
    const allowedFields = ['name', 'email', 'phone', 'role', 'is_active'];
    const updates = [];
    const params = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('업데이트할 필드가 없습니다.');
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const query = `
      UPDATE admins 
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    await this.executeQuery(query, params);
    return await this.findById(id);
  }

  /**
   * 비밀번호 변경
   */
  async changePassword(id, newPassword) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const query = `
      UPDATE admins 
      SET password = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await this.executeQuery(query, [hashedPassword, id]);
  }

  /**
   * 관리자 비활성화 (소프트 삭제)
   */
  async deactivate(id) {
    const query = `
      UPDATE admins 
      SET is_active = false, updated_at = NOW()
      WHERE id = ?
    `;

    await this.executeQuery(query, [id]);
  }
}

module.exports = Admin;