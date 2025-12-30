import { sql } from '../config/db.js'


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
            display_date = new Date().toLocaleDateString('en-GB'), // "28/12/2025"
            party = '',
            transaction_date = new Date().toISOString().split('T')[0], // "2025-12-28"
            display_time = new Date().toLocaleTimeString('en-US', { hour12: true }), // "07:10 PM"
            transaction_time = new Date().toISOString().split('T')[1].split('.')[0], // "16:10:00"
            type = 'expense'
        } = req.body;

        const transaction = await sql`
            INSERT INTO kcb_transactions (
                user_id, 
                title, 
                amount, 
                transaction_date,    -- ✅ Changed from 'date'
                display_date,        -- ✅ Changed from 'date'
                party, 
                reference, 
                transaction_time,    -- ✅ Changed from 'time'
                display_time,        -- ✅ Changed from 'time'
                type
            ) VALUES (
                ${user_id}, 
                ${title}, 
                ${amount}, 
                ${transaction_date}, 
                ${display_date},
                ${party},
                ${reference},
                ${transaction_time},
                ${display_time},
                ${type}
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