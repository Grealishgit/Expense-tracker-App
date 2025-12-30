import express from 'express';
import {
    createMpesaTransaction,
    bulkCreateMpesaTransactions,
    getMpesaTransactions,
    getMpesaSummary,
    deleteMpesaTransaction
} from '../controllers/mpesaTransactions.js';

const mpesaRouter = express.Router();

mpesaRouter.post('/create', createMpesaTransaction);
mpesaRouter.post('/create-bulk', bulkCreateMpesaTransactions);
mpesaRouter.get('/transactions/:user_id', getMpesaTransactions);
mpesaRouter.get('/summary/:user_id', getMpesaSummary);
mpesaRouter.delete('/transactions/:transaction_id', deleteMpesaTransaction);

export default mpesaRouter;