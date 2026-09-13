import React, { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';
import { PinSetupScreen, LockScreen } from './src/screens';
import { pinAuthService } from './src/services';
import { LoadingState } from './src/components';

export default function App() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isPinConfigured, setIsPinConfigured] = useState(false);
  const [isLocked, setIsLocked] = useState(true);

  const appState = useRef(AppState.currentState);

  const checkPinState = async () => {
    setCheckingAuth(true);
    const configured = await pinAuthService.isPinConfigured();
    setIsPinConfigured(configured);
    if (!configured) {
      setIsLocked(false);
    }
    setCheckingAuth(false);
  };

  useEffect(() => {
    checkPinState();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        // Lock app when moving to background if PIN configured
        if (isPinConfigured) {
          setIsLocked(true);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isPinConfigured]);

  if (checkingAuth) {
    return (
      <SafeAreaProvider>
        <LoadingState message="Initializing SolarPix security vault..." />
      </SafeAreaProvider>
    );
  }

  if (!isPinConfigured) {
    return (
      <SafeAreaProvider>
        <PinSetupScreen
          onSetupComplete={() => {
            setIsPinConfigured(true);
            setIsLocked(false);
          }}
        />
      </SafeAreaProvider>
    );
  }

  if (isLocked) {
    return (
      <SafeAreaProvider>
        <LockScreen onUnlockSuccess={() => setIsLocked(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
