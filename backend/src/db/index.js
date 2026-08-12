import pkg from 'pg';
const { Pool } = pkg;
import config from '../config/index.js';
import { createInMemoryDb } from './inMemoryDb.js';

let pool;
let isInMemory = false;

try {
  pool = new Pool({
    connectionString: config.databaseUrl,
  });
} catch {
  console.log('⚠️ PostgreSQL pool initialization failed. Falling back to In-Memory Database (pg-mem)...');
  pool = createInMemoryDb();
  isInMemory = true;
}

export const query = async (text, params) => {
  if (isInMemory) return pool.query(text, params);
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      if (!isInMemory) {
        console.log('⚠️ PostgreSQL connection refused. Falling back to In-Memory Database (pg-mem)...');
        pool = createInMemoryDb();
        isInMemory = true;
      }
      return pool.query(text, params);
    }
    throw err;
  }
};

export default {
  query,
  on: (...args) => (pool.on ? pool.on(...args) : undefined),
};
