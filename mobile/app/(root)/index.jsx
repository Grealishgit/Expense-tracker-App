import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { Alert, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import { SignOutButton } from '@/components/SignOutButton'
import { useTransactions } from '../../hooks/useTransactions';
import { use, useState } from 'react';
import { useEffect } from 'react';
import PageLoader from '../../components/PageLoader';
import { styles } from "../../assets/styles/home.styles";
import logo from '../../assets/images/logo.png';
import { Ionicons } from '@expo/vector-icons';
import BalanceCard from '../../components/BalanceCard';
import TransactionItem from '../../components/TransactionItem';
import EmptyTransactions from '../../components/EmptyTransactions';

export default function Page() {
    const { user } = useUser();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const { transactions, summary, isLoading, loadData, deleteTransaction } = useTransactions(user?.id)

    useEffect(() => {
        loadData();
    }, [loadData]);
    // console.log('user', user.id);
    // console.log('data loaded', transactions);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await loadData();
            // Refresh the data
        }
        catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setRefreshing(false);
        }
    }

    if (isLoading && !refreshing) return <PageLoader />
    const handleDelete = (id) => {
        Alert.alert(
            "Delete Transaction",
            "Are you sure you want to delete this transaction?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) }
            ]
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    {/* LEFT */}
                    <View style={styles.headerLeft}>
                        <Image source={logo} style={styles.headerLogo} resizeMode='contain' />

                        <View style={styles.welcomeContainer}>
                            <Text style={styles.welcomeText}>Welcome back 👋</Text>
                            <Text style={styles.usernameText}>{user?.emailAddresses[0]?.emailAddress.split("@")[0]} </Text>
                        </View>
                    </View>


                    {/* RIGHT */}
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/create')}>
                            <Ionicons name="add" size={20} color="white" />
                            <Text style={styles.addButtonText}>Add</Text>
                        </TouchableOpacity>
                        {/* <SignOutButton /> */}
                        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
                            <Ionicons name="person-circle-outline" size={25} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
                <BalanceCard summary={summary} />

                <View style={styles.transactionsHeaderContainer}>
                    <Text style={styles.sectionTitle}>SIM Transactions</Text>
                    <TouchableOpacity style={styles.viewButton} onPress={() => router.push('/mpesa')}>
                        <Ionicons name="list-outline" size={20} color="white" />
                        <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <FlatList
                style={styles.transactionsList}
                showsVerticalScrollIndicator={false}
                data={transactions}
                contentContainerStyle={styles.transactionsListContent}
                renderItem={({ item }) => (
                    <TransactionItem item={item} onDelete={handleDelete} />)}
                ListEmptyComponent={EmptyTransactions}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}

            />
        </View>
    )
}