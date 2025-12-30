import { sql } from "../config/db.js";

export const createMpesaTransaction = async (req, res) => {
    try {
        const { user_id, amount, transaction_id, new_balance, party, title, type } = req.body;

        // Required fields validation
        if (!user_id || amount === undefined || !transaction_id ||
            new_balance === undefined || !party || !title || !type) {
            return res.status(400).json({
                error: 'user_id, amount, transaction_id, new_balance, party, title, and type are required'
            });
        }

        if (transaction_id.length < 10) {
            return res.status(400).json({
                error: 'Invalid transaction_id for this transaction'
            });
        }

        // Parse and transform data
        const rawDate = req.body.rawDate || req.body.raw_timestamp || new Date().toISOString();
        const dateObj = new Date(rawDate);

        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({
                error: 'Invalid date format in rawDate'
            });
        }

        const transaction = await sql`
            INSERT INTO mpesa_transactions (
                user_id,
                amount,
                transaction_date,
                display_date,
                transaction_id,
                new_balance,
                party,
                raw_timestamp,
                transaction_time,
                display_time,
                title,
                transaction_cost,
                type,
                category
            ) VALUES (
                ${user_id},
                ${amount},
                ${dateObj.toISOString().split('T')[0]},           -- 2025-12-30
                ${req.body.display_date || req.body.date || ''}, -- Empty string
                ${transaction_id},
                ${new_balance},
                ${party},
                ${rawDate},
                ${dateObj.toTimeString().split(' ')[0]},         -- 15:27:06
                ${req.body.display_time || req.body.time || ''}, -- Empty string
                ${title},
                ${req.body.transaction_cost || req.body.transactionCost || 0},
                ${type},
                ${req.body.category || null}
            )
            ON CONFLICT (transaction_id) DO UPDATE SET
                amount = EXCLUDED.amount,
                new_balance = EXCLUDED.new_balance,
                party = EXCLUDED.party,
                title = EXCLUDED.title,
                type = EXCLUDED.type,
                updated_at = NOW()
            RETURNING *
        `;

        return res.status(201).json({
            success: true,
            message: 'Transaction created/updated successfully',
            data: transaction[0]
        });

    } catch (error) {
        console.error('Error creating M-Pesa transaction:', error);

        return res.status(500).json({
            error: 'Failed to create transaction',
            details: error.message
        });
    }
};


export const bulkCreateMpesaTransactions = async (req, res) => {
    try {
        const { user_id, transactions } = req.body;

        if (!user_id || !Array.isArray(transactions) || transactions.length === 0) {
            return res.status(400).json({
                error: 'user_id and non-empty transactions array are required'
            });
        }

        for (const tx of transactions) {
            if (tx.id && tx.id.length < 10) {
                return res.status(400).json({
                    error: `Invalid transaction id for one or more transactions: ${tx.id}`
                });
            }
        }

        // Validate each transaction
        const validationErrors = [];
        transactions.forEach((tx, index) => {
            if (!tx.id || tx.amount === undefined || tx.newBalance === undefined ||
                !tx.party || !tx.title || !tx.type) {
                validationErrors.push({
                    index,
                    transaction_id: tx.id || `index_${index}`,
                    error: 'Missing required fields: id, amount, newBalance, party, title, or type'
                });
            }
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Some transactions have missing required fields',
                invalid: validationErrors
            });
        }

        const createdTransactions = [];
        const errors = [];

        for (const tx of transactions) {
            try {
                const rawDate = tx.rawDate || new Date().toISOString();
                const dateObj = new Date(rawDate);

                if (isNaN(dateObj.getTime())) {
                    throw new Error(`Invalid date format: ${tx.rawDate}`);
                }

                const result = await sql`
                    INSERT INTO mpesa_transactions (
                        user_id,
                        amount,
                        transaction_date,
                        display_date,
                        transaction_id,
                        new_balance,
                        party,
                        raw_timestamp,
                        transaction_time,
                        display_time,
                        title,
                        transaction_cost,
                        type
                    ) VALUES (
                        ${user_id},
                        ${tx.amount},
                        ${dateObj.toISOString().split('T')[0]},
                        ${tx.date || ''},  -- Empty string as in your data
                        ${tx.id},
                        ${tx.newBalance},
                        ${tx.party},
                        ${rawDate},
                        ${dateObj.toTimeString().split(' ')[0]},
                        ${tx.time || ''},  -- Empty string as in your data
                        ${tx.title},
                        ${tx.transactionCost || 0},
                        ${tx.type}
                    )
                    ON CONFLICT (transaction_id) DO UPDATE SET
                        amount = EXCLUDED.amount,
                        new_balance = EXCLUDED.new_balance,
                        party = EXCLUDED.party,
                        title = EXCLUDED.title,
                        type = EXCLUDED.type,
                        updated_at = NOW()
                    RETURNING *
                `;

                createdTransactions.push(result[0]);
            } catch (error) {
                errors.push({
                    transaction_id: tx.id,
                    error: error.message,
                    data: tx
                });
            }
        }

        // Calculate success rate
        const successRate = (createdTransactions.length / transactions.length * 100).toFixed(2);

        return res.status(201).json({
            success: true,
            message: `Processed ${transactions.length} M-Pesa transactions`,
            summary: {
                total: transactions.length,
                created: createdTransactions.length,
                failed: errors.length,
                successRate: `${successRate}%`
            },
            data: createdTransactions,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Error bulk creating M-Pesa transactions:', error);
        return res.status(500).json({
            error: 'Failed to bulk create transactions',
            details: error.message
        });
    }
};


export const getMpesaTransactions = async (req, res) => {
    try {
        const { user_id } = req.params;
        const {
            start_date,
            end_date,
            type,
            party,
            min_amount,
            max_amount,
            limit = 50,
            offset = 0,
            sort_by = 'transaction_date',
            sort_order = 'DESC'
        } = req.query;

        if (!user_id) {
            return res.status(400).json({
                error: 'user_id is required'
            });
        }

        // Build query dynamically
        let query = sql`SELECT * FROM mpesa_transactions WHERE user_id = ${user_id}`;
        let countQuery = sql`SELECT COUNT(*) as total FROM mpesa_transactions WHERE user_id = ${user_id}`;

        // Apply filters
        if (start_date) {
            query = sql`${query} AND transaction_date >= ${start_date}`;
            countQuery = sql`${countQuery} AND transaction_date >= ${start_date}`;
        }

        if (end_date) {
            query = sql`${query} AND transaction_date <= ${end_date}`;
            countQuery = sql`${countQuery} AND transaction_date <= ${end_date}`;
        }

        if (type) {
            query = sql`${query} AND type = ${type}`;
            countQuery = sql`${countQuery} AND type = ${type}`;
        }

        if (party) {
            query = sql`${query} AND party ILIKE ${'%' + party + '%'}`;
            countQuery = sql`${countQuery} AND party ILIKE ${'%' + party + '%'}`;
        }

        if (min_amount) {
            query = sql`${query} AND amount >= ${min_amount}`;
            countQuery = sql`${countQuery} AND amount >= ${min_amount}`;
        }

        if (max_amount) {
            query = sql`${query} AND amount <= ${max_amount}`;
            countQuery = sql`${countQuery} AND amount <= ${max_amount}`;
        }

        // Apply sorting
        const validSortColumns = ['transaction_date', 'amount', 'created_at', 'party'];
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'transaction_date';
        const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query = sql`
            ${query} 
            ORDER BY ${sql(sortColumn)} ${sql(order)}, transaction_time ${sql(order)}
            LIMIT ${parseInt(limit)} 
            OFFSET ${parseInt(offset)}
        `;

        const [transactions, countResult] = await Promise.all([
            query,
            countQuery
        ]);

        return res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                total: parseInt(countResult[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + transactions.length) < parseInt(countResult[0].total)
            }
        });

    } catch (error) {
        console.error('Error fetching M-Pesa transactions:', error);
        return res.status(500).json({
            error: 'Failed to fetch transactions',
            details: error.message
        });
    }
};


