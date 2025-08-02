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
      `SELECT user_id, email, full_name, password_hash, role, is_verified FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      // Log failed login attempt (no user found)
      await logActivity(pool, null, 'LOGIN_FAILED_EMAIL', 'USER', email, { 
        reason: 'email_not_found',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    
    // Check if user account is verified
    if (!user.is_verified) {
      await logActivity(pool, user.user_id, 'LOGIN_FAILED_UNVERIFIED', 'USER', user.email, { 
        reason: 'account_not_verified',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({ 
        error: 'Account not verified. Please check your email and verify your account before logging in.',
        code: 'ACCOUNT_NOT_VERIFIED'
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      await logActivity(pool, user.user_id, 'LOGIN_FAILED_PASS', 'USER', user.email, { 
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
    console.log('User logout request:', req.user);
    const userResult = await pool.query(
      'SELECT full_name FROM users WHERE user_id = $1',
      [req.user.user_id]
    );
    
    const fullName = userResult.rows[0]?.full_name || 'UNK';
    
    await logActivity(pool, req.user.user_id, 'LOGOUT' /*`LOGOUT|${fullName}|${req.user.user_id}`*/, 'USER', req.user.email, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

  // Add these routes to your auth.js file

// Request password reset OTP
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const userResult = await pool.query(
      `SELECT user_id, email, full_name FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists for security
      return res.json({ 
        message: 'If your email is registered, you will receive a reset code shortly.' 
      });
    }

    const user = userResult.rows[0];
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes
    
    // Store OTP in users table
    await pool.query(
      `UPDATE users 
       SET otp = $1, otp_expiry = $2, updated_at = NOW() 
       WHERE user_id = $3`,
      [otp, otpExpiry, user.user_id]
    );
    
    // Create notification for sending OTP email
    const notificationResult = await pool.query(
      `INSERT INTO notifications (user_id, type, payload, is_sent)
       VALUES ($1, $2, $3, $4) RETURNING notification_id`,
      [
        user.user_id, 
        'otp_email', 
        JSON.stringify({
          email: user.email,
          name: user.full_name || 'User',
          otp: otp,
          timestamp: new Date()
        }), 
        false
      ]
    );
    
    const notification_id = notificationResult.rows[0].notification_id;

    await logActivity(pool, user.user_id, 'PASSWORD_RESET_REQUEST', 'USER', user.email, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ 
      message: 'If your email is registered, you will receive a reset code shortly.',
      user_id: user.user_id,
      notification_id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Verify OTP for password reset
router.post('/verify-reset-otp', async (req, res) => {
  const { user_id, otp } = req.body;

  try {
    // Get the user with stored OTP
    const userResult = await pool.query(
      `SELECT user_id, otp, otp_expiry FROM users 
       WHERE user_id = $1 AND otp = $2 AND otp_expiry > NOW()`,
      [user_id, otp]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // OTP is valid, generate a temporary token for password reset
    const resetToken = jwt.sign(
      { user_id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '2m' } // Token expires in 15 minutes
    );
    
    await logActivity(pool, user_id, 'PASSWORD_RESET_OTP_VERIFIED', 'USER', null, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ 
      message: 'Verification successful',
      reset_token: resetToken
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify reset code' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  const { reset_token, new_password } = req.body;

  try {
    // Verify reset token
    const decoded = jwt.verify(reset_token, process.env.JWT_SECRET);
    
    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }
    
    const user_id = decoded.user_id;
    
    // Hash the new password
    const passwordHash = await bcrypt.hash(new_password, 10);
    
    // Update user password and clear OTP fields
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, otp = NULL, otp_expiry = NULL, updated_at = NOW() 
       WHERE user_id = $2`,
      [passwordHash, user_id]
    );
    
    await logActivity(pool, user_id, 'PASSWORD_RESET_COMPLETED', 'USER', null, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

return router;
}
