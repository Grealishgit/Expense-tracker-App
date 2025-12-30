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

        if (reference.length < 10) {
            return res.status(400).json({
                error: 'Invalid refernce number for this transaction'
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
                transaction_date,    --  Changed from 'date'
                display_date,        --  Changed from 'date'
                party, 
                reference, 
                transaction_time,    --  Changed from 'time'
                display_time,        --  Changed from 'time'
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


export const bulkCreateKcbTransactions = async (req, res) => {
    try {
        const { user_id, transactions } = req.body;

        if (!user_id || !Array.isArray(transactions) || transactions.length === 0) {
            return res.status(400).json({
                error: 'user_id and non-empty transactions array are required'
            });
        }

        // Prepare arrays for UNNEST
        const titles = [];
        const amounts = [];
        const references = [];
        const parties = [];
        const types = [];
        const transactionDates = [];
        const displayDates = [];
        const transactionTimes = [];
        const displayTimes = [];

        const errors = [];

        transactions.forEach((tx, index) => {
            try {
                if (!tx.title || tx.amount === undefined || !tx.reference) {
                    throw new Error('Missing required fields: title, amount, or reference');
                }

                if (tx.reference.length < 10) {
                    throw new Error('Invalid reference number for one or more transactions');
                }


                const rawDate = tx.rawDate || new Date().toISOString();
                const dateObj = new Date(rawDate);

                if (isNaN(dateObj.getTime())) {
                    throw new Error(`Invalid date format: ${tx.rawDate}`);
                }

                titles.push(tx.title);
                amounts.push(tx.amount);
                references.push(tx.reference);
                parties.push(tx.party || '');
                types.push(tx.type || 'expense');
                transactionDates.push(tx.transaction_date || dateObj.toISOString().split('T')[0]);
                displayDates.push(tx.display_date || tx.date || dateObj.toLocaleDateString('en-GB'));
                transactionTimes.push(tx.transaction_time || dateObj.toTimeString().split(' ')[0]);
                displayTimes.push(tx.display_time || tx.time || dateObj.toLocaleTimeString('en-US', { hour12: true }));
            } catch (error) {
                errors.push({
                    index,
                    reference: tx.reference || `index_${index}`,
                    error: error.message
                });
            }
        });

        if (titles.length === 0) {
            return res.status(400).json({
                error: 'No valid transactions to process',
                errors
            });
        }

        // Use UNNEST for batch insert - FIXED: Proper Neon sql.query usage
        const query = `
            INSERT INTO kcb_transactions (
                user_id, 
                title, 
                amount, 
                transaction_date,
                display_date,
                party, 
                reference, 
                transaction_time,
                display_time,
                type
            ) 
            SELECT 
                $1, 
                unnest($2::text[]), 
                unnest($3::decimal[]), 
                unnest($4::date[]),
                unnest($5::text[]),
                unnest($6::text[]), 
                unnest($7::text[]), 
                unnest($8::time[]),
                unnest($9::text[]),
                unnest($10::text[])
            ON CONFLICT (reference) DO UPDATE SET
                amount = EXCLUDED.amount,
                title = EXCLUDED.title,
                party = EXCLUDED.party
            RETURNING *
        `;

        const params = [
            user_id,
            titles,
            amounts,
            transactionDates,
            displayDates,
            parties,
            references,
            transactionTimes,
            displayTimes,
            types
        ];

        // Debug: Log the query and params
        // console.log('Executing batch insert with', titles.length, 'transactions');
        // console.log('Query:', query.substring(0, 200) + '...');
        // console.log('Params count:', params.length);

        // FIX: Neon's sql.query() returns different structure
        const result = await sql.query(query, params);

        // Debug: Check result structure
        console.log('Result type:', typeof result);
        console.log('Result keys:', Object.keys(result));
        console.log('Result rows?', result.rows ? 'yes' : 'no');
        console.log('Result:', result);

        // Handle different response structures
        let insertedRows = [];
        if (Array.isArray(result)) {
            // If result is an array directly
            insertedRows = result;
        } else if (result.rows && Array.isArray(result.rows)) {
            // If result has .rows property
            insertedRows = result.rows;
        } else if (result && Array.isArray(result)) {
            // If result is the rows array
            insertedRows = result;
        }

        return res.status(201).json({
            success: true,
            message: `Batch insert completed`,
            summary: {
                total: transactions.length,
                processed: titles.length,
                failed: errors.length,
                insertedOrUpdated: insertedRows.length
            },
            data: insertedRows,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Error in batch insert:', error);
        console.error('Error stack:', error.stack);

        // More detailed error info
        return res.status(500).json({
            error: 'Failed to batch insert transactions',
            details: error.message,
            code: error.code,
            hint: 'Check if the table structure matches the query columns'
        });
    }
};


