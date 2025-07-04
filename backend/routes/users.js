const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const authMiddleware = require('../authMiddleware');
const adminMiddleware = require('../adminMiddleware');
const { logActivity } = require('../logActivity');

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
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, full_name)
         VALUES ($1, $2, $3) RETURNING user_id, email, full_name`,
        [email, hashedPassword, full_name]
      );
      const notificationResult = await pool.query(
        `INSERT INTO notifications (user_id, type, payload, is_sent)
        VALUES ($1, $2, $3, $4) RETURNING notification_id`,
        [
          result.rows[0].user_id, 
          'welcome_email', 
          JSON.stringify({
            email: email,
            name: full_name,
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
        res.status(400).send({error: 'Email already exists'});
      } else {
        res.status(500).send('Error registering user');
      }
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
        `SELECT is_sent, payload->>'emailPreviewUrl' as preview_url 
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
