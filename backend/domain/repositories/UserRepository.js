const { userPool } = require('../../config/db');
const User = require('../entities/User');

class UserRepository {
  async findByEmail(email) {
    const queryText = 'SELECT * FROM users WHERE email = $1';
    const result = await userPool.query(queryText, [email]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return new User(row.id, row.name, row.email, row.password_hash, row.created_at, row.profile_pic, row.role || 'OPERATOR');
  }

  async findById(id) {
    const queryText = 'SELECT * FROM users WHERE id = $1';
    const result = await userPool.query(queryText, [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return new User(row.id, row.name, row.email, row.password_hash, row.created_at, row.profile_pic, row.role || 'OPERATOR');
  }

  async createUser(name, email, passwordHash, role = 'OPERATOR') {
    const queryText = `
      INSERT INTO users (name, email, password_hash, role) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, email, role, profile_pic, created_at
    `;
    const result = await userPool.query(queryText, [name, email, passwordHash, role]);
    const row = result.rows[0];
    return new User(row.id, row.name, row.email, row.password_hash, row.created_at, row.profile_pic, row.role);
  }

  async updateProfilePic(id, profilePic) {
    const queryText = `
      UPDATE users 
      SET profile_pic = $1 
      WHERE id = $2 
      RETURNING id, name, email, role, profile_pic, created_at
    `;
    const result = await userPool.query(queryText, [profilePic, id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return new User(row.id, row.name, row.email, null, row.created_at, row.profile_pic, row.role);
  }

  async logAudit(userId, action, ipAddress = null, metadata = {}) {
    const queryText = `
      INSERT INTO user_audit_logs (user_id, action, ip_address, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING id, timestamp
    `;
    const result = await userPool.query(queryText, [userId, action, ipAddress, JSON.stringify(metadata)]);
    return result.rows[0];
  }
}

module.exports = UserRepository;
