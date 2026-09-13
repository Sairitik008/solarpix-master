import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import {
  notificationService,
  googleAuthService,
  googleDriveService,
  googleCalendarService,
  GoogleUser,
} from '../services';
import { Button, Toast } from '../components';
import { APP_NAME, APP_VERSION } from '../utils';

export const SettingsScreen: React.FC = () => {
  const [user, setUser] = useState<GoogleUser | null>(googleAuthService.getCurrentUser());
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinMode, setPinMode] = useState<'backup' | 'restore'>('backup');
  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [toastState, setToastState] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ visible: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastState({ visible: true, message, type });
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const res = await googleAuthService.signIn();
    setLoading(false);
    if (res.success) {
      setUser(res.data);
      showToast(`Linked Google Account: ${res.data.email}`, 'success');
    } else {
      showToast(res.error.userFacingMessage, 'error');
    }
  };

  const handleGoogleSignOut = async () => {
    await googleAuthService.signOut();
    setUser(null);
    showToast('Unlinked Google Account.', 'info');
  };

  const handleExecuteBackupOrRestore = async () => {
    if (!pinInput || pinInput.length < 4) {
      showToast('Please enter your 4-6 digit security PIN.', 'error');
      return;
    }

    setLoading(true);
    if (pinMode === 'backup') {
      const res = await googleDriveService.createEncryptedBackup(pinInput);
      setLoading(false);
      if (res.success) {
        showToast('Encrypted backup successfully uploaded to Google Drive appdata!', 'success');
        setPinModalVisible(false);
        setPinInput('');
      } else {
        showToast(res.error.userFacingMessage, 'error');
      }
    } else {
      const res = await googleDriveService.restoreEncryptedBackup(pinInput);
      setLoading(false);
      if (res.success) {
        showToast(
          'Database successfully restored and decrypted from Google Drive backup!',
          'success'
        );
        setPinModalVisible(false);
        setPinInput('');
      } else {
        showToast(res.error.userFacingMessage, 'error');
      }
    }
  };

  const handleCalendarSyncTest = async () => {
    const res = await googleCalendarService.syncDeliveryToCalendar(
      'Solar Panel Array Delivery',
      new Date(Date.now() + 86400000).toISOString(),
      'Delivery due for Apex Solar Logistics.'
    );

    if (res.success) {
      showToast('Delivery deadline event synced to Google Calendar!', 'success');
    } else {
      showToast(res.error.userFacingMessage, 'error');
    }
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
        {/* Optional Google Account Linking Card */}
        <View style={styles.card}>
          <Text style={styles.cardBadge}>CLOUD ACCOUNTS (OPTIONAL)</Text>
          <Text style={styles.cardTitle}>Google Account Integration</Text>

          {user ? (
            <View style={styles.userBox}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Button
                title="Unlink Google Account"
                variant="secondary"
                onPress={handleGoogleSignOut}
                style={styles.accountBtn}
              />
            </View>
          ) : (
            <View>
              <Text style={styles.cardDesc}>
                Link your Google Account to enable encrypted Drive backups and Google Calendar
                deadline syncing. (App functions 100% offline without it).
              </Text>
              <Button
                title="🔗 Link Google Account"
                onPress={handleGoogleSignIn}
                loading={loading}
                style={styles.accountBtn}
              />
            </View>
          )}
        </View>

        {/* Encrypted Drive Backup & Restore */}
        <View style={styles.card}>
          <Text style={styles.cardBadge}>ENCRYPTED BACKUP & RESTORE</Text>
          <Text style={styles.cardTitle}>Google Drive AppData Storage</Text>
          <Text style={styles.cardDesc}>
            Backups are encrypted using your Security PIN via AES-256 and signed with HMAC-SHA256.
            Google never sees your raw database contents.
          </Text>

          <View style={styles.buttonGroup}>
            <Button
              title="☁️ Backup to Google Drive"
              onPress={() => {
                setPinMode('backup');
                setPinModalVisible(true);
              }}
              style={styles.actionBtn}
            />
            <Button
              title="🔄 Restore from Google Drive"
              variant="secondary"
              onPress={() => {
                setPinMode('restore');
                setPinModalVisible(true);
              }}
              style={styles.actionBtn}
            />
          </View>
        </View>

        {/* Google Calendar Sync */}
        <View style={styles.card}>
          <Text style={styles.cardBadge}>CALENDAR DEADLINES</Text>
          <Text style={styles.cardTitle}>Google Calendar Event Sync</Text>
          <Text style={styles.cardDesc}>
            Push upcoming equipment deliveries and bill payment deadlines to your primary Google
            Calendar.
          </Text>

          <Button
            title="📅 Test Sync Event to Google Calendar"
            variant="secondary"
            onPress={handleCalendarSyncTest}
            style={styles.actionBtn}
          />
        </View>

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

          <Button
            title="🔔 Test Push Notification Alert (3s delay)"
            variant="secondary"
            onPress={handleTestNotification}
            style={styles.testBtn}
          />
        </View>
      </ScrollView>

      {/* PIN Prompt Modal for Backup / Restore */}
      <Modal visible={pinModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalBadge}>SECURITY AUTHENTICATION</Text>
            <Text style={styles.modalTitle}>
              {pinMode === 'backup' ? 'Encrypt & Backup' : 'Decrypt & Restore'}
            </Text>
            <Text style={styles.modalDesc}>
              Enter your Security PIN to{' '}
              {pinMode === 'backup'
                ? 'derive the AES-256 encryption key and sign the backup payload.'
                : 'verify HMAC signature and decrypt backup.'}
            </Text>

            <Text style={styles.inputLabel}>Security PIN *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter PIN"
              placeholderTextColor="#555566"
              keyboardType="numeric"
              secureTextEntry
              value={pinInput}
              onChangeText={setPinInput}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setPinModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title={pinMode === 'backup' ? 'Encrypt & Backup' : 'Decrypt & Restore'}
                loading={loading}
                onPress={handleExecuteBackupOrRestore}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

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
    marginBottom: 10,
  },
  cardDesc: {
    color: '#A0A0B0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  userBox: {
    backgroundColor: '#12121A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    color: '#A0A0B0',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 10,
  },
  accountBtn: {
    marginTop: 4,
  },
  buttonGroup: {
    gap: 10,
  },
  actionBtn: {
    width: '100%',
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
    marginTop: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  modalBadge: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalDesc: {
    color: '#A0A0B0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputLabel: {
    color: '#A0A0B0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0D0D11',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
  },
});
