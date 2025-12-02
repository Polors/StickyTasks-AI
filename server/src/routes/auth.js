import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    try {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        const user = stmt.get(email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { password: _, ...safeUser } = user;
        safeUser.settings = JSON.parse(safeUser.settings);

        res.json({ user: safeUser, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/me', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
        const user = stmt.get(decoded.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password: _, ...safeUser } = user;
        safeUser.settings = JSON.parse(safeUser.settings);

        res.json(safeUser);
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

router.put('/settings', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { settings } = req.body;

        const stmt = db.prepare('UPDATE users SET settings = ? WHERE id = ?');
        stmt.run(JSON.stringify(settings), decoded.id);

        // Return updated user
        const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
        const user = userStmt.get(decoded.id);
        const { password: _, ...safeUser } = user;
        safeUser.settings = JSON.parse(safeUser.settings);

        res.json(safeUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
