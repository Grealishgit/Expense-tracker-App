import { sql } from "../config/db.js";

async function getTransactionsByUserId(req, res) {

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
}

async function createTransaction(req, res) {
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
}

async function deleteTransaction(req, res) {
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
        return res.status(200).json(result[0]);

    } catch (error) {
        console.error('Error deleting transaction:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
}
async function getAllTransactions(req, res) {
    try {
        // Retrieve all transactions
        const transactions = await sql`
            SELECT * FROM transactions
            ORDER BY created_at DESC
        `;
        console.log('All transactions retrieved:', transactions);
        return res.status(200).json(transactions);
    } catch (error) {
        console.error('Error retrieving all transactions:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
}
async function getTransactionSummary(req, res) {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Retrieve the summary of transactions for the specified user
        const balanceResult = await sql`
            SELECT COALESCE(SUM(amount), 0) AS balance
            FROM transactions
            WHERE user_id = ${userId}
        `;

        const incomeResult = await sql`
            SELECT COALESCE(SUM(amount), 0) AS income
            FROM transactions
            WHERE user_id = ${userId} AND amount > 0
        `;

        const expensesResult = await sql`
            SELECT COALESCE(SUM(amount), 0) AS expenses
            FROM transactions
            WHERE user_id = ${userId} AND amount < 0
        `;

        res.status(200).json({
            balance: balanceResult[0].balance,
            income: incomeResult[0].income,
            expenses: expensesResult[0].expenses
        });

    } catch (error) {
        console.error('Error retrieving transaction summary:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
}

export {
    getTransactionsByUserId,
    createTransaction,
    deleteTransaction,
    getAllTransactions,
    getTransactionSummary
};
