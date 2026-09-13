import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

export interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading SolarPix records...',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF9500" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 14,
    color: '#A0A0B0',
    fontSize: 14,
    fontWeight: '500',
  },
});
