const pool = require('./db');

const createDatabase = async () => {
  try {
    await pool.query(`CREATE DATABASE bmw
      WITH OWNER = postgres
      ENCODING = 'UTF8'
      LOCALE_PROVIDER = 'libc'
      CONNECTION LIMIT = -1
      IS_TEMPLATE = False;`);
    console.log('Baza de date "bmw" a fost creată cu succes.');
  } catch (err) {
    if (err.code === '42P04') {
      console.log('Baza de date deja există.');
    } else {
      console.error('Eroare la crearea bazei de date:', err);
    }
  } finally {
    await pool.end();
  }
};

createDatabase();