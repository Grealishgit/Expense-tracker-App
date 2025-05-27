import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import PageLoader from '../../components/PageLoader'

export default function AuthRoutesLayout() {
    const { isSignedIn, isLoaded } = useAuth()
    if (!isLoaded) return null;
    // if (!isLoaded) return <PageLoader /> // or a loading component

    if (isSignedIn) {
        return <Redirect href={'/'} />
    }

    return <Stack screenOptions={{ headerShown: false }} />
}