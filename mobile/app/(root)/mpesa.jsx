import React, { useState } from "react";
import { View, Text, Button, Alert, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import {
  requestSmsPermission,
  fetchMpesaMessages,
  parseMpesaMessage,
} from "../services/mpesa"
// import { saveTransaction } from "../db/transactions"; 
import { COLORS } from '../../constants/colors'

export default function MpesaPage() {
  const [transactions, setTransactions] = useState([]);

  const handleImport = async () => {
    const allowed = await requestSmsPermission();
    if (!allowed) {
      return Alert.alert(
        "Permission Denied",
        "SMS permission is required."
      );
    }

    console.log('Fetching M-Pesa messages...');

    const sms = await fetchMpesaMessages();

    const parsedTransactions = sms
      .map(msg => parseMpesaMessage(msg.body))
      .filter(Boolean);

    setTransactions(parsedTransactions);

    // for (const tx of transactions) {
    //   await saveTransaction({
    //     category: tx.type === "income" ? "Income" : "Expense",
    //     amount: tx.amount,
    //     source: tx.party,
    //     method: "M-Pesa",
    //   });
    // }

    Alert.alert("Success", `Imported ${parsedTransactions.length} transactions`);
    console.log('Imported Transactions:', parsedTransactions);
  };

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>M-Pesa Import</Text>

      <TouchableOpacity onPress={handleImport} style={styles.button}>
        <Text style={styles.buttonText}>Import Transactions</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 16 }}>
        <Text style={{ fontWeight: "600" }}>Imported Transactions</Text>

        <FlatList
          data={transactions}
          keyExtractor={item => item.id?.toString() ?? Math.random().toString()}
          renderItem={({ item }) => (
            <View
              style={{
                padding: 10,
                marginTop: 8,
                borderWidth: 1,
                borderRadius: 8,
              }}
            >
              <Text>Type: {item.type}</Text>
              <Text>Party: {item.party}</Text>
              <Text>Amount: Ksh {item.amount}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ marginTop: 8, opacity: 0.6 }}>
              No transactions imported yet
            </Text>
          }
        />
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "white",
  },
  button: {
    marginTop: 16,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary
  },
  buttonText: {
    color: "white",
    fontWeight: 'bold',
    fontSize: 24
  }
})