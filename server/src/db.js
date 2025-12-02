import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '../database.sqlite');

const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

export function initDb() {
  // Create Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      settings TEXT DEFAULT '{}',
      created_at INTEGER DEFAULT (unixepoch() * 1000)
    )
  `);

  // Create Notes Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT,
      color TEXT,
      items TEXT, -- JSON string
      rotation REAL,
      z_index INTEGER,
      created_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  seedAdmin();
}

function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('WARNING: ADMIN_EMAIL or ADMIN_PASSWORD not set. Admin user will NOT be created.');
      return;
    } else {
      // Dev defaults
      console.log('Using default dev credentials (admin@admin.com / admin)');
    }
  }

  const email = adminEmail || 'admin@admin.com';
  const password = adminPassword || 'admin';

  const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const existingAdmin = stmt.get(email);

  if (!existingAdmin) {
    console.log('Seeding admin user...');
    const hashedPassword = bcrypt.hashSync(password, 10);
    const insert = db.prepare(`
      INSERT INTO users (id, name, email, password, role, settings)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      'admin-001',
      'Administrator',
      email,
      hashedPassword,
      'admin',
      JSON.stringify({ defaultFont: 'font-hand', defaultColor: '#fef3c7' })
    );
    console.log('Admin user seeded.');
  }
}

export default db;
