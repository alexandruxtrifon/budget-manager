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
const createImportRoutes = require('./routes/import');
const createLogsRoutes = require('./routes/logs');
const createReportsRoutes = require('./routes/reports');
const createForecastRoutes = require('./routes/forecast');

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
app.use('/api/auth', createAuthRoutes(pool));
app.use('/api/import', createImportRoutes(pool)); 
app.use('/api/logs', createLogsRoutes(pool));
app.use('/api/reports', createReportsRoutes(pool));
app.use('/api/forecast', createForecastRoutes(pool));

app.get('/ping', (req, res) => {
  res.send('pong');
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});