// services/mpesa.ts
import SmsAndroid from "react-native-get-sms-android";
import { PermissionsAndroid } from "react-native";

export async function requestSmsPermission() {
    const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
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

    const amount = amountMatch
        ? parseFloat(amountMatch[1].replace(/,/g, ""))
        : null;

    if (receivedMatch) {
        return { type: "income", party: fromMatch?.[1] ?? "Unknown", amount };
    }

    if (sentMatch) {
        return { type: "expense", party: sentMatch?.[1] ?? "Unknown", amount };
    }

    return null;
}
