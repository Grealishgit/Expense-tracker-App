import { useRouter } from 'expo-router'
import { View, Text, TouchableOpacity } from 'react-native'
import { styles } from '../assets/styles/home.styles';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';


const EmptyTransactions = () => {
    const router = useRouter();
    return (
        <View style={styles.emptyState}>
            <Ionicons
                name='receipt-outline'
                size={50}
                color={COLORS.expense}
                style={styles.emptyStateIcon}
            />
            <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
            <Text style={styles.emptyStateText}>
                Start tracking your expenses and income by adding your first transaction.
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={() => router.push('/create')}>
                <Ionicons
                    name='add-circle-outline'
                    size={18}
                    color={COLORS.primary}
                    style={styles.addTransactionButton}
                    onPress={() => router.push('/create')}
                />
                <Text style={styles.emptyStateButtonText}>Add A Transaction</Text>
            </TouchableOpacity>
        </View>
    )
}

export default EmptyTransactions