import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import PageLoader from '../../components/PageLoader'
import { View } from 'react-native';

export default function AuthRoutesLayout() {
    const { isSignedIn, isLoaded } = useAuth()
    if (!isLoaded) return null;
    if (!isLoaded) return (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#3d84f5'
        }}>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Expense Tracker</Text>
        </View>
    ) // or a loading component

    if (isSignedIn) {
        return <Redirect href={'/'} />
    }

    return <Stack screenOptions={{ headerShown: false }} />
}