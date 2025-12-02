import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../db.js';

const router = express.Router();

const adminOnly = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

router.use(adminOnly);

router.get('/users', (req, res) => {
    try {
        const stmt = db.prepare('SELECT id, name, email, role, settings, created_at FROM users');
        const users = stmt.all();

        const parsedUsers = users.map(u => ({
            ...u,
            settings: JSON.parse(u.settings)
        }));

        res.json(parsedUsers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.post('/users', (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const id = crypto.randomUUID();
        const settings = JSON.stringify({ defaultFont: 'font-hand', defaultColor: '#fef3c7' }); // Default settings

        const stmt = db.prepare(`
      INSERT INTO users (id, name, email, password, role, settings)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

        stmt.run(id, name, email, hashedPassword, role || 'user', settings);

        res.json({ id, name, email, role });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'User already exists' });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

router.delete('/users/:email', (req, res) => {
    const { email } = req.params;

    // Prevent deleting self (admin)
    // Ideally check if email matches current user, but for now just check if it's the main admin email from env
    if (email === process.env.ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Cannot delete root admin' });
    }

    try {
        const stmt = db.prepare('DELETE FROM users WHERE email = ?');
        const result = stmt.run(email);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;
