import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { customerService, Customer } from '../services';
import { useAsyncOperation } from '../hooks';
import { Button, Toast, LoadingState, EmptyState } from '../components';

export const CustomersScreen: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const [toastState, setToastState] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastState({ visible: true, message, type });
  };

  const hideToast = () => {
    setToastState((prev) => ({ ...prev, visible: false }));
  };

  // Async operations using central architecture hook
  const fetchOp = useAsyncOperation<Customer[]>(() => customerService.getAllCustomers());
  const createOp = useAsyncOperation<Customer, [{ name: string; phone?: string; email?: string }]>(
    (data) => customerService.createCustomer(data)
  );

  const loadCustomers = useCallback(async () => {
    const res = await fetchOp.execute();
    if (!res.success) {
      showToast(res.error.userFacingMessage, 'error');
    }
  }, [fetchOp]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreateSuccessCase = async () => {
    const res = await createOp.execute({
      name: nameInput || 'Solar Client ' + (fetchOp.data?.length || 0 + 1),
      phone: phoneInput || '+1-555-0182',
      email: emailInput || 'client@solar.com',
    });

    if (res.success) {
      showToast(`Customer "${res.data.name}" added successfully!`, 'success');
      setNameInput('');
      setPhoneInput('');
      setEmailInput('');
      setModalVisible(false);
      loadCustomers();
    } else {
      showToast(res.error.userFacingMessage, 'error');
    }
  };

  const handleTriggerForcedErrorCase = async () => {
    // Intentionally pass an empty name to trigger validation failure
    const res = await createOp.execute({
      name: '', // Empty name triggers CUSTOMER_NAME_REQUIRED
      phone: '+1-555-9999',
    });

    if (!res.success) {
      // Displays friendly vendor message, NOT raw stack trace
      showToast(res.error.userFacingMessage, 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D11" />

      <View style={styles.header}>
        <View>
          <Text style={styles.badge}>SOLARPIX MANAGEMENT</Text>
          <Text style={styles.title}>Customers Directory</Text>
        </View>
        <Button title="+ Add" onPress={() => setModalVisible(true)} style={styles.addHeaderBtn} />
      </View>

      {/* Quick Test Actions Banner */}
      <View style={styles.testBar}>
        <Text style={styles.testBarLabel}>Architecture Test Suite:</Text>
        <View style={styles.testBarButtons}>
          <TouchableOpacity
            style={[styles.testPill, styles.testPillSuccess]}
            onPress={() => {
              setNameInput('Aura Energy Corp');
              setModalVisible(true);
            }}
          >
            <Text style={styles.testPillText}>+ Quick Valid Client</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testPill, styles.testPillError]}
            onPress={handleTriggerForcedErrorCase}
          >
            <Text style={styles.testPillText}>! Trigger Validation Error</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content View */}
      {fetchOp.loading && (!fetchOp.data || fetchOp.data.length === 0) ? (
        <LoadingState message="Accessing encrypted customer ledger..." />
      ) : !fetchOp.data || fetchOp.data.length === 0 ? (
        <EmptyState
          title="No Customers Found"
          description="Your local database contains no customer records. Create your first customer to start tracking orders and ledger transactions."
          actionTitle="Create Customer"
          onAction={() => setModalVisible(true)}
        />
      ) : (
        <FlatList
          data={fetchOp.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.customerCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.customerName}>{item.name}</Text>
                {item.phone ? <Text style={styles.customerSub}>{item.phone}</Text> : null}
                {item.email ? <Text style={styles.customerSub}>{item.email}</Text> : null}
              </View>
            </View>
          )}
        />
      )}

      {/* Add Customer Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalBadge}>NEW ENTRY</Text>
            <Text style={styles.modalTitle}>Add Customer</Text>

            <Text style={styles.inputLabel}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Acme Solar Solutions"
              placeholderTextColor="#555566"
              value={nameInput}
              onChangeText={setNameInput}
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +1 (555) 019-2831"
              placeholderTextColor="#555566"
              value={phoneInput}
              onChangeText={setPhoneInput}
            />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. info@acmesolar.com"
              placeholderTextColor="#555566"
              value={emailInput}
              onChangeText={setEmailInput}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Save Customer"
                loading={createOp.loading}
                onPress={handleCreateSuccessCase}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Toast Alert */}
      <Toast
        visible={toastState.visible}
        message={toastState.message}
        type={toastState.type}
        onDismiss={hideToast}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addHeaderBtn: {
    height: 38,
    paddingHorizontal: 16,
  },
  testBar: {
    backgroundColor: '#16161F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.1)',
  },
  testBarLabel: {
    color: '#A0A0B0',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  testBarButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  testPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  testPillSuccess: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
  },
  testPillError: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderColor: '#FF5252',
  },
  testPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    gap: 12,
  },
  customerCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  avatarText: {
    color: '#FF9500',
    fontSize: 18,
    fontWeight: '800',
  },
  cardInfo: {
    flex: 1,
  },
  customerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  customerSub: {
    color: '#A0A0B0',
    fontSize: 13,
    marginTop: 2,
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
