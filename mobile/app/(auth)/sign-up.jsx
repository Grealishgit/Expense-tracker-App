import * as React from 'react'
import { Text, Image, TextInput, TouchableOpacity, View } from 'react-native'
import { useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import { styles } from '@/assets/styles/auth.styles.js'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../constants/colors.js'
import revenue from '../../assets/images/revenue-i2.png'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp()
    const router = useRouter()

    const [emailAddress, setEmailAddress] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassord] = useState(false)
    const [pendingVerification, setPendingVerification] = useState(false)
    const [code, setCode] = useState('');
    const [error, setError] = useState(null)

    // Handle submission of sign-up form
    const onSignUpPress = async () => {
        if (!isLoaded) return

        // Start sign-up process using email and password provided
        try {
            await signUp.create({
                emailAddress,
                password,
            })

            // Send user an email with verification code
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

            // Set 'pendingVerification' to true to display second form
            // and capture OTP code
            setPendingVerification(true)
        } catch (err) {
            // See https://clerk.com/docs/custom-flows/error-handling
            // for more info on error handling

            if (err.errors?.[0].code === "form_identifier_exists") {
                setError("This email address is already in use. Please try signing in instead.")
            } else if (err.errors?.[0].code === "form_password_length_too_short") {
                setError("Password must be at least 8 characters long.")
            } else {
                setError("An error occurred during sign-up. Please try again later.")
            }
            // console.error(JSON.stringify(err, null, 2))
        }
    }

    // Handle submission of verification form
    const onVerifyPress = async () => {
        if (!isLoaded) return

        try {
            // Use the code the user provided to attempt verification
            const signUpAttempt = await signUp.attemptEmailAddressVerification({
                code,
            })

            // If verification was completed, set the session to active
            // and redirect the user
            if (signUpAttempt.status === 'complete') {
                await setActive({ session: signUpAttempt.createdSessionId })
                router.replace('/')
            } else {
                // If the status is not complete, check why. User may need to
                // complete further steps.
                console.error(JSON.stringify(signUpAttempt, null, 2))
            }
        } catch (err) {
            // See https://clerk.com/docs/custom-flows/error-handling
            // for more info on error handling
            console.error(JSON.stringify(err, null, 2))
        }
    }

    if (pendingVerification) {
        return (
            <View style={styles.verificationContainer} >
                <Text style={styles.verificationTitle}>Verify your email</Text>

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
                    value={code}
                    placeholder="Enter your verification code"
                    placeholderTextColor="#9a8478"
                    onChangeText={(code) => setCode(code)}
                    style={[styles.verificationInput, error && styles.errorInput]}
                />
                <TouchableOpacity onPress={onVerifyPress} style={[styles.button, { width: '100%' }]}>
                    <Text style={styles.buttonText} >Verify</Text>
                </TouchableOpacity>
            </View>
        )
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
                <View style={{ borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, padding: 10 }}>
                    <Text style={styles.title} >Create An Account</Text>


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
                        onChangeText={(email) => setEmailAddress(email)}
                        style={[styles.input, error && styles.errorInput]}
                    />

                    <View style={{ position: 'relative' }}>
                        <TextInput
                            value={password}
                            placeholder="Enter password"
                            placeholderTextColor="#9a8478"
                            secureTextEntry={showPassword ? true : false}
                            onChangeText={(password) => setPassword(password)}
                            style={[styles.input, error && styles.errorInput]}
                        />
                        <TouchableOpacity style={{ position: 'absolute', top: 14, right: 8 }} onPress={() => setShowPassord(!showPassword)}>
                            {showPassword ? (
                                <Ionicons name='eye-off' size={20} color={COLORS.primary} />
                            ) : (
                                <Ionicons name='eye' size={20} color={COLORS.primary} />
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={onSignUpPress} style={styles.button}>
                        <Text style={styles.buttonText} >Sign Up</Text>
                    </TouchableOpacity>
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText} >Already have an account?</Text>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={styles.linkText} >Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAwareScrollView>
    )
}