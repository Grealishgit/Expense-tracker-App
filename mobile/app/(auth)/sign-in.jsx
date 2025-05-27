import { useSignIn } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native'
import revenue from '../../assets/images/revenue-i4.png'
import { styles } from '@/assets/styles/auth.styles.js'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../constants/colors.js'

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useState } from 'react'

export default function Page() {
    const { signIn, setActive, isLoaded } = useSignIn()
    const router = useRouter()

    const [emailAddress, setEmailAddress] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState("")

    // Handle the submission of the sign-in form
    const onSignInPress = async () => {
        if (!isLoaded) return

        // Start the sign-in process using the email and password provided
        try {
            const signInAttempt = await signIn.create({
                identifier: emailAddress,
                password,
            })

            // If sign-in process is complete, set the created session as active
            // and redirect the user
            if (signInAttempt.status === 'complete') {
                await setActive({ session: signInAttempt.createdSessionId })
                router.replace('/')
            } else {
                // If the status isn't complete, check why. User might need to
                // complete further steps.
                console.error(JSON.stringify(signInAttempt, null, 2))
            }
        } catch (err) {
            // See https://clerk.com/docs/custom-flows/error-handling
            // for more info on error handling
            if (err.errors?.[0].code === "form_password_incorrect") {
                setError("Incorrect email or password. Please try again.")
            } else {
                setError("An error occurred during sign-in. Please try again later.")
            }
            // console.error(JSON.stringify(err, null, 2))
        }
    }

    return (
        <KeyboardAwareScrollView
            style={{ flex: 1, backgroundColor: COLORS.background, padding: 15 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            extraScrollHeight={100}
            enableOnAndroid={true}
            enableAutomaticScroll={true}
        >
            <View styles={styles.container} >
                <Image source={revenue} style={styles.illustration} />
                <View style={{ borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, padding: 12 }}>
                    <Text style={styles.title} >Welcome Back</Text>
                    {error ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity onPress={() => setError("")}>
                                <Ionicons name="close" size={20} color={COLORS.textLight} />
                            </TouchableOpacity>
                        </View>
                    ) : null}
                    <TextInput
                        autoCapitalize="none"
                        value={emailAddress}
                        placeholder="Enter email"
                        placeholderTextColor="#9a8478"
                        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
                        style={[styles.input, error && styles.errorInput]}
                    />
                    <TextInput
                        value={password}
                        placeholder="Enter password"
                        placeholderTextColor="#9a8478"
                        secureTextEntry={true}
                        onChangeText={(password) => setPassword(password)}
                        style={[styles.input, error && styles.errorInput]}
                    />
                    <TouchableOpacity onPress={onSignInPress} style={styles.button}>
                        <Text style={styles.buttonText} >Sign In</Text>
                    </TouchableOpacity>
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText} >Don't have an account?</Text>
                        <View style={{ display: 'flex', flexDirection: 'row', gap: 3 }}>
                            <TouchableOpacity onPress={() => router.push('/sign-up')}>
                                <Text style={styles.linkText} >Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </KeyboardAwareScrollView>
    )
}