import express from 'express';
import dotenv from 'dotenv';
import { connectToDatabase } from './config/db.js';
import rateLimiter from './middleware/rateLimiter.js';
import transactionsRoute from './routes/transactionsRoute.js';

dotenv.config();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(rateLimiter);

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('Get request received');
});

app.use("/api/transactions", transactionsRoute);

connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
})
