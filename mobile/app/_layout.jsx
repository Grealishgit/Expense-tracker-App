import { ClerkProvider } from '@clerk/clerk-expo'
import { Slot } from 'expo-router'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import SafeScreen from '@/components/SafeScreen'
import { StatusBar } from 'expo-status-bar'
import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}
      publishableKey="pk_test_dmFsdWVkLWdlY2tvLTkxLmNsZXJrLmFjY291bnRzLmRldiQ">
      <SafeScreen>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name='(auth)' />
          <Stack.Screen name='(root)' options={{ headerShown: false }} />
        </Stack>
      </SafeScreen>
    </ClerkProvider>
  )


}
