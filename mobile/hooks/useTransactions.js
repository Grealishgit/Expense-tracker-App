import { useState } from "react";
import { useCallback } from "react";
import { Alert } from "react-native";

//react custom hook file for fetching transactions
export const useTranactions = (userId) => {
    const [transactions, setTransactions] = useState([]);

    const API_URL = 'https://expense-tracker-app-1owp.onrender.com/api'; // Replace with your API URL

    const [summary, setSummary] = useState({
        balance: 0,
        income: 0,
        expenses: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const fetchTransactions = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/transactions/${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }
            const data = await response.json();
            setTransactions(data);

        } catch (error) {
            console.error('Error fetching transactions:', error);

        };
    }, [userId]);
    const fetchSummary = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/transactions/summary/${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch summary');
            }
            const data = await response.json();
            setSummary(data);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    }, [userId]);
    const loadData = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            await Promise.all([fetchTransactions(), fetchSummary()]);
        } catch (error) {
            console.error('Error loading data:', error);

        } finally {
            setIsLoading(false);
        }
    }, [fetchTransactions, fetchSummary, userId]);

    const deleteTransaction = useCallback(async (id) => {
        try {
            const response = await fetch(`${API_URL}/transactions/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete transaction');
            }
            loadData(); // Refresh data after deletion
            // setTransactions((prev) => prev.filter((t) => t.id !== id));
            Alert.alert("Success", 'Transaction deleted successfully');
        } catch (error) {
            console.error('Error deleting transaction:', error);
            Alert.alert("Error", 'Failed to delete transaction');
        }
    });
    return {
        transactions,
        summary,
        isLoading,
        loadData,
        deleteTransaction,
    };
}



