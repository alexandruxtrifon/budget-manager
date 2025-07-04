const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const { logActivity } = require('../logActivity');

module.exports = (pool) => {
  router.get('/:user_id', authMiddleware, async (req, res) => {
    const { user_id } = req.params;
    
    if (req.user.user_id != user_id) {
      return res.status(403).json({ error: 'You can only access your own accounts' });
    }
    
    try {
      const result = await pool.query(
        `SELECT * FROM accounts WHERE user_id = $1 ORDER BY name`,
        [user_id]
      );
      await logActivity(pool, req.user.user_id, 'VIEW_ACCOUNTS', 'ACCOUNT', null, {
        user_email: req.user.email,
        accounts_count: result.rows.length,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  });

  router.post('/', authMiddleware, async (req, res) => {
    const { user_id, name, account_type, currency, initial_balance } = req.body;
    
    if (req.user.user_id != user_id) {
      return res.status(403).json({ error: 'You can only create accounts for yourself' });
    }
    
    try {
      const result = await pool.query(
        `INSERT INTO accounts 
         (user_id, name, account_type, currency, initial_balance, current_balance) 
         VALUES ($1, $2, $3, $4, $5, $5) 
         RETURNING *`,
        [user_id, name, account_type, currency, initial_balance]
      );

      const newAccount = result.rows[0];

      await logActivity(
        pool, 
        req.user.user_id, 
        `CREATE_ACCOUNT|${name}|${newAccount.account_id}`, 
        'ACCOUNT', 
        name, 
        {
          user_email: req.user.email,
          account_id: newAccount.account_id,
          account_type: account_type,
          currency: currency,
          initial_balance: initial_balance,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error creating account:', err);
      res.status(500).json({ error: 'Failed to create account' });
    }
  });

  router.put('/:account_id', authMiddleware, async (req, res) => {
    const { account_id } = req.params;
    const { name, account_type, currency, initial_balance } = req.body;
    
    try {
      const accountCheck = await pool.query(
        'SELECT user_id FROM accounts WHERE account_id = $1',
        [account_id]
      );
      
      if (accountCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      if (accountCheck.rows[0].user_id !== req.user.user_id) {
        return res.status(403).json({ error: 'You can only update your own accounts' });
      }
      
      const previousAccount = await pool.query(
        'SELECT initial_balance, current_balance FROM accounts WHERE account_id = $1',
        [account_id]
      );

      
      const balanceDifference = initial_balance - previousAccount.rows[0].initial_balance;
      const newCurrentBalance = parseFloat(previousAccount.rows[0].current_balance) + balanceDifference;
      //const previousAccount = accountCheck.rows[0];
      
      // Track what changed
      // const changes = {};
      // if (name !== previousAccount.name) changes.name = { from: previousAccount.name, to: name };
      // if (account_type !== previousAccount.account_type) changes.account_type = { from: previousAccount.account_type, to: account_type };
      // if (currency !== previousAccount.currency) changes.currency = { from: previousAccount.currency, to: currency };
      // if (initial_balance !== previousAccount.initial_balance) changes.initial_balance = { from: previousAccount.initial_balance, to: initial_balance };
      
      // const balanceDifference = initial_balance - previousAccount.initial_balance;
      // const newCurrentBalance = parseFloat(previousAccount.current_balance) + balanceDifference;
      
      
      const result = await pool.query(
        `UPDATE accounts 
         SET name = $1, account_type = $2, currency = $3, initial_balance = $4, current_balance = $5, updated_at = NOW() 
         WHERE account_id = $6 
         RETURNING *`,
        [name, account_type, currency, initial_balance, newCurrentBalance, account_id]
      );

      const updatedAccount = result.rows[0];
      await logActivity(
        pool, 
        req.user.user_id, 
        `UPDATE_ACCOUNT|${updatedAccount.name}|${account_id}`, 
        'ACCOUNT', 
        name, 
        {
          user_email: req.user.email,
          account_id: account_id,
          changes: changes || '',
          balance_difference: balanceDifference,
          new_current_balance: newCurrentBalance,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating account:', err);
      res.status(500).json({ error: 'Failed to update account' });
    }
  });

  router.delete('/:account_id', authMiddleware, async (req, res) => {
    const { account_id } = req.params;
    
    try {
      const accountCheck = await pool.query(
        'SELECT user_id FROM accounts WHERE account_id = $1',
        [account_id]
      );
      
      if (accountCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      if (accountCheck.rows[0].user_id !== req.user.user_id) {
        return res.status(403).json({ error: 'You can only delete your own accounts' });
      }
      
      const transactionsCheck = await pool.query(
        'SELECT COUNT(*) FROM transactions WHERE account_id = $1',
        [account_id]
      );
      const result = await pool.query(
        'SELECT name FROM accounts WHERE account_id = $1', [account_id]);
        const accountToDelete = result.rows[0];
        console.log('Account to delete:', accountToDelete);
      if (parseInt(transactionsCheck.rows[0].count) > 0) {
        await logActivity(
          pool, 
          req.user.user_id, 
          `DELETE_ACCOUNT_FAILED|${accountToDelete.name}|${account_id}`, 
          'ACCOUNT', 
          accountToDelete.name, 
          {
            user_email: req.user.email,
            account_id: account_id,
            reason: 'has_transactions',
            transaction_count: parseInt(transactionsCheck.rows[0].count),
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        );

        return res.status(400).json({ 
          error: 'Cannot delete account with transactions. Move or delete the transactions first.' 
        });
      }
      
      await pool.query('DELETE FROM accounts WHERE account_id = $1', [account_id]);
      await logActivity(
        pool, 
        req.user.user_id, 
        `DELETE_ACCOUNT|${accountToDelete.name}|${account_id}`, 
        'ACCOUNT', 
        accountToDelete.name, 
        {
          user_email: req.user.email,
          deleted_account_id: account_id,
          deleted_account_type: accountToDelete.account_type,
          deleted_account_currency: accountToDelete.currency,
          final_balance: accountToDelete.current_balance,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      res.json({ message: 'Account deleted successfully' });
    } catch (err) {
      console.error('Error deleting account:', err);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  });

  return router;
};