import React, { use, useEffect, useState } from "react";
import { View, Text, Button, Alert, FlatList, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  requestSmsPermission,
  fetchMpesaMessages,
  parseMpesaMessage,
  formatDate,
} from "../../services/mpesa"
import { COLORS } from '../../constants/colors'
import mpesa from '../../assets/mpesa.jpg';
import loop from '../../assets/loop.png';
import kcb from '../../assets/kcb.png';
import MpesaTransactions from "../../components/mpesaTransactions";


export default function MpesaPage() {

  const [kcbTransactions, setKcbTransactions] = useState([]);
  const [loopTransactions, setLoopTransactions] = useState([]);
  const [activeProvider, setActiveProvider] = useState('mpesa');
  const [isLoading, setIsLoading] = useState(false);

  const handleProviderSelect = (provider) => {
    setActiveProvider(provider.id);
  };



  const handleImportKCBTransactions = async () => {
    setIsLoading(true);
    const allowed = await requestSmsPermission();

    if (!allowed) {
      setIsLoading(false);
      return Alert.alert(
        "Permission Denied",
        "SMS permission is required to import KCB transactions."
      );
    }

    try {
      console.log('Fetching KCB messages...');
      const sms = await fetchKCBMessages();

      const parsedTransactions = sms
        .map(msg => parseKCBMessage(msg.body))
        .filter(Boolean)
        .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()); // Sort by date, newest first

      setKcbTransactions(parsedTransactions);

      Alert.alert(
        "Success",
        `Successfully imported ${parsedTransactions.length} KCB transaction${parsedTransactions.length !== 1 ? 's' : ''}`
      );
      console.log('Imported KCB transactions:', parsedTransactions);
    } catch (error) {
      Alert.alert("Error", "Failed to import KCB transactions. Please try again.");
      console.error('KCB import error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const providers = [
    { id: 'mpesa', name: 'M-Pesa', image: mpesa },
    { id: 'kcb', name: 'KCB', image: kcb },
    { id: 'loop', name: 'Loop', image: loop }
  ];




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
              onPress={() => handleProviderSelect(provider)}
              style={styles.providerCard}>
              <Image
                source={provider.image}
                style={[styles.providerImage, activeProvider === provider.id && styles.providerImageActive]}
                resizeMode="cover"
              />
              <Text style={[styles.providerName, activeProvider === provider.id && styles.providerNameActive]}>
                {provider.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeProvider === 'mpesa' && (
        <MpesaTransactions />
      )}



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

});