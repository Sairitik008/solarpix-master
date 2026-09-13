import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import {
  HomeScreen,
  CustomersScreen,
  OrdersScreen,
  DeliveriesScreen,
  SettingsScreen,
} from '../screens';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#FF9500',
        tabBarInactiveTintColor: '#6C6C7D',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarIcon: ({ color, focused }) => {
          let symbol = '☀️';
          if (route.name === 'HomeTab') symbol = '⚡';
          if (route.name === 'CustomersTab') symbol = '👥';
          if (route.name === 'OrdersTab') symbol = '📜';
          if (route.name === 'DeliveriesTab') symbol = '🚚';
          if (route.name === 'SettingsTab') symbol = '⚙️';

          return (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Text style={styles.iconText}>{symbol}</Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen
        name="CustomersTab"
        component={CustomersScreen}
        options={{ tabBarLabel: 'Customers' }}
      />
      <Tab.Screen name="OrdersTab" component={OrdersScreen} options={{ tabBarLabel: 'Orders' }} />
      <Tab.Screen
        name="DeliveriesTab"
        component={DeliveriesScreen}
        options={{ tabBarLabel: 'Deliveries' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#16161F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 149, 0, 0.15)',
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 28,
    borderRadius: 8,
  },
  iconActive: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
  },
  iconText: {
    fontSize: 16,
  },
});
