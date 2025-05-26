import express from 'express';
import dotenv from 'dotenv';
import { sql } from './config/db.js';

dotenv.config();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json()); 

const PORT = process.env.PORT || 5000;

async function connectToDatabase() {

    try {
        await sql`CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            category VARCHAR(255) NOT NULL,
            created_at DATE NOT NULL DEFAULT CURRENT_DATE
        )`;

        console.log('Database connected  successfully');

    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1); // Exit the process with failure
    }
}



app.get('/', (req, res) => {
    res.send('Get request received');
});

app.post('/api/transactions', async (req, res) => {
    try {
        const { user_id, title, amount, category } = req.body;
        if (!user_id || !title || amount === undefined || !category) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const transaction = await sql`
            INSERT INTO transactions (user_id, title, amount, category)
            VALUES (${user_id}, ${title}, ${amount}, ${category})
            RETURNING *
        `
        console.log('Transaction created:', transaction[0]);

        return res.status(201).json(transaction[0]);

    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ message: 'Internal server error', error });

    }
})

app.get('/api/transactions/:userId', async (req, res) => {
    try {

        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Retrieve transactions for the specified user
        const transactions = await sql`
            SELECT * FROM transactions
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
        `;
        // const transactions = await sql`SELECT * FROM transactions ORDER BY created_at DESC LIMIT 100`;
        console.log('Transactions retrieved:', transactions);
        return res.status(200).json(transactions);
    } catch (error) {
        console.error('Error retrieving transactions:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
});

app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'Transaction ID is required' });
        }

        // Delete the transaction with the specified ID
        const result = await sql`
            DELETE FROM transactions
            WHERE id = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        console.log('Transaction deleted:', result[0]);
        return res.status(200).json({ message: 'Transaction deleted successfully', transaction: result[0] });

    } catch (error) {
        console.error('Error deleting transaction:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
});

// console.log(`Port: ${process.env.PORT}`);

connectToDatabase().then(() => {
    app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    });
})
