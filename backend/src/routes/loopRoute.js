import express from 'express';
import {
    createLoopTransaction,
    bulkCreateLoopTransactions,
    getUserLoopTransactions,
    getTransactionSummary,
} from '../controllers/loopTransactions.js';

const loopRouter = express.Router();

loopRouter.post('/create', createLoopTransaction);
loopRouter.post('/create-bulk', bulkCreateLoopTransactions);
// loopRouter.get('/getLoopTransactions/:userId',);

export default loopRouter;