export const getMpesaSummary = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { start_date, end_date, group_by = 'type' } = req.query;

        if (!user_id) {
            return res.status(400).json({
                error: 'user_id is required'
            });
        }

        let whereClause = sql`WHERE user_id = ${user_id}`;

        if (start_date) {
            whereClause = sql`${whereClause} AND transaction_date >= ${start_date}`;
        }

        if (end_date) {
            whereClause = sql`${whereClause} AND transaction_date <= ${end_date}`;
        }

        // Summary by type (default)
        let summaryQuery;
        if (group_by === 'type') {
            summaryQuery = sql`
                SELECT 
                    type,
                    COUNT(*) as transaction_count,
                    SUM(amount) as total_amount,
                    AVG(amount) as average_amount,
                    MIN(amount) as min_amount,
                    MAX(amount) as max_amount,
                    SUM(transaction_cost) as total_cost
                FROM mpesa_transactions
                ${whereClause}
                GROUP BY type
                ORDER BY total_amount DESC
            `;
        } else if (group_by === 'party') {
            summaryQuery = sql`
                SELECT 
                    party,
                    type,
                    COUNT(*) as transaction_count,
                    SUM(amount) as total_amount
                FROM mpesa_transactions
                ${whereClause}
                GROUP BY party, type
                ORDER BY total_amount DESC
                LIMIT 20
            `;
        } else if (group_by === 'date') {
            summaryQuery = sql`
                SELECT 
                    transaction_date,
                    type,
                    COUNT(*) as transaction_count,
                    SUM(amount) as total_amount
                FROM mpesa_transactions
                ${whereClause}
                GROUP BY transaction_date, type
                ORDER BY transaction_date DESC
            `;
        }

        // Overall totals
        const totalsQuery = sql`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(amount) as grand_total,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
                SUM(transaction_cost) as total_fees,
                AVG(amount) as average_transaction,
                MIN(new_balance) as min_balance,
                MAX(new_balance) as max_balance
            FROM mpesa_transactions
            ${whereClause}
        `;

        const [summary, totals] = await Promise.all([
            summaryQuery,
            totalsQuery
        ]);

        // Calculate net balance
        const netBalance = (totals[0].total_income || 0) - (totals[0].total_expense || 0);

        return res.status(200).json({
            success: true,
            data: {
                summary,
                totals: {
                    ...totals[0],
                    net_balance: netBalance
                },
                period: {
                    start_date: start_date || 'all',
                    end_date: end_date || 'all'
                }
            }
        });

    } catch (error) {
        console.error('Error fetching M-Pesa summary:', error);
        return res.status(500).json({
            error: 'Failed to fetch summary',
            details: error.message
        });
    }
};


export const deleteMpesaTransaction = async (req, res) => {
    try {
        const { transaction_id } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                error: 'user_id is required for deletion'
            });
        }

        const result = await sql`
            DELETE FROM mpesa_transactions 
            WHERE transaction_id = ${transaction_id} AND user_id = ${user_id}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({
                error: 'Transaction not found or not authorized'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully',
            data: result[0]
        });

    } catch (error) {
        console.error('Error deleting M-Pesa transaction:', error);
        return res.status(500).json({
            error: 'Failed to delete transaction',
            details: error.message
        });
    }
};