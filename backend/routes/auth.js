const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { logActivity } = require('../logActivity');
const authMiddleware = require('../authMiddleware');

module.exports = (pool) => {
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT user_id, email, full_name, password_hash, role FROM users WHERE email = $1`,
      [email]
    );

    //const user = result.rows[0];
    //if (!user) return res.status(400).json({ error: 'Invalid email or password' });
    if (result.rows.length === 0) {
      // Log failed login attempt (no user found)
      await logActivity(pool, null, 'LOGIN_FAILED', 'USER', email, { 
        reason: 'email_not_found',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        await logActivity(pool, user.user_id, 'LOGIN_FAILED', 'USER', user.email, { 
          reason: 'invalid_password',
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        return res.status(400).json({ error: 'Invalid email or password' });
      }
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    await logActivity(pool, user.user_id, 'LOGIN_SUCCESS', 'USER', user.email, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json({
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT full_name FROM users WHERE user_id = $1',
      [req.user.user_id]
    );
    
    const fullName = userResult.rows[0]?.full_name || 'UNK';
    
    await logActivity(pool, req.user.user_id, `LOGOUT|${fullName}|${req.user.user_id}`, 'USER', req.user.email, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

return router;
}
