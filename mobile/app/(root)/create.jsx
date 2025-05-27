import { View, Text, Alert, Touchable, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { API_URL } from '../../constants/api';
import { styles } from '../../assets/styles/create.styles';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const CATEGORIES = [
    { id: '1', name: 'Food', icon: 'fast-food-outline' },
    { id: '2', name: 'Transport', icon: 'car-outline' },
    { id: '3', name: 'Shopping', icon: 'cart-outline' },
    { id: '4', name: 'Bills', icon: 'receipt-outline' },
    { id: '5', name: 'Entertainment', icon: 'game-controller-outline' },
    { id: '6', name: 'Health', icon: 'heart-outline' },
    { id: '7', name: 'Salary', icon: 'cash-outline' },
    { id: '8', name: 'Other', icon: 'ellipsis-horizontal-circle-outline' }

];

const Create = () => {
    const router = useRouter();
    const { user } = useUser();

    const [title, setTitle] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [amount, setAmount] = useState('');
    const [isExpense, setIsExpense] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateTransaction = async () => {
        if (!title.trim()) return Alert.alert('Error', 'Please enter a title for the transaction.');
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            return Alert.alert('Error', 'Please enter a valid amount for the transaction.');
        }
        if (!selectedCategory) return Alert.alert('Error', 'Please select a category for the transaction.');
        setIsLoading(true);
        try {
            const formmattedAmount = isExpense
                ? -Math.abs(parseFloat(amount))
                : Math.abs(parseFloat(amount));
            const response = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    title,
                    amount: formmattedAmount,
                    category: selectedCategory, // Use the string directly
                }),



            });
            // console.log('Creating transaction with data:', {
            //     user_id: user.id,
            //     title,
            //     amount: formmattedAmount,
            //     category: selectedCategory.name,
            // })

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error creating transaction:', errorData);
                throw new Error(errorData.error || 'Failed to create transaction');
            }

            const data = await response.json();
            Alert.alert('Success', 'Transaction created successfully!');
            // Optionally, you can navigate to the transactions list or clear the form
            router.push('/'); // Uncomment if you want to navigate

        } catch (error) {
            console.error('Error creating transaction:', error);
            Alert.alert('Error', 'An error occurred while creating the transaction. Please try again later.');

        } finally {
            setIsLoading(false);
            // Reset form fields
            setTitle('');
            setSelectedCategory(null);
            setAmount('');

            router.push('/'); // Navigate back to the home screen after saving
        }


    }


    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create A Transaction</Text>
                <TouchableOpacity style={[styles.saveButtonContainer, isLoading && styles.saveButtonDisabled]}
                    onPress={handleCreateTransaction}
                    disabled={isLoading}
                >
                    <Text style={styles.saveButton}>{isLoading ? 'Saving...' : 'Save'}</Text>
                    {isLoading ? (
                        <Ionicons name="rocket-sharp" size={24} color={COLORS.white} />
                    ) : (
                        <Ionicons name="checkmark-done-circle-outline" size={24} color={COLORS.white} />
                    )}

                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <View style={styles.typeSelector}>
                    {/* EXPENSE SELECTOR */}
                    <TouchableOpacity
                        style={[styles.typeButton, isExpense && styles.typeButtonActive1]}
                        onPress={() => setIsExpense(true)}
                    >
                        <Ionicons name="arrow-down-circle" size={24} color={isExpense ? COLORS.white : COLORS.expense} style={styles.typeIcon} />
                        <Text style={[styles.typeButtonText, isExpense && styles.typeButtonTextActive]}>Expense</Text>
                    </TouchableOpacity>
                    {/* INCOME SELECTOR */}
                    <TouchableOpacity
                        style={[styles.typeButton, !isExpense && styles.typeButtonActive]}
                        onPress={() => setIsExpense(false)}
                    >
                        <Ionicons name="arrow-up-circle" size={24} color={!isExpense ? COLORS.white : COLORS.income} style={styles.typeIcon} />
                        <Text style={[styles.typeButtonText, !isExpense && styles.typeButtonTextActive]}>Income</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.amountContainer}>
                    <Text style={styles.currencySymbol}>Ksh</Text>
                    <TextInput
                        style={styles.amountInput}
                        placeholder="0.00"
                        placeholderTextColor={COLORS.textLight}
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />

                </View>
                <View style={styles.inputContainer}>
                    <Ionicons name="create-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Transaction Title"
                        placeholderTextColor={COLORS.textLight}
                        value={title}
                        onChangeText={setTitle}

                    />

                </View>
                <Text style={styles.sectionTitle}>
                    <Ionicons name="pricetag-outline" size={16} color={COLORS.text} />
                    Category
                </Text>
                <View style={styles.categoryGrid}>
                    {CATEGORIES.map((category) => (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.categoryButton,
                                selectedCategory === category.name && styles.categoryButtonActive
                            ]}
                            onPress={() => setSelectedCategory(category.name)}
                        >
                            <Ionicons name={category.icon} size={20} color={selectedCategory === category.name ? COLORS.white : COLORS.text} />
                            <Text style={[
                                styles.categoryButtonText,
                                selectedCategory === category.name && styles.categoryButtonTextActive
                            ]}>
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    ))}

                </View>
            </View>
            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            )

            }
        </View>
    )
}

export default Create