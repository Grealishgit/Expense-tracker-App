import { StyleSheet, View, TouchableOpacity, Text, Dimensions, Platform } from 'react-native'
import { useEffect, useState } from 'react';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';

// Only import if on Android and bare workflow
let SmsAndroid = null;
if (Platform.OS === 'android') {
    try {
        SmsAndroid = require('react-native-get-sms-android');
    } catch (e) {
        // Not available in Expo Go or if not installed
        SmsAndroid = null;
    }
}

const { height, width } = Dimensions.get('window');

const Mpesa = () => {
    const [contactData, setContactData] = useState([]);
    const [permissionsGranted, setPermissionsGranted] = useState(false);
    const [locationData, setLocationData] = useState(null);
    const [smsAvailable, setSmsAvailable] = useState(false);
    const [allSms, setAllSms] = useState([]);

    useEffect(() => {
        async function requestAllPermissions() {
            // Request for permission from the user
            const { status: contactStatus } = await Contacts.requestPermissionsAsync();
            const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

            // Checks if permissions are granted
            if (contactStatus === 'granted' && locationStatus === 'granted') {
                setPermissionsGranted(true);

                // If permissions are granted, get the contact names and phone numbers
                const contactResponse = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
                });
                setContactData(contactResponse.data);

                // Get the current location of the user (longitude and latitude)
                const location = await Location.getCurrentPositionAsync({});
                setLocationData(location);

                // Check if SMS is available on the device
                const isAvailable = await SMS.isAvailableAsync();
                setSmsAvailable(isAvailable);

                // If on Android and native module is available, get all SMS
                if (Platform.OS === 'android' && SmsAndroid) {
                    SmsAndroid.list(
                        JSON.stringify({ box: 'inbox', minDate: 1 }),
                        (fail) => {
                            console.log('Failed to get SMS:', fail);
                        },
                        (count, smsList) => {
                            const arr = JSON.parse(smsList);
                            setAllSms(arr);
                            console.log('All SMS:', arr);
                        }
                    );
                } else if (Platform.OS === 'android') {
                    console.log('SmsAndroid native module not available.');
                }
            } else {
                setPermissionsGranted(false);
            }
        }

        requestAllPermissions();
    }, []);

    // Checks if all permissions are granted
    const give_permissions = () => {
        if (permissionsGranted) {
            console.log('Permission Granted.');
            // console.log('Contacts:', contactData);
            console.log('Location:', locationData);
            console.log('SMS Available:', smsAvailable);
            if (allSms.length > 0) {
                console.log('All SMS:', allSms);
            } else {
                console.log('No SMS messages found or not available.');
            }
        } else {
            console.log('Not all permissions granted.');
        }
    };

    return (
        <View>
            <TouchableOpacity
                onPress={give_permissions}
                style={{
                    padding: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#eee',
                    margin: 20,
                    borderRadius: 8
                }}>
                <Text>Give Permission</Text>
            </TouchableOpacity>
        </View>
    )
}

export default Mpesa;