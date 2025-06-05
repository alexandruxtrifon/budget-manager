const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (pool) => {
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

    // Create JWT
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});
return router;
}
