import { useUser } from "@clerk/clerk-expo";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, Tabs } from "expo-router";
import { Stack } from "expo-router/stack";

import { COLORS } from "../../constants/colors";

export default function Layout() {
    const { isSignedIn } = useUser();

    if (!isSignedIn) return <Redirect href={'/sign-in'} />;

    return (
        <Tabs
            initialRouteName="index"
            screenOptions={{
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.secondary,
                tabBarShowLabel: true,
                tabBarStyle: {
                    backgroundColor: COLORS.card,
                    borderRadius: 30,
                    overflow: 'hidden',
                    height: 65,
                    marginBottom: 10,
                    marginHorizontal: 15,
                    position: 'absolute',
                },
                tabBarItemStyle: {
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingVertical: 5,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: 'bold'
                },
                tabBarActiveBackgroundColor: {
                    borderRadius: 25,
                    backgroundColor: COLORS.primary
                }
            }}


        >
            <Tabs.Screen name='index'
                options={{
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) =>
                        <MaterialIcons name='currency-exchange' color={color} size={size}
                        />
                }} />
            <Tabs.Screen name='mpesa'
                options={{
                    title: 'MPESA',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) =>
                        <Ionicons name='wallet' color={color} size={size}
                        />
                }} />
            <Tabs.Screen name='create'
                options={{
                    title: 'Create',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) =>
                        <FontAwesome6 name='circle-plus' color={color} size={size}
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