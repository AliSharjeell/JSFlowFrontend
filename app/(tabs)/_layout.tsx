import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { StyleSheet, View } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarLabelStyle: styles.tabLabel,
                tabBarItemStyle: styles.tabItem,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconWrap : undefined}>
                            <Ionicons
                                name={focused ? 'home' : 'home-outline'}
                                size={22}
                                color={color}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="assistant"
                options={{
                    title: 'AI Assistant',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconWrap : undefined}>
                            <Ionicons
                                name={focused ? 'sparkles' : 'sparkles-outline'}
                                size={22}
                                color={color}
                            />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: Colors.white,
        borderTopWidth: 0,
        height: 70,
        paddingBottom: 10,
        paddingTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'visible' as const,
    },
    tabLabel: {
        fontFamily: Fonts.medium,
        fontSize: 11,
        marginTop: 2,
    },
    tabItem: {
        gap: 2,
        overflow: 'visible' as const,
    },
    activeIconWrap: {
        backgroundColor: '#EBF3FF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 3,
        overflow: 'visible' as const,
    },
});
