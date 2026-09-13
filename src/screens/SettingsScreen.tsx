import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { notificationService } from '../services';
import { Button, Toast } from '../components';
import { APP_NAME, APP_VERSION } from '../utils';

export const SettingsScreen: React.FC = () => {
  const [toastState, setToastState] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ visible: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastState({ visible: true, message, type });
  };

  const handleTestNotification = async () => {
    const res = await notificationService.schedulePaymentReminder('Solar Test Client', 450.0, 3);
    if (res.success) {
      showToast('Test notification scheduled! Alert will trigger in 3 seconds.', 'info');
    } else {
      showToast(res.error.userFacingMessage, 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D11" />

      <View style={styles.header}>
        <Text style={styles.badge}>SOLARPIX SYSTEM</Text>
        <Text style={styles.title}>App & System Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Security & Encryption Info */}
        <View style={styles.card}>
          <Text style={styles.cardBadge}>DATABASE SECURITY</Text>
          <Text style={styles.cardTitle}>Encrypted Storage Engine</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Database Driver:</Text>
            <Text style={styles.infoValue}>@op-engineering/op-sqlite</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Encryption Standard:</Text>
            <Text style={styles.infoValueSuccess}>SQLCipher AES-256</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Key Storage Vault:</Text>
            <Text style={styles.infoValue}>expo-secure-store (Hardware-backed)</Text>
          </View>
        </View>

        {/* System Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardBadge}>SYSTEM METADATA</Text>
          <Text style={styles.cardTitle}>{APP_NAME} Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Application Version:</Text>
            <Text style={styles.infoValue}>v{APP_VERSION}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Runtime Engine:</Text>
            <Text style={styles.infoValue}>Expo SDK 57 (React Native 0.86)</Text>
          </View>
        </View>

        {/* Test Notification Trigger */}
        <View style={styles.card}>
          <Text style={styles.cardBadge}>NOTIFICATION DIAGNOSTICS</Text>
          <Text style={styles.cardTitle}>Push Reminder Trigger</Text>
          <Text style={styles.cardDesc}>
            Test local push alerts for unpaid customer balances and delivery schedules.
          </Text>

          <Button
            title="🔔 Test Push Notification Alert (3s delay)"
            onPress={handleTestNotification}
            style={styles.testBtn}
          />
        </View>
      </ScrollView>

      <Toast
        visible={toastState.visible}
        message={toastState.message}
        type={toastState.type}
        onDismiss={() => setToastState((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D11',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  badge: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#1A1A22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardBadge: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  cardDesc: {
    color: '#A0A0B0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  infoLabel: {
    color: '#A0A0B0',
    fontSize: 13,
    fontWeight: '600',
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  infoValueSuccess: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '800',
  },
  testBtn: {
    marginTop: 4,
  },
});
