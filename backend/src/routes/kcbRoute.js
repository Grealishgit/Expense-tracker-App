import express from 'express';
import { createKcbTransaction } from '../controllers/kcbTransactions.js';

const kcbRouter = express.Router();

kcbRouter.post('/create', createKcbTransaction);
// kcbRouter.get('/getKcbTransactions/:userId',);

export default kcbRouter;