import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();

// Middleware to authenticate
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

router.use(authenticate);

router.get('/', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM notes WHERE user_id = ?');
        const notes = stmt.all(req.userId);

        // Parse items JSON
        const parsedNotes = notes.map(note => ({
            ...note,
            items: JSON.parse(note.items),
            zIndex: note.z_index, // map back to camelCase
            createdAt: note.created_at
        }));

        res.json(parsedNotes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

router.put('/', (req, res) => {
    const notes = req.body; // Expecting array of notes

    if (!Array.isArray(notes)) {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    const deleteStmt = db.prepare('DELETE FROM notes WHERE user_id = ?');
    const insertStmt = db.prepare(`
    INSERT INTO notes (id, user_id, title, color, items, rotation, z_index, created_at)
    VALUES (@id, @user_id, @title, @color, @items, @rotation, @zIndex, @createdAt)
  `);

    const transaction = db.transaction((userId, newNotes) => {
        deleteStmt.run(userId);
        for (const note of newNotes) {
            insertStmt.run({
                ...note,
                user_id: userId,
                items: JSON.stringify(note.items),
                zIndex: note.zIndex,
                createdAt: note.createdAt
            });
        }
    });

    try {
        transaction(req.userId, notes);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save notes' });
    }
});

export default router;
