import React, { useState } from 'react'

import { View, Text, Button, Alert, FlatList, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
    requestSmsPermission,
    formatDate,
    fetchLoopMessages,
    parseLoopMessage,
} from "../services/mpesa"

import { COLORS } from '../constants/colors';
const LoopTransactions = () => {
    const [loopTransactions, setLoopTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleImportLoopTransactions = async () => {
        setIsLoading(true);
        const allowed = await requestSmsPermission();

        if (!allowed) {
            setIsLoading(false);
            return Alert.alert(
                "Permission Denied",
                "SMS permission is required to import LOOP transactions."
            );
        }

        try {
            // console.log('Fetching LOOP messages...');
            const sms = await fetchLoopMessages();

            const parsedTransactions = sms
                .map(msg => parseLoopMessage(msg.body))
                .filter(Boolean)
                .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()); // Sort by date, newest first

            setLoopTransactions(parsedTransactions);

            // Alert.alert(
            //     "Success",
            //     `Successfully imported ${parsedTransactions.length} LOOP transaction${parsedTransactions.length !== 1 ? 's' : ''}`
            // );
            // console.log('Imported LOOP transactions:', parsedTransactions);
        } catch (error) {
            Alert.alert("Error", "Failed to import LOOP transactions. Please try again.");
            console.error('LOOP import error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const totalIncome = loopTransactions.reduce((total, transaction) => {
        return transaction.type === 'income' ? total + transaction.amount : total;
    }, 0);

    const totalExpenses = loopTransactions.reduce((total, transaction) => {
        return transaction.type === 'expense' ? total + transaction.amount : total;
    }, 0);

    const totalBalance = totalIncome + totalExpenses;

    return (
        <View style={styles.mainContainer}>
            {/* Import Action */}
            <View style={styles.section}>
                <TouchableOpacity
                    onPress={handleImportLoopTransactions}
                    style={[styles.importButton, isLoading && styles.importButtonDisabled]}
                    disabled={isLoading}
                >
                    <Text style={styles.importButtonText}>
                        {isLoading ? (
                            <Text>
                                ⏳ Importing...
                            </Text>
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8 }}>
                                <MaterialIcons name="import-export" size={24} color="white" />
                                <Text style={styles.importButtonText}> Import Transactions</Text>
                            </View>
                        )}
                    </Text>
                </TouchableOpacity>
            </View>



            {/* Statcard for expenses and income */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Summary</Text>

                {/* Total Balance Card */}
                <View style={styles.totalBalanceCard}>
                    <Text style={styles.balanceLabel}>Total Transactions</Text>
                    <Text style={styles.balanceAmount}>
                        Ksh {totalBalance.toLocaleString()}
                    </Text>
                </View>

                {/* Income and Expense Cards Row */}
                <View style={styles.summaryRow}>
                    <View style={[styles.summaryCard, { backgroundColor: '#2fc56e' }]}>
                        <View style={styles.summaryHeader}>
                            <Text style={styles.summaryLabel}>Total Income</Text>
                            <Text style={styles.summaryIcon}>💰</Text>
                        </View>

                        <Text style={styles.incomeAmount}>
                            Ksh {totalIncome.toLocaleString()}
                        </Text>
                    </View>

                    <View style={[styles.summaryCard, { backgroundColor: '#fe5f00' }]}>
                        <View style={styles.summaryHeader}>
                            <Text style={styles.summaryLabel}>Total Expenses</Text>
                            <Text style={styles.summaryIcon}>💸</Text>
                        </View>
                        <Text style={styles.expenseAmount}>
                            Ksh {totalExpenses.toLocaleString()}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Transactions List */}
            <View style={styles.transactionsContainer}>
                <View style={styles.transactionsHeader}>
                    <Text style={styles.sectionTitle}>Transactions</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{loopTransactions.length}</Text>
                    </View>
                </View>

                {loopTransactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateIcon}>📊</Text>
                        <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
                        <Text style={styles.emptyStateText}>
                            Import transactions to see them here
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={loopTransactions}
                        scrollEnabled={true}
                        keyExtractor={(item, index) => {
                            const key = item.id?.toString() || `fallback-${index}-${Date.now()}`;
                            // console.log('Transaction key:', key, 'for item:', item.title);
                            return key;
                        }}
                        renderItem={({ item }) => (
                            <View style={[
                                styles.transactionCard,
                                item.type === "income" ? styles.transactionIncome : styles.transactionExpense
                            ]}>
                                <View style={styles.transactionHeader}>
                                    <View style={styles.transactionType}>
                                        <Text style={styles.transactionTypeIcon}>
                                            {item.type === "income" ? '💰' : '💸'}
                                        </Text>
                                        <Text style={[
                                            styles.transactionTypeText,
                                            item.type === "income" ? styles.incomeText : styles.expenseText
                                        ]}>
                                            {item.title}
                                        </Text>
                                    </View>
                                    <Text style={[
                                        styles.transactionAmount,
                                        item.type === "income" ? styles.incomeText : styles.expenseText
                                    ]}>
                                        {item.type === "income" ? '+' : '-'} Ksh {item.amount.toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.transactionDetails}>
                                    <Text style={styles.transactionParty}>
                                        {item.type === "income" ? 'From' : 'To'}: {item.party}
                                    </Text>
                                    <View style={styles.transactionMeta}>
                                        {item.transactionCost > 0 && (
                                            <Text style={styles.transactionCost}>
                                                Fee: Ksh {item.transactionCost.toLocaleString()}
                                            </Text>
                                        )}

                                        <Text style={styles.transactionMetaText}>
                                            {formatDate(item.rawDate)} |  {item.rawDate.toLocaleTimeString()}
                                        </Text>

                                    </View>
                                </View>
                            </View>
                        )}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                )}
            </View>
        </View>
    )
}

