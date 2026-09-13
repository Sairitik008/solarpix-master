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
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  customerService,
  transactionService,
  notificationService,
  Customer,
  Transaction,
  TransactionType,
} from '../services';
import { useAsyncOperation } from '../hooks';
import { Button, Toast, LoadingState, EmptyState } from '../components';
import { RootStackParamList } from '../types';
import { formatDate } from '../utils';

type CustomerDetailRouteProp = RouteProp<RootStackParamList, 'CustomerDetail'>;
type CustomerDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CustomerDetail'>;

export const CustomerDetailScreen: React.FC = () => {
  const route = useRoute<CustomerDetailRouteProp>();
  const navigation = useNavigation<CustomerDetailNavigationProp>();
  const { customerId } = route.params;

  const [modalVisible, setModalVisible] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('CREDIT');
  const [amountInput, setAmountInput] = useState('');
  const [descInput, setDescInput] = useState('');

  const [toastState, setToastState] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ visible: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastState({ visible: true, message, type });
  };

  const fetchCustomerOp = useAsyncOperation<Customer>(() =>
    customerService.getCustomerById(customerId)
  );
  const fetchTxsOp = useAsyncOperation<Transaction[]>(() =>
    transactionService.getCustomerTransactions(customerId)
  );
  const fetchBalanceOp = useAsyncOperation<number>(() =>
    transactionService.getCustomerBalance(customerId)
  );
  const recordTxOp = useAsyncOperation<
    Transaction,
    [{ customer_id: string; type: TransactionType; amount: number; description?: string }]
  >((data) => transactionService.recordTransaction(data));

  const loadData = useCallback(async () => {
    await fetchCustomerOp.execute();
    await fetchTxsOp.execute();
    await fetchBalanceOp.execute();
  }, [customerId, fetchCustomerOp, fetchTxsOp, fetchBalanceOp]);

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordTransaction = async () => {
    const numAmount = parseFloat(amountInput);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Transaction amount must be a positive number.', 'error');
      return;
    }

    const res = await recordTxOp.execute({
      customer_id: customerId,
      type: txType,
      amount: numAmount,
      description: descInput || (txType === 'CREDIT' ? 'Payment received' : 'Service charge'),
    });

    if (res.success) {
      showToast(
        `${txType === 'CREDIT' ? 'Payment' : 'Charge'} of $${numAmount.toFixed(2)} recorded in ledger!`,
        'success'
      );
      setAmountInput('');
      setDescInput('');
      setModalVisible(false);
      loadData();
    } else {
      showToast(res.error.userFacingMessage, 'error');
    }
  };

  const handleSendReminder = async () => {
    const customerName = fetchCustomerOp.data?.name || 'Customer';
    const balance = fetchBalanceOp.data || 0;
    const res = await notificationService.schedulePaymentReminder(
      customerName,
      Math.abs(balance),
      5
    );
    if (res.success) {
      showToast('Payment reminder alert scheduled to push in 5 seconds!', 'info');
    } else {
      showToast(res.error.userFacingMessage, 'error');
    }
  };

  const currentBalance = fetchBalanceOp.data || 0;
  const isCreditBalance = currentBalance >= 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D11" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Ledger</Text>
        <View style={{ width: 60 }} />
      </View>

      {fetchCustomerOp.loading && !fetchCustomerOp.data ? (
        <LoadingState message="Fetching ledger records..." />
      ) : (
        <FlatList
          data={fetchTxsOp.data || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={
            <View>
              {/* Profile Card */}
              <View style={styles.profileCard}>
                <Text style={styles.badge}>CUSTOMER PROFILE</Text>
                <Text style={styles.customerName}>{fetchCustomerOp.data?.name || 'Customer'}</Text>
                {fetchCustomerOp.data?.phone ? (
                  <Text style={styles.profileSub}>📞 {fetchCustomerOp.data.phone}</Text>
                ) : null}
                {fetchCustomerOp.data?.email ? (
                  <Text style={styles.profileSub}>✉️ {fetchCustomerOp.data.email}</Text>
                ) : null}

                {/* Ledger Dynamic Balance Header */}
                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceLabel}>Dynamic Calculated Net Balance:</Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      isCreditBalance ? styles.creditColor : styles.debitColor,
                    ]}
                  >
                    ${Math.abs(currentBalance).toFixed(2)}{' '}
                    <Text style={styles.balanceSuffix}>
                      {isCreditBalance ? '(CREDIT / PAID)' : '(DEBIT / OUTSTANDING)'}
                    </Text>
                  </Text>
                  <Text style={styles.ledgerNotice}>
                    * Dynamically calculated from immutable ledger rows
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <Button
                    title="+ Record Payment"
                    onPress={() => {
                      setTxType('CREDIT');
                      setModalVisible(true);
                    }}
                    style={styles.actionBtn}
                  />
                  <Button
                    title="+ Add Charge"
                    variant="secondary"
                    onPress={() => {
                      setTxType('DEBIT');
                      setModalVisible(true);
                    }}
                    style={styles.actionBtn}
                  />
                </View>

                <Button
                  title="🔔 Schedule Local Payment Reminder"
                  variant="secondary"
                  onPress={handleSendReminder}
                  style={styles.reminderBtn}
                />
              </View>

              <Text style={styles.sectionTitle}>Transaction Timeline (Immutable Ledger)</Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title="No Ledger Transactions"
              description="No payments or charges recorded for this customer yet."
              actionTitle="Record First Payment"
              onAction={() => {
                setTxType('CREDIT');
                setModalVisible(true);
              }}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.txCard}>
              <View
                style={[
                  styles.txBadge,
                  item.type === 'CREDIT' ? styles.txBadgeCredit : styles.txBadgeDebit,
                ]}
              >
                <Text
                  style={[
                    styles.txBadgeText,
                    item.type === 'CREDIT' ? styles.creditColor : styles.debitColor,
                  ]}
                >
                  {item.type}
                </Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{item.description || 'Ledger Entry'}</Text>
                <Text style={styles.txDate}>{formatDate(item.created_at)}</Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  item.type === 'CREDIT' ? styles.creditColor : styles.debitColor,
                ]}
              >
                {item.type === 'CREDIT' ? '+' : '-'}${item.amount.toFixed(2)}
              </Text>
            </View>
          )}
        />
      )}

      {/* Record Transaction Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalBadge}>IMMUTABLE LEDGER ENTRY</Text>
            <Text style={styles.modalTitle}>
              {txType === 'CREDIT' ? 'Record Payment (Credit)' : 'Add Charge (Debit)'}
            </Text>

            <Text style={styles.inputLabel}>Amount ($) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1500.00"
              placeholderTextColor="#555566"
              keyboardType="numeric"
              value={amountInput}
              onChangeText={setAmountInput}
            />

            <Text style={styles.inputLabel}>Description / Notes</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Initial installation deposit"
              placeholderTextColor="#555566"
              value={descInput}
              onChangeText={setDescInput}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Save Transaction"
                loading={recordTxOp.loading}
                onPress={handleRecordTransaction}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.15)',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#1A1A22',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
    marginBottom: 20,
  },
  badge: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  customerName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  profileSub: {
    color: '#A0A0B0',
    fontSize: 13,
    marginTop: 2,
  },
  balanceContainer: {
    backgroundColor: '#12121A',
    borderRadius: 12,
    padding: 16,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  balanceLabel: {
    color: '#A0A0B0',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  balanceSuffix: {
    fontSize: 12,
    fontWeight: '600',
  },
  creditColor: {
    color: '#4CAF50',
  },
  debitColor: {
    color: '#FF5252',
  },
  ledgerNotice: {
    color: '#6C6C7D',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    height: 42,
  },
  reminderBtn: {
    height: 40,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  txCard: {
    backgroundColor: '#16161F',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  txBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  txBadgeCredit: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  txBadgeDebit: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
  },
  txBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  txDate: {
    color: '#6C6C7D',
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
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
