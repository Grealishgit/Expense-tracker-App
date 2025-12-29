import React, { useState } from "react";
import { View, Text, Button, Alert, FlatList, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  requestSmsPermission,
  fetchMpesaMessages,
  parseMpesaMessage,
} from "../../services/mpesa"
import { COLORS } from '../../constants/colors'
import mpesa from '../../assets/mpesa.jpg';
import loop from '../../assets/loop.png';
import kcb from '../../assets/kcb.png';


export default function MpesaPage() {
  const [transactions, setTransactions] = useState([]);
  const [activeProvider, setActiveProvider] = useState('mpesa');
  const [isLoading, setIsLoading] = useState(false);

  const handleProviderSelect = (provider) => {
    setActiveProvider(provider);
    Alert.alert(
      `${provider} Selected`,
      `You've selected ${provider} transactions. This will filter transactions from this provider.`
    );
  };

  const handleImport = async () => {
    setIsLoading(true);
    const allowed = await requestSmsPermission();

    if (!allowed) {
      setIsLoading(false);
      return Alert.alert(
        "Permission Denied",
        "SMS permission is required to import transactions."
      );
    }

    try {
      console.log('Fetching M-Pesa messages...');
      const sms = await fetchMpesaMessages();

      const parsedTransactions = sms
        .map(msg => parseMpesaMessage(msg.body))
        .filter(Boolean);

      setTransactions(parsedTransactions);

      Alert.alert(
        "Success",
        `Successfully imported ${parsedTransactions.length} transaction${parsedTransactions.length !== 1 ? 's' : ''}`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to import transactions. Please try again.");
      console.error('Import error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const providers = [
    { id: 'mpesa', name: 'M-Pesa', image: mpesa },
    { id: 'kcb', name: 'KCB', image: kcb },
    { id: 'loop', name: 'Loop', image: loop }
  ];


  const totalIncome = transactions.reduce((total, transaction) => {
    return transaction.type === 'income' ? total + transaction.amount : total;
  }, 0);

  const totalExpenses = transactions.reduce((total, transaction) => {
    return transaction.type === 'expense' ? total + transaction.amount : total;
  }, 0);

  const totalBalance = totalIncome + totalExpenses;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SIM Transactions</Text>
        <Text style={styles.headerSubtitle}>Import and manage your transactions</Text>
      </View>

      {/* Provider Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Provider</Text>
        <View style={styles.providerGrid}>
          {providers.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              onPress={() => handleProviderSelect(provider.name)}
              style={styles.providerCard}>
              <Image
                source={provider.image}
                style={[styles.providerImage, activeProvider === provider.name && styles.providerImageActive]}
                resizeMode="cover"
              />
              <Text style={[styles.providerName, activeProvider === provider.name && styles.providerNameActive]}>
                {provider.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Import Action */}
      <View style={styles.section}>
        <TouchableOpacity
          onPress={handleImport}
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
          <View style={[styles.summaryCard, { borderWidth: 1, borderColor: 'green' }]}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Total Income</Text>
              <Text style={styles.summaryIcon}>💰</Text>
            </View>

            <Text style={styles.incomeAmount}>
              Ksh {totalIncome.toLocaleString()}
            </Text>
          </View>

          <View style={[styles.summaryCard, { borderWidth: 1, borderColor: 'red' }]}>
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
            <Text style={styles.badgeText}>{transactions.length}</Text>
          </View>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📊</Text>
            <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
            <Text style={styles.emptyStateText}>
              Import transactions to see them here
            </Text>
          </View>
        ) : (
            <FlatList
              data={transactions}
              scrollEnabled={true}
              keyExtractor={item => item.id?.toString() ?? Math.random().toString()}
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
                        {item.type === "income" ? 'Received' : 'Sent'}
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
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        )}
      </View>



    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 12,
    paddingTop: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6c757d",
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 12,
  },
  providerGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  providerCard: {
    flex: 1,
    position: "relative",
    borderRadius: 8,
    width: '100%',
    height: 70,
    alignItems: "center",
  },

  providerImage: {
    width: '100%',
    height: '100%',
    marginBottom: 4,
    borderRadius: 8,
    opacity: 0.2,
  },
  providerImageActive: {
    opacity: 1,
  },
  providerName: {
    position: "absolute",
    bottom: 22,
    left: 8,
    right: 8,
    textAlign: "center",
    color: COLORS.black,
    fontSize: 18,
    fontWeight: "bold",
  },

  providerNameActive: {
    display: "none",
  },
  importButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
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
    backgroundColor: COLORS.primary,
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
    borderLeftColor: "#28a745",
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
    color: "#28a745",
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
    backgroundColor: COLORS.primary,
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
    elevation: 0.5,
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
    color: '#6c757d',
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  incomeAmount: {
    fontSize: 25,
    fontWeight: '700',
    color: '#28a745',
  },
  expenseAmount: {
    fontSize: 25,
    fontWeight: '700',
    color: '#dc3545',
  },
});