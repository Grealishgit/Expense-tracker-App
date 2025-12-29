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
        maxCount: 1000,
    };

    return new Promise((resolve, reject) => {
        SmsAndroid.list(
            JSON.stringify(filter),
            (fail: any) => reject(fail),
            (count: number, smsList: string) => resolve(JSON.parse(smsList))
        );
    });
};

export interface MpesaTransaction {
    id: string;
    type: "income" | "expense";
    title: string;
    party: string;
    amount: number;
    date: string;
    time: string;
    newBalance: number | null;
    transactionCost: number;
    rawDate: Date;
}

export function parseMpesaMessage(body: string): MpesaTransaction | null {
    // Extract transaction ID
    const idMatch = body.match(/^([A-Z0-9]+)\s/);
    const transactionId = idMatch?.[1] || `TX-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    // console.log('Parsing message:', body.substring(0, 50) + '...');
    // console.log('Extracted ID:', transactionId);

    // Extract amount
    const amountMatch = body.match(/Ksh\s?([\d,]+\.\d{2})/i);
    const amount = amountMatch
        ? parseFloat(amountMatch[1].replace(/,/g, ""))
        : null;

    if (!amount) return null;

    // Extract date and time
    const dateTimeMatch = body.match(/on (\d{2}\/\d{2}\/\d{2}) at (\d{1,2}:\d{2} [AP]M)/i);
    const date = dateTimeMatch?.[1] ?? "";
    const time = dateTimeMatch?.[2] ?? "";

    // Parse date for sorting (convert DD/MM/YY to proper date)
    let rawDate = new Date();
    if (dateTimeMatch) {
        const [day, month, year] = date.split('/');
        const fullYear = `20${year}`;
        const [timeStr, period] = time.split(' ');
        const [hours, minutes] = timeStr.split(':');
        let hour = parseInt(hours);

        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;

        rawDate = new Date(`${fullYear}-${month}-${day}T${hour.toString().padStart(2, '0')}:${minutes}:00`);
    }

    // Extract new balance
    const balanceMatch = body.match(/New M-PESA balance is Ksh\s?([\d,]+\.\d{2})/i);
    const newBalance = balanceMatch
        ? parseFloat(balanceMatch[1].replace(/,/g, ""))
        : null;

    // Extract transaction cost
    const costMatch = body.match(/Transaction cost,?\s*Ksh\s?([\d,]+\.\d{2})/i);
    const transactionCost = costMatch
        ? parseFloat(costMatch[1].replace(/,/g, ""))
        : 0;

    // Determine transaction type and party

    // Check for received/incoming money
    const receivedMatch = body.match(/You have received|received Ksh/i);
    if (receivedMatch) {
        const fromMatch = body.match(/from ([A-Za-z0-9\s]+?)(?:\s+\d{10}|\s+on)/i);
        const party = fromMatch?.[1]?.trim() ?? "Unknown";

        return {
            id: transactionId,
            type: "income",
            title: "Incoming Payment",
            party,
            amount,
            date,
            time,
            newBalance,
            transactionCost,
            rawDate,
        };
    }

    // Check for sent money (person to person)
    const sentMatch = body.match(/sent to ([A-Za-z0-9\s]+?)(?:\s+\d{10}|\s+on)/i);
    if (sentMatch) {
        const party = sentMatch[1].trim();

        return {
            id: transactionId,
            type: "expense",
            title: "Outgoing Payment",
            party,
            amount,
            date,
            time,
            newBalance,
            transactionCost,
            rawDate,
        };
    }

    // Check for paid to (business/till/paybill)
    const paidMatch = body.match(/paid to ([A-Za-z0-9\s]+?)(?:\.|on)/i);
    if (paidMatch) {
        const party = paidMatch[1].trim();

        return {
            id: transactionId,
            type: "expense",
            title: "Outgoing Payment",
            party,
            amount,
            date,
            time,
            newBalance,
            transactionCost,
            rawDate,
        };
    }

    // Check for withdrawn from agent
    const withdrawMatch = body.match(/withdrawn from|Withdraw from ([A-Za-z0-9\s]+)/i);
    if (withdrawMatch) {
        const agentMatch = body.match(/from ([A-Za-z0-9\s]+?)(?:\s+on|\s+-)/i);
        const party = agentMatch?.[1]?.trim() ?? "M-Pesa Agent";

        return {
            id: transactionId,
            type: "expense",
            title: "Cash Withdrawal",
            party,
            amount,
            date,
            time,
            newBalance,
            transactionCost,
            rawDate,
        };
    }

    // Check for bought airtime
    const airtimeMatch = body.match(/bought.*airtime|airtime for/i);
    if (airtimeMatch) {
        const numberMatch = body.match(/for (\d{10})/);
        const party = numberMatch?.[1] ?? "Self";

        return {
            id: transactionId,
            type: "expense",
            title: "Airtime Purchase",
            party,
            amount,
            date,
            time,
            newBalance,
            transactionCost,
            rawDate,
        };
    }

    return null;
}

// Helper function to format transactions for display
export function formatTransaction(transaction: MpesaTransaction) {
    return {
        ...transaction,
        formattedAmount: `Ksh ${transaction.amount.toLocaleString()}`,
        formattedBalance: transaction.newBalance
            ? `Ksh ${transaction.newBalance.toLocaleString()}`
            : null,
        formattedCost: transaction.transactionCost > 0
            ? `Ksh ${transaction.transactionCost.toLocaleString()}`
            : "Free",
        displayType: transaction.type === "income" ? "Received" : "Sent",
    };
}

// Example usage:
// const messages = [
//   "TLTKD2CAN4 Confirmed. Ksh10.00 paid to BRIAN MAHERO. on 29/12/25 at 2:59 PM.New M-PESA balance is Ksh0.00. Transaction cost, Ksh0.00.",
//   "TLTKD2C8VP Confirmed. Ksh100.00 sent to Justine arege 0114218371 on 29/12/25 at 2:37 PM. New M-PESA balance is Ksh0.00. Transaction cost, Ksh0.00.",
//   "TLP3V28BZJ Confirmed.You have received Ksh2,030.00 from BENSON KHANDA 0715248638 on 25/12/25 at 5:22 PM New M-PESA balance is Ksh2,032.47."
// ];
//
// const parsed = messages.map(parseMpesaMessage).filter(Boolean);
// console.log(parsed);

// format date to 12th January, 2023
export function formatDate(date: Date) {
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long', timeZone: 'Africa/Nairobi' });
    const year = date.getFullYear();
    return `${day}th ${month}, ${year}`;
}

export interface KCBTransaction {
    id: string;
    type: "income" | "expense";
    title: string;
    party: string;
    amount: number;
    date: string;
    time: string;
    reference: string | null;
    rawDate: Date;
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

export function parseKCBMessage(body: string): KCBTransaction | null {
    // Extract transaction reference
    const refMatch = body.match(/(?:M-PESA Ref|Ref\.?)\s*([A-Z0-9]+)/i) ||
        body.match(/^([A-Z0-9]{10,})/); // For references at the start
    const reference = refMatch?.[1] ?? null;
    const transactionId = reference ?? `KCB-${Date.now()}`;

    // Extract amount - handle both Ksh and KES formats
    const amountMatch = body.match(/(?:Ksh|KES)\s?([\d,]+\.\d{2})/i);
    const amount = amountMatch
        ? parseFloat(amountMatch[1].replace(/,/g, ""))
        : null;

    if (!amount) return null;

    // Extract date and time
    let date = "";
    let time = "";
    let rawDate = new Date();

    // Format 1: "on 27/12/2025 at 07:21 PM"
    const dateTimeMatch1 = body.match(/on (\d{2}\/\d{2}\/\d{4}) at (\d{2}:\d{2} [AP]M)/i);
    if (dateTimeMatch1) {
        date = dateTimeMatch1[1];
        time = dateTimeMatch1[2];

        const [day, month, year] = date.split('/');
        const [timeStr, period] = time.split(' ');
        const [hours, minutes] = timeStr.split(':');
        let hour = parseInt(hours);

        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;

        rawDate = new Date(`${year}-${month}-${day}T${hour.toString().padStart(2, '0')}:${minutes}:00`);
    }

    // Format 2: "at 2025-11-10 08:15:41 PM"
    const dateTimeMatch2 = body.match(/at (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([AP]M)/i);
    if (dateTimeMatch2) {
        const isoDate = dateTimeMatch2[1];
        const isoTime = dateTimeMatch2[2];
        const period = dateTimeMatch2[3];

        const [year, month, day] = isoDate.split('-');
        const [hours, minutes, seconds] = isoTime.split(':');
        let hour = parseInt(hours);

        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;

        date = `${day}/${month}/${year}`;
        time = `${hour > 12 ? hour - 12 : hour}:${minutes} ${period}`;
        rawDate = new Date(`${year}-${month}-${day}T${hour.toString().padStart(2, '0')}:${minutes}:${seconds}`);
    }

    // Determine transaction type and party

    // Check for "sent to" (outgoing to KCB account)
    const sentToMatch = body.match(/sent to KCB account ([A-Za-z0-9\s]+?)(?:\s+\d{7}|\s+has)/i);
    if (sentToMatch) {
        const accountMatch = body.match(/KCB account ([A-Za-z0-9\s]+?)\s+(\d{7})/i);
        const party = accountMatch
            ? `${accountMatch[1].trim()} (${accountMatch[2]})`
            : sentToMatch[1].trim();

        return {
            id: transactionId,
            type: "expense",
            title: "Sent to KCB Account",
            party,
            amount,
            date,
            time,
            reference,
            rawDate,
        };
    }

    // Check for "received from" (incoming from person or account)
    const receivedMatch = body.match(/(?:You have received|received)/i);
    if (receivedMatch) {
        // Format: "from EUGENE MUKOYA KHANDA - 134****909"
        const fromMatch = body.match(/from ([A-Za-z\s]+?)\s*-\s*(\d{3}\*+\d{3})/i);
        if (fromMatch) {
            const party = `${fromMatch[1].trim()} (${fromMatch[2]})`;

            return {
                id: transactionId,
                type: "income",
                title: "Received from KCB",
                party,
                amount,
                date,
                time,
                reference,
                rawDate,
            };
        }

        // Generic "from" pattern
        const genericFromMatch = body.match(/from ([A-Za-z0-9\s]+?)(?:\s+at|\s+on|via|\.|$)/i);
        const party = genericFromMatch?.[1]?.trim() ?? "Unknown";

        return {
            id: transactionId,
            type: "income",
            title: "Received from KCB",
            party,
            amount,
            date,
            time,
            reference,
            rawDate,
        };
    }

    // Check for debited (outgoing)
    const debitMatch = body.match(/debited/i);
    if (debitMatch) {
        const toMatch = body.match(/to ([A-Za-z0-9\s]+?)(?:\s+at|\s+on|via|\.|$)/i);
        const party = toMatch?.[1]?.trim() ?? "Unknown";

        return {
            id: transactionId,
            type: "expense",
            title: "Debited from Account",
            party,
            amount,
            date,
            time,
            reference,
            rawDate,
        };
    }

    // Check for credited (incoming)
    const creditMatch = body.match(/credited/i);
    if (creditMatch) {
        const fromMatch = body.match(/from ([A-Za-z0-9\s]+?)(?:\s+at|\s+on|via|\.|$)/i);
        const party = fromMatch?.[1]?.trim() ?? "Unknown";

        return {
            id: transactionId,
            type: "income",
            title: "Credited to Account",
            party,
            amount,
            date,
            time,
            reference,
            rawDate,
        };
    }

    return null;
}

// Helper function to format transactions for display
export function formatKCBTransaction(transaction: KCBTransaction) {
    return {
        ...transaction,
        formattedAmount: `KES ${transaction.amount.toLocaleString()}`,
        displayType: transaction.type === "income" ? "Received" : "Sent",
        referenceDisplay: transaction.reference
            ? `Ref: ${transaction.reference}`
            : null,
    };
}


export interface LoopTransaction {
    id: string;
    type: "income" | "expense";
    title: string;
    party: string;
    amount: number;
    date: string;
    time: string;
    loopRef: string | null;
    mpesaRef: string | null;
    fee: number;
    rawDate: Date;
}

export const fetchLoopMessages = async () => {
    const filter = {
        box: "inbox",
        address: "LOOP",
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

export function parseLoopMessage(body: string): LoopTransaction | null {
    // Extract LOOP reference
    const loopRefMatch = body.match(/LOOP Ref\s*([A-Z0-9]+)/i);
    const loopRef = loopRefMatch?.[1] ?? null;

    // Extract M-Pesa reference
    const mpesaRefMatch = body.match(/M-?Pesa Ref[,:\s]*([A-Z0-9]+)/i);
    const mpesaRef = mpesaRefMatch?.[1] ?? null;

    const transactionId = loopRef ?? mpesaRef ?? `LOOP-${Date.now()}`;

    // Extract amount - handle both Ksh and KES formats
    const amountMatch = body.match(/(?:Ksh|KES)[.\s]?([\d,]+\.\d{2})/i);
    const amount = amountMatch
        ? parseFloat(amountMatch[1].replace(/,/g, ""))
        : null;

    if (!amount) return null;

    // Extract fee
    const feeMatch = body.match(/Fee[:\s]*(?:charged is )?(?:Ksh|KES)[.\s]?([\d,]+\.\d{2})/i);
    const fee = feeMatch
        ? parseFloat(feeMatch[1].replace(/,/g, ""))
        : 0;

    // Extract date and time
    let date = "";
    let time = "";
    let rawDate = new Date();

    // Format: "on 01/09/2025 00:52:55" or "on 03/08/2025 09:48:52"
    const dateTimeMatch = body.match(/on (\d{2}\/\d{2}\/\d{4}) (\d{2}:\d{2}:\d{2})/i);
    if (dateTimeMatch) {
        const dateStr = dateTimeMatch[1];
        const timeStr = dateTimeMatch[2];

        const [day, month, year] = dateStr.split('/');
        const [hours, minutes, seconds] = timeStr.split(':');
        const hour = parseInt(hours);

        // Convert to 12-hour format with AM/PM
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);

        date = dateStr;
        time = `${hour12}:${minutes} ${period}`;
        rawDate = new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
    }

    // Determine transaction type and party

    // Check for "credited" (incoming - received money)
    const creditedMatch = body.match(/credited your Payment account/i);
    if (creditedMatch) {
        // Extract phone number from "via M-Pesa from 254742636835"
        const fromPhoneMatch = body.match(/from (\d{12})/i);
        let party = "Unknown";

        if (fromPhoneMatch) {
            const phone = fromPhoneMatch[1];
            // Format phone number: 254742636835 -> 0742636835
            party = phone.startsWith('254') ? `0${phone.slice(3)}` : phone;
        }

        return {
            id: transactionId,
            type: "income",
            title: "Received via LOOP",
            party,
            amount,
            date,
            time,
            loopRef,
            mpesaRef,
            fee,
            rawDate,
        };
    }

    // Check for "sent" (outgoing - sent money)
    const sentMatch = body.match(/successfully sent/i);
    if (sentMatch) {
        // Extract recipient: "to 0717145963 - ROWLINGS KHANDA BARASA"
        const toMatch = body.match(/to (\d{10})\s*-\s*([A-Za-z\s]+?)(?:\.|Fee|LOOP)/i);
        let party = "Unknown";

        if (toMatch) {
            const phone = toMatch[1];
            const name = toMatch[2].trim();
            party = `${name} (${phone})`;
        } else {
            // Fallback: just extract phone number
            const phoneMatch = body.match(/to (\d{10})/i);
            party = phoneMatch?.[1] ?? "Unknown";
        }

        return {
            id: transactionId,
            type: "expense",
            title: "Sent via LOOP",
            party,
            amount,
            date,
            time,
            loopRef,
            mpesaRef,
            fee,
            rawDate,
        };
    }

    // Fallback: Check for generic debited/credited
    const debitMatch = body.match(/debited/i);
    if (debitMatch) {
        const toMatch = body.match(/to ([A-Za-z0-9\s]+?)(?:\.|Fee|LOOP|on)/i);
        const party = toMatch?.[1]?.trim() ?? "Unknown";

        return {
            id: transactionId,
            type: "expense",
            title: "Sent via LOOP",
            party,
            amount,
            date,
            time,
            loopRef,
            mpesaRef,
            fee,
            rawDate,
        };
    }

    const creditMatch = body.match(/credited/i);
    if (creditMatch) {
        const fromMatch = body.match(/from ([A-Za-z0-9\s]+?)(?:\.|Fee|LOOP|on)/i);
        const party = fromMatch?.[1]?.trim() ?? "Unknown";

        return {
            id: transactionId,
            type: "income",
            title: "Received via LOOP",
            party,
            amount,
            date,
            time,
            loopRef,
            mpesaRef,
            fee,
            rawDate,
        };
    }

    return null;
}

// Helper function to format transactions for display
export function formatLoopTransaction(transaction: LoopTransaction) {
    return {
        ...transaction,
        formattedAmount: `KES ${transaction.amount.toLocaleString()}`,
        formattedFee: transaction.fee > 0
            ? `KES ${transaction.fee.toLocaleString()}`
            : "Free",
        displayType: transaction.type === "income" ? "Received" : "Sent",
        references: {
            loop: transaction.loopRef ? `LOOP: ${transaction.loopRef}` : null,
            mpesa: transaction.mpesaRef ? `M-Pesa: ${transaction.mpesaRef}` : null,
        },
    };
}

// Example usage:
// const messages = [
//   "You have successfully credited your Payment account with KES 50.00 via M-Pesa from 254742636835 on 01/09/2025 00:52:55. Fee charged is KES.0.00. LOOP Ref NHLRTM2W4GEZ,M-Pesa Ref TI18U1UPKW.",
//   "You have successfully sent KES 50.00 to 0717145963 - ROWLINGS KHANDA BARASA. Fee:KES.0.00. LOOP Ref NHL9UMLH7PW3, M-Pesa Ref, TH30ORS9I4 on 03/08/2025 09:48:52."
// ];
//
// const parsed = messages.map(parseLoopMessage).filter(Boolean);
// console.log(parsed);

