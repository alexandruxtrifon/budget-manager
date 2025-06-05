const pool = require('./db');

const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL
    );
  `;

  try {
    await pool.query(query);
    console.log('Tabela "users" a fost creată cu succes.');
  } catch (err) {
    console.error('Eroare la crearea tabelei:', err);
  } finally {
    await pool.end();
  }
};

createTable();