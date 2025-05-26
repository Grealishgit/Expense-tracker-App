import { neon } from '@neondatabase/serverless';

import "dotenv/config";

export const sql = neon(process.env.DATABASE_URL)

export async function connectToDatabase() {

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


// console.log("Database URL:", process.env.DATABASE_URL);

// // Debug: Query all transactions at startup
// (async () => {
//     try {
//         const result = await sql`SELECT * FROM transactions`;
//         console.log('Startup DB check - transactions:', result);
//     } catch (err) {
//         console.error('Startup DB check error:', err);
//     }
// })();



