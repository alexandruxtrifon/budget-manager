const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (pool) => {
  router.post('/register', async (req, res) => {
    const { email, password, full_name } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, full_name)
         VALUES ($1, $2, $3)
         RETURNING user_id, email, full_name`,
        [email, hashedPassword, full_name]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
      const result = await pool.query(
        `SELECT user_id, email, full_name, password_hash FROM users WHERE email = $1`,
        [email]
      );

      const user = result.rows[0];
      if (!user) return res.status(400).json({ error: 'Invalid email or password' });

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

      res.json({
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  return router;
};
