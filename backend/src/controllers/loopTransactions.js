import { sql } from "../config/db.js";

export const createLoopTransaction = async (req, res) => {
    try {
        const { user_id, amount, transaction_id, mpesa_reference } = req.body;

        // Required fields validation
        if (!user_id || amount === undefined || !transaction_id || !mpesa_reference) {
            return res.status(400).json({
                error: 'user_id, amount, transaction_id, and mpesa_reference are required'
            });
        }

        if (mpesa_reference.length < 10) {
            return res.status(400).json({
                error: 'Invalid mpesa_reference number for the transaction'
            });
        }

        // Parse and transform data
        const rawDate = req.body.rawDate || new Date().toISOString();
        const dateObj = new Date(rawDate);

        const {
            display_date = dateObj.toLocaleDateString('en-GB'), // "12/11/2025"
            fee = 0,
            loop_reference = transaction_id, // Default to transaction_id
            party = '',
            display_time = dateObj.toLocaleTimeString('en-US', {
                hour12: true,
                hour: 'numeric',
                minute: '2-digit'
            }), // "1:43 PM"
            title = 'Received via LOOP',
            type = 'income'
        } = req.body;

        const transaction = await sql`
            INSERT INTO loop_transactions (
                user_id,
                amount,
                transaction_date,
                display_date,
                fee,
                transaction_id,
                loop_reference,
                mpesa_reference,
                party,
                transaction_time,
                display_time,
                title,
                type,
                raw_timestamp
            ) VALUES (
                ${user_id},
                ${amount},
                ${dateObj.toISOString().split('T')[0]}, -- 2025-11-12
                ${display_date},
                ${fee},
                ${transaction_id},
                ${loop_reference},
                ${mpesa_reference},
                ${party},
                ${dateObj.toTimeString().split(' ')[0]}, -- 10:43:27
                ${display_time},
                ${title},
                ${type},
                ${rawDate}
            )
            RETURNING *
        `;

        return res.status(201).json({
            success: true,
            data: transaction[0]
        });

    } catch (error) {
        console.error('Error creating loop transaction:', error);

        // Handle duplicate transaction_id
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({
                error: 'Transaction already exists',
                details: 'A transaction with this ID already exists'
            });
        }

        return res.status(500).json({
            error: 'Failed to create transaction',
            details: error.message
        });
    }
};


