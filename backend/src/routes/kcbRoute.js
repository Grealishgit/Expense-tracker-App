import express from 'express';
import { createKcbTransaction, bulkCreateKcbTransactions } from '../controllers/kcbTransactions.js';

const kcbRouter = express.Router();

kcbRouter.post('/create', createKcbTransaction);
kcbRouter.post('/create-bulk', bulkCreateKcbTransactions);

// kcbRouter.get('/getKcbTransactions/:userId',);

export default kcbRouter;