export default LoopTransactions

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: "#f8f9fa",
        marginTop: 4
    },
    importButton: {
        backgroundColor: '#fe5f00',
        borderRadius: 8,
        width: '100%',
        padding: 15,
        alignItems: "center",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    importButtonDisabled: {
        opacity: 0.6,
    },
    importButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
    transactionsHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    badge: {
        backgroundColor: "#fe5f00",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    badgeText: {
        color: "white",
        fontSize: 14,
        fontWeight: "700",
    },
    emptyState: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 40,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e9ecef",
        borderStyle: "dashed",
    },
    emptyStateIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#212529",
        marginBottom: 4,
    },
    emptyStateText: {
        fontSize: 14,
        color: "#6c757d",
        textAlign: "center",
    },
    transactionCard: {
        backgroundColor: "white",
        borderRadius: 8,
        padding: 16,
        borderLeftWidth: 3,
        borderRightWidth: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    transactionIncome: {
        borderLeftColor: "#2fc56e",
        borderRightColor: 'transparent',
    },
    transactionExpense: {
        borderRightColor: "#dc3545",
        borderLeftColor: 'transparent',
    },
    transactionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    transactionType: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    transactionTypeIcon: {
        fontSize: 20,
    },
    transactionTypeText: {
        fontSize: 14,
        fontWeight: "600",
    },
    incomeText: {
        color: "#2fc56e",
    },
    expenseText: {
        color: "#dc3545",
    },
    transactionAmount: {
        fontSize: 18,
        fontWeight: "700",
    },
    transactionDetails: {
        marginTop: 4,
    },
    transactionParty: {
        fontSize: 14,
        color: "#6c757d",
    },
    transactionMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    transactionMetaText: {
        fontSize: 12,
        color: '#6c757d',
    },
    transactionCost: {
        fontSize: 11,
        color: '#dc3545',
        fontStyle: 'italic',
    },
    separator: {
        height: 12,
    },
    transactionsContainer: {
        flex: 1,
        marginTop: 16,
        paddingHorizontal: 20,
    },
    section: {
        marginTop: 8,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 5,
    },
    totalBalanceCard: {
        backgroundColor: '#fe5f00',
        borderRadius: 5,
        padding: 8,
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    balanceLabel: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: 'white',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 0.2,
    },
    summaryHeader: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    summaryIcon: {
        fontSize: 28,
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#ffffff',
        marginBottom: 8,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    incomeAmount: {
        fontSize: 25,
        fontWeight: '700',
        color: '#ffffff',
    },
    expenseAmount: {
        fontSize: 25,
        fontWeight: '700',
        color: '#ffffff',
    },
})