export const bulkCreateLoopTransactions = async (req, res) => {
    try {
        const { user_id, transactions } = req.body;

        if (!user_id || !Array.isArray(transactions) || transactions.length === 0) {
            return res.status(400).json({
                error: 'user_id and transactions array are required'
            });
        }

        for (const tx of transactions) {
            if (!tx.id || tx.amount === undefined || !tx.mpesaRef) {
                return res.status(400).json({
                    error: 'Each transaction must have id, amount, and mpesaRef'
                });
            }
        }

        for (const tx of transactions) {
            if (tx.mpesaRef.length < 10) {
                return res.status(400).json({
                    error: 'Invalid mpesa_reference number for one or more transactions'
                });
            }
        }


        // Validate each transaction    

        const createdTransactions = [];
        const errors = [];

        for (const tx of transactions) {
            try {
                const rawDate = tx.rawDate || new Date().toISOString();
                const dateObj = new Date(rawDate);

                const result = await sql`
                    INSERT INTO loop_transactions (
                        user_id,
                        amount,
                        transaction_date,
                        display_date,
                        fee,
                        transaction_id,
                        loop_reference,
                        mpesa_reference,
                        party,
                        transaction_time,
                        display_time,
                        title,
                        type,
                        raw_timestamp
                    ) VALUES (
                        ${user_id},
                        ${tx.amount},
                        ${dateObj.toISOString().split('T')[0]},
                        ${tx.date || dateObj.toLocaleDateString('en-GB')},
                        ${tx.fee || 0},
                        ${tx.id},
                        ${tx.loopRef || tx.id},
                        ${tx.mpesaRef},
                        ${tx.party || ''},
                        ${dateObj.toTimeString().split(' ')[0]},
                        ${tx.time || dateObj.toLocaleTimeString('en-US', { hour12: true })},
                        ${tx.title || 'Received via LOOP'},
                        ${tx.type || 'income'},
                        ${rawDate}
                    )
                    ON CONFLICT (transaction_id) DO NOTHING
                    RETURNING *
                `;

                if (result.length > 0) {
                    createdTransactions.push(result[0]);
                }
            } catch (error) {
                errors.push({
                    transaction: tx.id,
                    error: error.message
                });
            }
        }

        return res.status(201).json({
            success: true,
            created: createdTransactions.length,
            failed: errors.length,
            data: createdTransactions,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Error bulk creating transactions:', error);
        return res.status(500).json({
            error: 'Failed to bulk create transactions',
            details: error.message
        });
    }
};


export const getUserLoopTransactions = async (req, res) => {
    try {
        const { user_id } = req.params;
        const {
            start_date,
            end_date,
            type,
            party,
            limit = 50,
            offset = 0
        } = req.query;

        let query = sql`
            SELECT * FROM loop_transactions 
            WHERE user_id = ${user_id}
        `;

        if (start_date) {
            query = sql`${query} AND transaction_date >= ${start_date}`;
        }

        if (end_date) {
            query = sql`${query} AND transaction_date <= ${end_date}`;
        }

        if (type) {
            query = sql`${query} AND type = ${type}`;
        }

        if (party) {
            query = sql`${query} AND party ILIKE ${'%' + party + '%'}`;
        }

        query = sql`
            ${query}
            ORDER BY transaction_date DESC, transaction_time DESC
            LIMIT ${limit}
            OFFSET ${offset}
        `;

        const transactions = await query;

        // Get total count for pagination
        const countQuery = sql`
            SELECT COUNT(*) as total 
            FROM loop_transactions 
            WHERE user_id = ${user_id}
        `;
        const countResult = await countQuery;

        return res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                total: parseInt(countResult[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        return res.status(500).json({
            error: 'Failed to fetch transactions',
            details: error.message
        });
    }
};


export const getTransactionSummary = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { start_date, end_date } = req.query;

        let whereClause = sql`WHERE user_id = ${user_id}`;

        if (start_date) {
            whereClause = sql`${whereClause} AND transaction_date >= ${start_date}`;
        }

        if (end_date) {
            whereClause = sql`${whereClause} AND transaction_date <= ${end_date}`;
        }

        const summary = await sql`
            SELECT 
                type,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount,
                AVG(amount) as average_amount,
                MIN(amount) as min_amount,
                MAX(amount) as max_amount
            FROM loop_transactions
            ${whereClause}
            GROUP BY type
            ORDER BY type
        `;

        const totalSummary = await sql`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(amount) as grand_total,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
                SUM(fee) as total_fees
            FROM loop_transactions
            ${whereClause}
        `;

        return res.status(200).json({
            success: true,
            data: {
                by_type: summary,
                totals: totalSummary[0]
            }
        });

    } catch (error) {
        console.error('Error fetching summary:', error);
        return res.status(500).json({
            error: 'Failed to fetch transaction summary',
            details: error.message
        });
    }
};


// export const deleteLoopTransaction = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { user_id } = req.body; // Require user_id for security

//         if (!user_id) {
//             return res.status(400).json({
//                 error: 'user_id is required for deletion'
//             });
//         }

//         const result = await sql`
//             DELETE FROM loop_transactions
//             WHERE id = ${id} AND user_id = ${user_id}
//             RETURNING *
//         `;

//         if (result.length === 0) {
//             return res.status(404).json({
//                 error: 'Transaction not found or not authorized'
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             message: 'Transaction deleted successfully',
//             data: result[0]
//         });

//     } catch (error) {
//         console.error('Error deleting transaction:', error);
//         return res.status(500).json({
//             error: 'Failed to delete transaction',
//             details: error.message
//         });
//     }
// };