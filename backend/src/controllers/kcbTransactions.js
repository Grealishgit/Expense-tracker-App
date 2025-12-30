import { sql } from "../config/db.js";

export const createKcbTransaction = async (req, res) => {
    try {
        // Only require essential fields
        const { user_id, title, amount, reference } = req.body;

        if (!user_id || !title || amount === undefined || !reference) {
            return res.status(400).json({
                error: 'user_id, title, amount, and reference are required'
            });
        }

        // Extract optional fields with defaults
        const {
            date = new Date().toLocaleDateString('en-GB'), // Default to today
            party = '',
            rawDate = new Date().toISOString(),
            time = new Date().toLocaleTimeString('en-US', { hour12: true }),
            type = 'expense'
        } = req.body;

        const transaction = await sql`
            INSERT INTO kcb_transactions (
                user_id, title, amount, date, party, 
                raw_date, reference, time, type
            ) VALUES (
                ${user_id}, ${title}, ${amount}, ${date}, ${party},
                ${rawDate}, ${reference}, ${time}, ${type}
            )
            RETURNING *
        `;

        return res.status(201).json(transaction[0]);

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            error: 'Failed to create transaction',
            details: error.message
        });
    }
}