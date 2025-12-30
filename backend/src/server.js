import express from 'express';
import dotenv from 'dotenv';
import { connectToDatabase } from './config/db.js';
import rateLimiter from './middleware/rateLimiter.js';
import transactionsRoute from './routes/transactionsRoute.js';
import job from './config/cron.js';
import kcbRouter from './routes/kcbRoute.js';
import loopRouter from './routes/loopRoute.js';

dotenv.config();

const app = express();


// if (process.env.NODE_ENV === "production")
// Start the cron job
job.start();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(rateLimiter);

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('Get request received');
});


app.use("/api/transactions", transactionsRoute);

app.use("/api/kcb", kcbRouter);

app.use('/api/loop', loopRouter)

connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
})
