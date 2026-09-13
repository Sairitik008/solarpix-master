import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { pinAuthService } from '../services';
import { Button, Toast } from '../components';

export interface PinSetupScreenProps {
  onSetupComplete: () => void;
}

export const PinSetupScreen: React.FC<PinSetupScreenProps> = ({ onSetupComplete }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
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
    if (step === 'create') {
      if (pin.length < 6) setPin((prev) => prev + num);
    } else {
      if (confirmPin.length < 6) setConfirmPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    if (step === 'create') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const handleNextStep = () => {
    if (pin.length < 4) {
      showToast('PIN must be at least 4 digits.', 'error');
      return;
    }
    setStep('confirm');
  };

  const handleCompleteSetup = async () => {
    if (confirmPin !== pin) {
      showToast('PINs do not match. Please try again.', 'error');
      setConfirmPin('');
      return;
    }

    setLoading(true);
    const res = await pinAuthService.setupPin(pin);
    setLoading(false);

    if (res.success) {
      showToast('Security PIN established successfully!', 'success');
      setTimeout(() => {
        onSetupComplete();
      }, 500);
    } else {
      showToast(res.error.userFacingMessage, 'error');
    }
  };

  const currentVal = step === 'create' ? pin : confirmPin;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D11" />

      <View style={styles.header}>
        <Text style={styles.badge}>SECURITY SETUP</Text>
        <Text style={styles.title}>
          {step === 'create' ? 'Create Security PIN' : 'Confirm Security PIN'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'create'
            ? 'Set a 4 to 6 digit security PIN to protect your local database and backup files.'
            : 'Re-enter your PIN to verify.'}
        </Text>
      </View>

      {/* PIN Dots View */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3, 4, 5].map((idx) => (
          <View key={idx} style={[styles.dot, idx < currentVal.length && styles.dotFilled]} />
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
              else if (key === 'C') {
                if (step === 'create') setPin('');
                else setConfirmPin('');
              } else handleKeyPress(key);
            }}
          >
            <Text style={styles.keyText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {step === 'create' ? (
          <Button
            title="Continue ›"
            disabled={pin.length < 4}
            onPress={handleNextStep}
            style={styles.actionBtn}
          />
        ) : (
          <Button
            title="Establish PIN & Protect App"
            loading={loading}
            disabled={confirmPin.length < 4}
            onPress={handleCompleteSetup}
            style={styles.actionBtn}
          />
        )}
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
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#A0A0B0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
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
  actionContainer: {
    marginBottom: 10,
  },
  actionBtn: {
    width: '100%',
  },
});
