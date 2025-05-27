import { ClerkProvider } from '@clerk/clerk-expo'
import { Slot } from 'expo-router'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import SafeScreen from '@/components/SafeScreen'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <SafeScreen>
        <Slot />
        {/* <StatusBar style='auto' /> */}
      </SafeScreen>
    </ClerkProvider>
  )


}
