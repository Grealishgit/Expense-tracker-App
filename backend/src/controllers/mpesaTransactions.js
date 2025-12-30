import { sql } from "../config/db.js";


export const getMpesaTransactions = async (req, res) => {
    try {
        const { user_id, title, amount, category } = req.body;
        if (!user_id || !title || amount === undefined || !category) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const transaction = await sql`
                INSERT INTO mpesa-transactions (user_id, title, amount, category)
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


export const getMpesaTransaction = async (req, res) => {

}