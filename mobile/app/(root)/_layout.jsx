import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { Stack } from "expo-router/stack";

export default function Layout() {
    const { isSignedIn } = useUser();

    if (!isSignedIn) return <Redirect href={'/sign-in'} />;

    return (
        <Tabs>
            <Tabs.Screen name='index'
                options={{
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) =>
                        <Ionicons name='home' color={color} size={size}
                        />
                }} />
            <Tabs.Screen name='create'
                options={{
                    title: 'Create',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) =>
                        <Ionicons name='add' color={color} size={size}
                        />
                }} />
            <Tabs.Screen name='mpesa'
                options={{
                    title: 'MPESA',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) =>
                        <Ionicons name='person-circle' color={color} size={size}
                        />
                }} />
            <Tabs.Screen name='profile'
                options={{
                    title: 'Profile',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) =>
                        <Ionicons name='person' color={color} size={size}
                        />
                }} />
        </Tabs>
    )

}