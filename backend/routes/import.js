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
        //console.log(req);
        //console.log(`accountId (${typeof accountId}):`, accountId);
        //console.log(`userId (${typeof userId}):`, userId);

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

        const stats = {
          total: transactionsList.length,
          imported: 0,
          skipped: {
            nullReference: 0,
            duplicates: 0
          }
        };
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

          // Fetch all categories and their keywords for matching
          const categoriesResult = await client.query(
            "SELECT category_id, name, match_keywords FROM categories"
          );
          const categories = categoriesResult.rows;
          
          // Function to find matching category based on transaction description
          function findMatchingCategory(description) {
            if (!description) return null;
            
            // Normalize description: lowercase, remove spaces, and special characters
            const normalizedDescription = description.toLowerCase()
              .replace(/\s+/g, '')  // Remove all spaces
              .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ''); // Remove punctuation
            
            for (const category of categories) {
              if (category.match_keywords && category.match_keywords.length > 0) {
                for (const keyword of category.match_keywords) {
                  if (!keyword) continue;
                  
                  // Normalize keyword the same way
                  const normalizedKeyword = keyword.toLowerCase()
                    .replace(/\s+/g, '')
                    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
                  
                  // Check if normalized description contains normalized keyword
                  if (normalizedDescription.includes(normalizedKeyword)) {
                    console.log(`Matched "${description}" to category "${category.name}" with keyword "${keyword}"`);
                    return category.category_id;
                  }
                }
              }
            }
            
            return null; // No match found
          }


          for (const transaction of transactionsList) {
            // Check 1: Skip transactions with null reference if you want to enforce references
            // Only implement this check if references are mandatory for your business logic
            // Uncomment the next block if reference is mandatory
            
            if (!transaction.reference) {
              stats.skipped.nullReference++;
              console.log(`Skipped transaction with null reference: ${transaction.description}`);
              continue;
            }

            // Check 2: Check for duplicates before insertion
            // Build a query that looks for potential duplicates
            const duplicateCheckQuery = `
              SELECT transaction_id FROM transactions
              WHERE user_id = $1 
              AND account_id = $2 
              AND ABS(amount::numeric - $3::numeric) < 0.001
              AND transaction_date = $4
              AND (
                ${transaction.reference ? "reference = $5" : "description = $5"}
              )
            `;

            const duplicateCheckParams = [
              userId,
              accountId,
              transaction.amount,
              transaction.date,
              transaction.reference || transaction.description
            ];

            const duplicateCheck = await client.query(
              duplicateCheckQuery,
              duplicateCheckParams
            );

            // Skip if duplicate found
            if (duplicateCheck.rows.length > 0) {
              stats.skipped.duplicates++;
              console.log(`Skipped duplicate transaction: ${transaction.description} on ${transaction.date}`);
              continue;
            }

            // Find matching category for this transaction
            const categoryId = findMatchingCategory(transaction.description);
            
            // Count categorized transactions
            if (categoryId) {
              stats.categorized++;
            }

            await client.query(
              `INSERT INTO transactions 
            (user_id, account_id, amount, currency, transaction_type, description, transaction_date, reference, category_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                userId,
                accountId,
                transaction.amount,
                account.currency,
                transaction.type,
                transaction.description,
                transaction.date,
                transaction.reference || null,
                categoryId || null
              ]
            );
            stats.imported++;

          }

          await client.query("COMMIT");
          await logActivity(pool, userId, 'IMPORT_BANK_STATEMENT', 'ACCOUNT', accountId, {
            user_email: req.body.userEmail || 'unknown',
            account_id: accountId,
            imported_count: stats.imported,
            skipped_duplicates: stats.skipped.duplicates,
            skipped_null_reference: stats.skipped.nullReference,
            categorized_count: stats.categorized,
            total_parsed: stats.total,
            file_name: req.file.originalname,
            file_size: req.file.size,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
          res.status(201).json({
            message: `Successfully imported ${stats.imported} transactions`,
            stats: stats
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
