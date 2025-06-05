// const http = require('http');
// const accountsHandler = require('./routes/accounts');

// const server = http.createServer((req, res) => {
//   if (req.url.startsWith('/api/accounts')) {
//     accountsHandler(req, res);
//   } else {
//     res.writeHead(404);
//     res.end('Not found');
//   }
// });

// server.listen(3001, () => {
//   console.log('API running at http://localhost:3001');
// });




// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const { Pool } = require('pg');

// // PostgreSQL connection pool
// const pool = new Pool({
//   user: 'your_db_user',
//   host: 'localhost',
//   database: 'your_db_name',
//   password: 'your_db_password',
//   port: 5432,
// });

// const app = express();
// const PORT = 3001;

// app.use(cors());
// app.use(bodyParser.json());

// // GET /api/accounts
// app.get('/api/accounts', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT * FROM accounts ORDER BY account_id');
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error fetching accounts');
//   }
// });

// // POST /api/accounts
// app.post('/api/accounts', async (req, res) => {
//   const { name, account_type, currency, initial_balance } = req.body;
//   try {
//     const result = await pool.query(
//       `INSERT INTO accounts (user_id, name, account_type, currency, initial_balance, current_balance)
//        VALUES (1, $1, $2, $3, $4, $4) RETURNING *`,
//       [name, account_type, currency, initial_balance]
//     );
//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error creating account');
//   }
// });

// app.get('/ping', (req, res) => {
//   res.send('pong');
// });

// app.listen(PORT, () => {
//   console.log(`Express server listening on http://localhost:${PORT}`);
// });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();


const createAccountsRoutes = require('./routes/accounts');
const createUsersRoutes = require('./routes/users');
const createTransactionsRoutes = require('./routes/transactions');
const createBudgetsRoutes = require('./routes/budgets');
const createAuthRoutes = require('./routes/auth');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  port: process.env.DB_PORT || 5432,
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/accounts', createAccountsRoutes(pool));
app.use('/api/users', createUsersRoutes(pool));
app.use('/api/transactions', createTransactionsRoutes(pool));
app.use('/api/budgets', createBudgetsRoutes(pool));
app.use('/api/users', createAuthRoutes(pool));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});