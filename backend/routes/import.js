const express = require("express");
const router = express.Router();
const multer = require("multer");
const { parseBTStatement } = require("../../../bank-statement-parser/bt");
const { logActivity } = require('../logActivity');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

module.exports = (pool) => {
  router.post(
    "/bank-statement",
    upload.single("statementFile"),
    async (req, res) => {
      try {
        const { accountId, userId } = req.body;
        console.log(req);
        //const accountId = req.body.accountId;
        //const userId = req.body.userId;
        // NU VINE USERID !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // Debug
        console.log(`accountId (${typeof accountId}):`, accountId);
        console.log(`userId (${typeof userId}):`, userId);

        if (!req.file || !req.file.buffer) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        if (!accountId || !userId) {
          return res
            .status(400)
            .json({ error: "Account ID and User ID are required" });
        }

        // Parse the bank statement
        const parseResult = await parseBTStatement(req.file.buffer);
        if (
          !parseResult ||
          !parseResult.transactions ||
          !Array.isArray(parseResult.transactions)
        ) {
          return res.status(400).json({
            error:
              "Failed to parse bank statement: Invalid format or missing transactions",
          });
        }

        const transactionsList = parseResult.transactions;
        console.log(
          `Successfully parsed ${transactionsList.length} transactions`
        );

        // Begin a transaction to ensure data consistency
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          // Get account details to determine currency
          const accountResult = await client.query(
            "SELECT currency FROM accounts WHERE account_id = $1 AND user_id = $2",
            [accountId, userId]
          );

          if (accountResult.rows.length === 0) {
            throw new Error("Account not found");
          }

          const account = accountResult.rows[0];

          for (const transaction of transactionsList) {
            await client.query(
              `INSERT INTO transactions 
            (user_id, account_id, amount, currency, transaction_type, description, transaction_date) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                userId,
                accountId,
                transaction.amount,
                account.currency,
                transaction.type,
                transaction.description,
                transaction.date,
              ]
            );
          }

          await client.query("COMMIT");
          await logActivity(pool, userId, 'IMPORT_BANK_STATEMENT', 'ACCOUNT', account.name, {
            user_email: req.body.userEmail || 'unknown',
            account_id: accountId,
            transaction_count: transactionsList.length,
            file_name: req.file.originalname,
            file_size: req.file.size,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
          res.status(201).json({
            message: `Successfully imported ${transactionsList.length} transactions`,
            count: transactionsList.length,
          });
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }
      } catch (err) {
        console.error("Error importing bank statement:", err);
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          code: err.code,
        });
        res.status(500).json({ error: "Failed to import bank statement" });
        console.log(err);
      }
    }
  );

  return router;
};
