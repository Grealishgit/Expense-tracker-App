// services/mpesa.ts
import { PermissionsAndroid, Linking, Alert } from "react-native";

export async function requestSmsPermission() {
    console.log('Checking SMS permissions...');
    const hasRead = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    const hasReceive = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);

    console.log('Has READ_SMS:', hasRead, 'Has RECEIVE_SMS:', hasReceive);

    if (hasRead && hasReceive) {
        console.log('Both permissions already granted.');
        return true;
    }

    console.log('Requesting SMS permissions...');
    const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
    ]);

    console.log('Permission request result:', granted);

    const readGranted = granted['android.permission.READ_SMS'] === PermissionsAndroid.RESULTS.GRANTED;
    const receiveGranted = granted['android.permission.RECEIVE_SMS'] === PermissionsAndroid.RESULTS.GRANTED;

    // Check if permissions were permanently denied
    const readDenied = granted['android.permission.READ_SMS'] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
    const receiveDenied = granted['android.permission.RECEIVE_SMS'] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;

    if (readDenied || receiveDenied) {
        Alert.alert(
            "Permission Required",
            "SMS permissions were previously denied. Please enable them in app settings to import M-Pesa transactions.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Open Settings",
                    onPress: () => Linking.openSettings()
                }
            ]
        );
        return false;
    }

    const result = readGranted && receiveGranted;
    console.log('Final permission result:', result);
    return result;
}