import express from 'express';
import { getTransactionsByUserId, createTransaction, deleteTransaction, getAllTransactions, getTransactionSummary } from '../controllers/transactionsController.js';

const router = express.Router();
router.post('/', createTransaction);

router.get('/transactions', getAllTransactions);

router.get('/:userId', getTransactionsByUserId);

router.delete('/:id', deleteTransaction);

router.get('/summary/:userId', getTransactionSummary);

export default router;