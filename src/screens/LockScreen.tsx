import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { pinAuthService } from '../services';
import { Button, Toast } from '../components';

export interface LockScreenProps {
  onUnlockSuccess: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlockSuccess }) => {
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

  const handleKeyPress = (num: string) => {
    if (pinInput.length < 6) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);
      if (nextPin.length >= 4) {
        // Auto verify when 4+ digits entered
        verifyEnteredPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  const verifyEnteredPin = async (candidatePin: string) => {
    setLoading(true);
    const res = await pinAuthService.verifyPin(candidatePin);
    setLoading(false);

    if (res.success) {
      onUnlockSuccess();
    } else {
      showToast(res.error.userFacingMessage, 'error');
      setPinInput('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D11" />

      <View style={styles.header}>
        <Text style={styles.badge}>APP ENCRYPTED LOCK</Text>
        <Text style={styles.title}>SolarPix Vault</Text>
        <Text style={styles.subtitle}>Enter your security PIN to unlock application records.</Text>
      </View>

      {/* PIN Dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3, 4, 5].map((idx) => (
          <View key={idx} style={[styles.dot, idx < pinInput.length && styles.dotFilled]} />
        ))}
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
          <TouchableOpacity
            key={key}
            style={styles.keyButton}
            onPress={() => {
              if (key === '⌫') handleDelete();
              else if (key === 'C') setPinInput('');
              else handleKeyPress(key);
            }}
          >
            <Text style={styles.keyText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          title="Unlock Vault"
          loading={loading}
          disabled={pinInput.length < 4}
          onPress={() => verifyEnteredPin(pinInput)}
          style={styles.unlockBtn}
        />
      </View>

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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
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
    textAlign: 'center',
  },
  subtitle: {
    color: '#A0A0B0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 24,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 149, 0, 0.4)',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    maxWidth: 320,
    alignSelf: 'center',
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1A1A22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  footer: {
    marginBottom: 10,
  },
  unlockBtn: {
    width: '100%',
  },
});
