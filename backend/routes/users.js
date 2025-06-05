const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (pool) => {
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT user_id, email, full_name, role FROM users ORDER BY user_id');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching users');
    }
  });

  router.post('/register', async (req, res) => {
    const { email, password, full_name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, full_name)
         VALUES ($1, $2, $3) RETURNING user_id, email, full_name`,
        [email, hashedPassword, full_name]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      if (err.code === '23505') {
        res.status(400).send('Email already exists');
      } else {
        res.status(500).send('Error registering user');
      }
    }
  });

  return router;
};
