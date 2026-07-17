import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
const connectionUrl = process.env.DATABASE_URL;  
  // Connect to the default 'postgres' database to create our target database
  const defaultUrl = connectionUrl.replace(/\/[^/]+$/, '/postgres');
  
  console.log('Connecting to default postgres database to check/create nam_quan...');
  const defaultClient = new Client({ connectionString: defaultUrl });
  
  try {
    await defaultClient.connect();
    const dbName = 'nam_quan';
    const res = await defaultClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    
    if (res.rowCount === 0) {
      console.log(`Database '${dbName}' does not exist. Creating it...`);
      await defaultClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database '${dbName}' created successfully.`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }
  } catch (err) {
    console.error('Error connecting to default postgres database. Is PostgreSQL running and password correct?');
    console.error(err.message);
    process.exit(1);
  } finally {
    await defaultClient.end();
  }

  // Connect to the new database and run the SQL script
  console.log('Connecting to nam_quan database to import data...');
  const targetClient = new Client({ connectionString: connectionUrl });
  
  try {
    await targetClient.connect();
    const sqlPath = path.join(__dirname, '..', '..', 'database', 'nam_quan_database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running SQL script... This might take a moment.');
    await targetClient.query(sql);
    console.log('Data imported successfully!');
  } catch (err) {
    console.error('Error importing SQL file:', err.message);
  } finally {
    await targetClient.end();
  }
}

setupDatabase();
