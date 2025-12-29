declare module "react-native-get-sms-android" {
    interface SmsFilter {
        box?: string;
        address?: string;
        maxCount?: number;
    }

    export default class SmsAndroid {
        static list(
            filter: string,
            failCallback: (error: any) => void,
            successCallback: (count: number, smsList: string) => void
        ): void;
    }
}