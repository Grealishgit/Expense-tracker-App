// services/mpesa.ts
import SmsAndroid from "react-native-get-sms-android";
import { PermissionsAndroid, Linking, Alert } from "react-native";

export async function requestSmsPermission() {
    // console.log('Checking SMS permissions...');
    const hasRead = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    const hasReceive = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);

    // console.log('Has READ_SMS:', hasRead, 'Has RECEIVE_SMS:', hasReceive);

    if (hasRead && hasReceive) {
        console.log('Both permissions already granted.');
        return true;
    }

    console.log('Requesting SMS permissions...');
    const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
    ]);

    // console.log('Permission request result:', granted);

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
    // console.log('Final permission result:', result);
    return result;
}

export const fetchMpesaMessages = async () => {
    const filter = {
        box: "inbox",
        address: "MPESA",
        maxCount: 200,
    };

    return new Promise((resolve, reject) => {
        SmsAndroid.list(
            JSON.stringify(filter),
            (fail: any) => reject(fail),
            (count: number, smsList: string) => resolve(JSON.parse(smsList))
        );
    });
};

export function parseMpesaMessage(body: string) {
    const amountMatch = body.match(/Ksh\s?([\d,]+\.\d{2})/i);
    const sentMatch = body.match(/sent to ([A-Za-z0-9\s]+)/i);
    const receivedMatch = body.match(/received Ksh/i);
    const fromMatch = body.match(/from ([A-Za-z0-9\s]+)/i);
    // const toMatch = body.match(/to ([A-Za-z0-9\s]+)/i);
    // const overallBalanceMatch = body.match(/New M-PESA balance is Ksh\s?([\d,]+\.\d{2})/i);

    const amount = amountMatch
        ? parseFloat(amountMatch[1].replace(/,/g, ""))
        : null;

    if (receivedMatch) {
        return { type: "income", party: fromMatch?.[1] ?? "Unknown", amount };
    }

    if (sentMatch) {
        return { type: "expense", party: sentMatch?.[1] ?? "Unknown", amount };
    }
    if (fromMatch) {
        return { type: "expense", party: fromMatch?.[1] ?? "Unknown", amount };
    }
    // if (overallBalanceMatch) {
    //     return { type: "balance", amount: parseFloat(overallBalanceMatch[1].replace(/,/g, "")) };
    // }


    return null;
}

export const fetchKCBMessages = async () => {
    const filter = {
        box: "inbox",
        address: "KCB",
        maxCount: 200,
    };

    return new Promise((resolve, reject) => {
        SmsAndroid.list(
            JSON.stringify(filter),
            (fail: any) => reject(fail),
            (count: number, smsList: string) => resolve(JSON.parse(smsList))
        );
    });
};

export function parseKCBMessage(body: string) {
    const amountMatch = body.match(/Ksh\s?([\d,]+\.\d{2})/i);
    const debitMatch = body.match(/debited/i);
    const creditMatch = body.match(/credited/i);
    const fromMatch = body.match(/from ([A-Za-z0-9\s]+)/i);
    const toMatch = body.match(/to ([A-Za-z0-9\s]+)/i);
    const amount = amountMatch
        ? parseFloat(amountMatch[1].replace(/,/g, ""))
        : null;
    if (debitMatch) {
        return { type: "expense", party: toMatch?.[1] ?? "Unknown", amount };
    }

    if (creditMatch) {
        return { type: "income", party: fromMatch?.[1] ?? "Unknown", amount };
    }
    return null;
}


