const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const authMiddleware = require('../authMiddleware');
const adminMiddleware = require('../adminMiddleware');
const { logActivity } = require('../logActivity');
const crypto = require('crypto');

const OTP_MINUTES = 2; 

module.exports = (pool) => {
  router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          user_id, 
          email, 
          full_name, 
          role, 
          language_preference,
          created_at, 
          updated_at,
          (SELECT COUNT(*) FROM accounts WHERE user_id = users.user_id) as account_count,
          (SELECT COUNT(*) FROM transactions WHERE user_id = users.user_id) as transaction_count
        FROM users 
        ORDER BY created_at DESC
      `);
    await logActivity(pool, req.user.user_id, 'VIEW_ALL_USERS', 'USER', null, {
      admin_email: req.user.email,
      user_count: result.rows.length,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching users');
    }
  });

  router.post('/register', async (req, res) => {
    const { email, password, full_name } = req.body;
    try {
      // First, check if user already exists
      const existingUser = await pool.query(
        `SELECT user_id, email, full_name, is_verified, otp_expiry FROM users WHERE email = $1`,
        [email]
      );

      if (existingUser.rows.length > 0) {
        const user = existingUser.rows[0];
        
        // If user is already verified, prevent re-registration
        if (user.is_verified) {
          return res.status(400).json({ 
            error: 'Email already exists and is verified. Please log in instead.',
            code: 'EMAIL_ALREADY_VERIFIED'
          });
        }
        
        // If user exists but is not verified, check if OTP has expired
        if (user.otp_expiry && user.otp_expiry > new Date()) {
          return res.status(400).json({ 
            error: 'Email already exists but not verified. Please wait for the verification code to expire or check your email for the verification code.',
            code: 'EMAIL_EXISTS_UNVERIFIED',
            otp_expiry: user.otp_expiry
          });
        }
        
        // OTP has expired, allow re-registration by updating the existing user
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + OTP_MINUTES);
        
        // Update existing user with new password and OTP
        const result = await pool.query(
          `UPDATE users 
           SET password_hash = $1, full_name = $2, otp = $3, otp_expiry = $4, updated_at = NOW()
           WHERE user_id = $5 
           RETURNING user_id, email, full_name`,
          [hashedPassword, full_name, otp, otpExpiry, user.user_id]
        );
        
        // Create notification for sending OTP email
        const notificationResult = await pool.query(
          `INSERT INTO notifications (user_id, type, payload, is_sent)
          VALUES ($1, $2, $3, $4) RETURNING notification_id`,
          [
            user.user_id, 
            'otp_email', 
            JSON.stringify({
              email: email,
              name: full_name,
              otp: otp,
              timestamp: new Date()
            }), 
            false
          ]
        );

        await logActivity(pool, user.user_id, 'RE_REGISTER', 'USER', email, {
          full_name,
          reason: 'otp_expired',
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        res.status(200).json({
          ...result.rows[0],
          notification_id: notificationResult.rows[0].notification_id,
          message: 'Registration updated successfully. Please check your email for the new verification code.'
        });
        return;
      }

      // New user registration (existing logic)
      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + OTP_MINUTES);

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, otp, otp_expiry, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, email, full_name`,
        [email, hashedPassword, full_name, otp, otpExpiry, false]
      );

      const notificationResult = await pool.query(
        `INSERT INTO notifications (user_id, type, payload, is_sent)
        VALUES ($1, $2, $3, $4) RETURNING notification_id`,
        [
          result.rows[0].user_id, 
          'otp_email', 
          JSON.stringify({
            email: email,
            name: full_name,
            otp: otp,
            timestamp: new Date()
          }), 
          false
        ]
      );

      await logActivity(pool, result.rows[0].user_id, 'REGISTER', 'USER', email, {
        full_name,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(201).json({
        ...result.rows[0],
        notification_id: notificationResult.rows[0].notification_id
      });
    } catch (err) {
      console.error(err);
      if (err.code === '23505') {
        res.status(400).json({error: 'Email already exists'});
      } else {
        res.status(500).json({error: 'Error registering user'});
      }
    }
  });

  router.post('/verify-otp', async (req, res) => {
    const { user_id, otp } = req.body;
    
    if (!user_id || !otp) {
      return res.status(400).json({ error: 'User ID and OTP are required' });
    }
    
    try {
      // Check if OTP is valid and not expired
      const result = await pool.query(
        `SELECT * FROM users 
        WHERE user_id = $1 AND otp = $2 AND otp_expiry > NOW()`,
        [user_id, otp]
      );
      
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
      
      // Mark user as verified and clear OTP
      await pool.query(
        `UPDATE users 
        SET is_verified = true, otp = NULL, otp_expiry = NULL 
        WHERE user_id = $1`,
        [user_id]
      );
      
      await logActivity(pool, user_id, 'EMAIL_VERIFIED', 'USER', result.rows[0].email, {
        verification_method: 'otp',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json({ message: 'Email verified successfully' });
    } catch (err) {
      console.error('Error verifying OTP:', err);
      res.status(500).json({ error: 'Failed to verify OTP' });
    }
  });

  // Add route for resending OTP
  router.post('/resend-otp', async (req, res) => {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    try {
      // Get user details
      const userResult = await pool.query(
        'SELECT email, full_name FROM users WHERE user_id = $1',
        [user_id]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = userResult.rows[0];
      
      // Generate a new OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + OTP_MINUTES);
      
      // Update user with new OTP
      await pool.query(
        `UPDATE users SET otp = $1, otp_expiry = $2 WHERE user_id = $3`,
        [otp, otpExpiry, user_id]
      );
      
      // Create notification for sending OTP email
      const notificationResult = await pool.query(
        `INSERT INTO notifications (user_id, type, payload, is_sent)
        VALUES ($1, $2, $3, $4) RETURNING notification_id`,
        [
          user_id, 
          'otp_email', 
          JSON.stringify({
            email: user.email,
            name: user.full_name,
            otp: otp,
            timestamp: new Date()
          }), 
          false
        ]
      );
      
      await logActivity(pool, user_id, 'OTP_RESENT', 'USER', user.email, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json({ message: 'OTP resent successfully',
        notification_id: notificationResult.rows[0].notification_id
      });
    } catch (err) {
      console.error('Error resending OTP:', err);
      res.status(500).json({ error: 'Failed to resend OTP' });
    }
  });

  // Admin route to manually verify a user (for testing purposes)
  router.post('/verify-user/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    const { userId } = req.params;
    
    try {
      const result = await pool.query(
        `UPDATE users SET is_verified = true WHERE user_id = $1 RETURNING user_id, email, full_name`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      await logActivity(pool, req.user.user_id, 'MANUAL_VERIFY_USER', 'ADMIN', result.rows[0].email, {
        verified_user_id: userId,
        verified_user_email: result.rows[0].email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json({ 
        message: 'User verified successfully',
        user: result.rows[0]
      });
    } catch (err) {
      console.error('Error verifying user:', err);
      res.status(500).json({ error: 'Failed to verify user' });
    }
  });

  // Route to check user verification status
  router.get('/verification-status/:email', async (req, res) => {
    const { email } = req.params;
    
    try {
      const result = await pool.query(
        `SELECT user_id, email, is_verified, otp_expiry FROM users WHERE email = $1`,
        [email]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = result.rows[0];
      const canReRegister = !user.is_verified && (!user.otp_expiry || user.otp_expiry <= new Date());
      
      res.json({ 
        is_verified: user.is_verified,
        user_id: user.user_id,
        can_re_register: canReRegister,
        otp_expiry: user.otp_expiry
      });
    } catch (err) {
      console.error('Error checking verification status:', err);
      res.status(500).json({ error: 'Failed to check verification status' });
    }
  });

  // router.put('/:userId', authMiddleware, async (req, res) => {
  //   const { userId } = req.params;
  //   const { 
  //     full_name, 
  //     email, 
  //     language_preference, 
  //     //avatar, 
  //     currentPassword, 
  //     newPassword 
  //   } = req.body;

  //   // Ensure user can only update their own account (or admin can update any)
  //   if (req.user.user_id != userId && req.user.role !== 'admin') {
  //     return res.status(403).json({ error: 'You can only update your own account' });
  //   }

  //   try {
  //     // If password change is requested, verify current password first
  //     if (currentPassword && newPassword) {
  //       const userCheck = await pool.query(
  //         'SELECT password_hash FROM users WHERE user_id = $1',
  //         [userId]
  //       );

  //       if (userCheck.rows.length === 0) {
  //         return res.status(404).json({ error: 'User not found' });
  //       }

  //       const isValidPassword = await bcrypt.compare(currentPassword, userCheck.rows[0].password_hash);
  //       if (!isValidPassword) {
  //         return res.status(400).json({ error: 'Current password is incorrect' });
  //       }

  //       // Hash the new password
  //       const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
  //       // Update user with new password
  //       const result = await pool.query(
  //         `UPDATE users 
  //          SET full_name = $1, email = $2, language_preference = $3, password_hash = $4, updated_at = NOW()
  //          WHERE user_id = $5 
  //          RETURNING user_id, email, full_name, language_preference, role, created_at, updated_at`,
  //         [full_name, email, language_preference, hashedNewPassword, userId]
  //       );

  //       const updatedUser = result.rows[0];
  //       //updatedUser.avatar = avatar; // Add avatar to response
  //       res.json(updatedUser);
  //     } else {
  //       // Update user without password change
  //       const result = await pool.query(
  //         `UPDATE users 
  //          SET full_name = $1, email = $2, language_preference = $3, updated_at = NOW()
  //          WHERE user_id = $4 
  //          RETURNING user_id, email, full_name, language_preference, role, created_at, updated_at`,
  //         [full_name, email, language_preference, userId]
  //       );

  //       if (result.rows.length === 0) {
  //         return res.status(404).json({ error: 'User not found' });
  //       }

  //       const updatedUser = result.rows[0];
  //       //updatedUser.avatar = avatar; // Add avatar to response
  //       res.json(updatedUser);
  //     }
  //   } catch (err) {
  //     console.error('Error updating user:', err);
  //     if (err.code === '23505') {
  //       res.status(400).json({ error: 'Email already exists' });
  //     } else {
  //       res.status(500).json({ error: 'Failed to update user' });
  //     }
  //   }
  // });

   // Update user (admin can update any user, users can update themselves)
  router.put('/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params;
    const { 
      full_name, 
      email, 
      language_preference, 
      role,
      currentPassword, 
      newPassword 
    } = req.body;

    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isOwner = req.user.user_id == userId;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'You can only update your own account' });
    }

    // Only admins can change roles
    if (role && !isAdmin) {
      return res.status(403).json({ error: 'Only admins can change user roles' });
    }

    try {
      // If password change is requested, verify current password first (unless admin)

      if (newPassword) {
        if (!isAdmin && currentPassword) {
          const userCheck = await pool.query(
            'SELECT password_hash FROM users WHERE user_id = $1',
            [userId]
          );

          if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
          }

          const isValidPassword = await bcrypt.compare(currentPassword, userCheck.rows[0].password_hash);
          if (!isValidPassword) {
            return res.status(400).json({ error: 'Current password is incorrect' });
          }
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        console.log(hashedNewPassword);
        // Update user with new password
        const result = await pool.query(
          `UPDATE users 
           SET full_name = $1, email = $2, language_preference = $3, password_hash = $4, role = $5, updated_at = NOW()
           WHERE user_id = $6 
           RETURNING user_id, email, full_name, language_preference, role, created_at, updated_at`,
          [full_name, email, language_preference, hashedNewPassword, role || req.user.role, userId]
        );
        
        res.json(result.rows[0]);
      } else {
        // Update user without password change
        const result = await pool.query(
          `UPDATE users 
           SET full_name = $1, email = $2, language_preference = $3, role = $4, updated_at = NOW()
           WHERE user_id = $5 
           RETURNING user_id, email, full_name, language_preference, role, created_at, updated_at`,
          [full_name, email, language_preference, role || req.user.role, userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        await logActivity(pool, req.user.user_id, 
          req.user.user_id == userId ? 'UPDATE_OWN_PROFILE' : 'UPDATE_USER_PROFILE', 
          'USER', 
          result.rows[0].email, 
          {
            updated_user_id: userId,
            updated_fields: Object.keys(req.body).filter(field => field !== 'currentPassword' && field !== 'newPassword'),
            password_changed: !!newPassword,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        );
        res.json(result.rows[0]);
      }
    } catch (err) {
      console.error('Error updating user:', err);
      if (err.code === '23505') {
        res.status(400).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: 'Failed to update user' });
      }
    }
  });

    router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    const { email, password, full_name, role, language_preference } = req.body;
    
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role, language_preference)
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING user_id, email, full_name, role, language_preference, created_at, updated_at`,
        [email, hashedPassword, full_name, role || 'user', language_preference || 'en']
      );
      await logActivity(pool, req.user.user_id, 'CREATE_USER', 'USER', email, {
      admin_email: req.user.email,
      created_user_id: result.rows[0].user_id,
      created_user_role: role || 'user',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      if (err.code === '23505') {
        res.status(400).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: 'Error creating user' });
      }
    }
  });

    // Delete user (admin only)
  router.delete('/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    const { userId } = req.params;
    
    // Prevent admin from deleting themselves
    if (req.user.user_id == userId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    try {
      const result = await pool.query(
        'DELETE FROM users WHERE user_id = $1 RETURNING user_id, email, full_name',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      await logActivity(pool, req.user.user_id, 'DELETE_USER', 'USER', result.rows[0].email, {
        admin_email: req.user.email,
        deleted_user_id: userId,
        deleted_user_name: result.rows[0].full_name,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ message: 'User deleted successfully', user: result.rows[0] });
    } catch (err) {
      console.error('Error deleting user:', err);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

    // Get user details (admin only)
  router.get('/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    const { userId } = req.params;
    
    try {
      const userResult = await pool.query(`
        SELECT 
          user_id, 
          email, 
          full_name, 
          role, 
          language_preference,
          created_at, 
          updated_at
        FROM users 
        WHERE user_id = $1
      `, [userId]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];

      // Get user's accounts
      const accountsResult = await pool.query(`
        SELECT account_id, name, account_type, currency, current_balance
        FROM accounts 
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [userId]);

      // Get recent transactions
      const transactionsResult = await pool.query(`
        SELECT t.transaction_id, t.amount, t.description, t.transaction_date, t.transaction_type,
               a.name as account_name, c.name as category_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.account_id
        LEFT JOIN categories c ON t.category_id = c.category_id
        WHERE t.user_id = $1
        ORDER BY t.transaction_date DESC
        LIMIT 10
      `, [userId]);

      await logActivity(pool, req.user.user_id, 'VIEW_USER_DETAILS', 'USER', userResult.rows[0].email, {
        admin_email: req.user.email,
        viewed_user_id: userId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.json({
        user,
        accounts: accountsResult.rows,
        recentTransactions: transactionsResult.rows
      });
    } catch (err) {
      console.error('Error fetching user details:', err);
      res.status(500).json({ error: 'Failed to fetch user details' });
    }
  });

  router.get('/notification/:notificationId', async (req, res) => {
    try {
      const { notificationId } = req.params;
      console.log(`Checking notification ${notificationId}`);

      const result = await pool.query(
        `SELECT is_sent, type, payload->>'emailPreviewUrl' as preview_url 
        FROM notifications 
        WHERE notification_id = $1`,
        [notificationId]
      );
      
      if (result.rows.length === 0) {
        console.log(`Notification ${notificationId} not found`);

        return res.status(404).json({ error: 'Notification not found' });
      }
      console.log('Notification data:', result.rows[0]);
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  return router;
};
