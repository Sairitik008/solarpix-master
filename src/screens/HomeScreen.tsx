import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { customerService, orderService, deliveryService, transactionService } from '../services';
import { MainTabParamList } from '../types';
import { Button } from '../components';

type HomeScreenTabProp = BottomTabNavigationProp<MainTabParamList, 'HomeTab'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenTabProp>();

  const [stats, setStats] = useState({
    customerCount: 0,
    activeOrdersCount: 0,
    totalLedgerCredit: 0,
    scheduledDeliveriesCount: 0,
  });

  const loadDashboardStats = useCallback(async () => {
    const custRes = await customerService.getAllCustomers();
    const custs = custRes.success ? custRes.data : [];

    let totalOrders = 0;
    let totalDeliveries = 0;
    let totalBalance = 0;

    for (const c of custs) {
      const oRes = await orderService.getOrdersByCustomer(c.id);
      if (oRes.success && oRes.data) {
        totalOrders += oRes.data.filter((o) => o.status !== 'CANCELLED').length;
      }
      const bRes = await transactionService.getCustomerBalance(c.id);
      if (bRes.success) {
        totalBalance += bRes.data;
      }
    }

    setStats({
      customerCount: custs.length,
      activeOrdersCount: totalOrders,
      totalLedgerCredit: totalBalance,
      scheduledDeliveriesCount: totalDeliveries,
    });
  }, []);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D11" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.badge}>SOLARPIX DASHBOARD</Text>
        <Text style={styles.title}>Solar Energy Operations</Text>
        <Text style={styles.subtitle}>
          Local-first encrypted ledger & business management system.
        </Text>
      </View>

      {/* Overview Stat Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statNumber}>{stats.customerCount}</Text>
          <Text style={styles.statLabel}>Total Customers</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📜</Text>
          <Text style={styles.statNumber}>{stats.activeOrdersCount}</Text>
          <Text style={styles.statLabel}>Active Orders</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>💰</Text>
          <Text
            style={[
              styles.statNumber,
              stats.totalLedgerCredit >= 0 ? styles.creditColor : styles.debitColor,
            ]}
          >
            ${Math.abs(stats.totalLedgerCredit).toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Net Ledger Balance</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🚚</Text>
          <Text style={styles.statNumber}>{stats.scheduledDeliveriesCount}</Text>
          <Text style={styles.statLabel}>Deliveries Due</Text>
        </View>
      </View>

      {/* Quick Action Navigation Buttons */}
      <View style={styles.actionCard}>
        <Text style={styles.actionCardBadge}>QUICK ACTIONS</Text>
        <Text style={styles.actionCardTitle}>Operations Shortcuts</Text>

        <View style={styles.actionButtons}>
          <Button
            title="👥 Manage Customers"
            onPress={() => navigation.navigate('CustomersTab')}
            style={styles.actionBtn}
          />
          <Button
            title="📜 Orders & Bill Book"
            variant="secondary"
            onPress={() => navigation.navigate('OrdersTab')}
            style={styles.actionBtn}
          />
          <Button
            title="🚚 Logistics Schedule"
            variant="secondary"
            onPress={() => navigation.navigate('DeliveriesTab')}
            style={styles.actionBtn}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D11',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 36,
  },
  header: {
    marginBottom: 20,
  },
  badge: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#A0A0B0',
    fontSize: 14,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 14,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: '#A0A0B0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  creditColor: {
    color: '#4CAF50',
  },
  debitColor: {
    color: '#FF5252',
  },
  actionCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  actionCardBadge: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  actionCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionButtons: {
    gap: 10,
  },
  actionBtn: {
    width: '100%',
  },
});
