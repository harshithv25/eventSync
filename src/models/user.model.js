'use strict';
const pool = require('../db/pool');

const UserModel = {
  /**
   * Create a new user (password should be pre-hashed)
   */
  async create({ name, email, phone, password }) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, phone, password)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, name, email, phone, created_at`,
      [name, email, phone, password]
    );
    return rows[0];
  },

  /**
   * Find a user by email (includes password for auth)
   */
  async findByEmail(email) {
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    return rows[0] || null;
  },

  /**
   * Find a user by ID (excludes password)
   */
  async findById(userId) {
    const { rows } = await pool.query(
      `SELECT user_id, name, email, phone, created_at
       FROM users WHERE user_id = $1`,
      [userId]
    );
    return rows[0] || null;
  },
};

module.exports = UserModel;
