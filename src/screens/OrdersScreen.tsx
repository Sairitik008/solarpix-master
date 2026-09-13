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
import { orderService, customerService, Order, OrderStatus, Customer } from '../services';
import { useAsyncOperation } from '../hooks';
import { Button, Toast, LoadingState, EmptyState } from '../components';
import { formatDate } from '../utils';

export const OrdersScreen: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amountInput, setAmountInput] = useState('');

  const [toastState, setToastState] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ visible: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastState({ visible: true, message, type });
  };

  const fetchCustomersOp = useAsyncOperation<Customer[]>(() => customerService.getAllCustomers());
  const createOrderOp = useAsyncOperation<Order, [{ customer_id: string; total_amount: number }]>(
    (data) => orderService.createOrder(data)
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    const customersRes = await fetchCustomersOp.execute();
    const allOrders: Order[] = [];

    if (customersRes.success && customersRes.data) {
      for (const c of customersRes.data) {
        const oRes = await orderService.getOrdersByCustomer(c.id);
        if (oRes.success && oRes.data) {
          allOrders.push(...oRes.data);
        }
      }
    }
    allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setOrders(allOrders);
    setLoadingOrders(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCreateOrder = async () => {
    const numAmount = parseFloat(amountInput);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Order total amount must be a positive number.', 'error');
      return;
    }

    if (!selectedCustomerId) {
      const firstCust = fetchCustomersOp.data?.[0]?.id;
      if (!firstCust) {
        showToast('Please create a customer first before creating an order.', 'error');
        return;
      }
      setSelectedCustomerId(firstCust);
    }

    const targetCustId = selectedCustomerId || fetchCustomersOp.data?.[0]?.id || '';

    const res = await createOrderOp.execute({
      customer_id: targetCustId,
      total_amount: numAmount,
    });

    if (res.success) {
      showToast(
        `Order #${res.data.id.slice(-6).toUpperCase()} created for $${numAmount.toFixed(2)}!`,
        'success'
      );
      setAmountInput('');
      setModalVisible(false);
      loadOrders();
    } else {
      showToast(res.error.userFacingMessage, 'error');
    }
  };

  const handleUpdateStatus = async (orderId: string, currentStatus: OrderStatus) => {
    const nextStatusMap: Record<OrderStatus, OrderStatus> = {
      PENDING: 'PROCESSING',
      PROCESSING: 'COMPLETED',
      COMPLETED: 'CANCELLED',
      CANCELLED: 'PENDING',
    };
    const nextStatus = nextStatusMap[currentStatus];
    const res = await orderService.updateOrderStatus(orderId, nextStatus);
    if (res.success) {
      showToast(`Order status updated to ${nextStatus}`, 'info');
      loadOrders();
    } else {
      showToast(res.error.userFacingMessage, 'error');
    }
  };

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case 'COMPLETED':
        return { bg: 'rgba(76, 175, 80, 0.15)', text: '#4CAF50' };
      case 'PROCESSING':
        return { bg: 'rgba(33, 150, 243, 0.15)', text: '#2196F3' };
      case 'CANCELLED':
        return { bg: 'rgba(255, 82, 82, 0.15)', text: '#FF5252' };
      case 'PENDING':
      default:
        return { bg: 'rgba(255, 149, 0, 0.15)', text: '#FF9500' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D11" />

      <View style={styles.header}>
        <View>
          <Text style={styles.badge}>SOLARPIX BILL BOOK</Text>
          <Text style={styles.title}>Orders & Invoices</Text>
        </View>
        <Button title="+ New Order" onPress={() => setModalVisible(true)} style={styles.addBtn} />
      </View>

      {loadingOrders ? (
        <LoadingState message="Loading encrypted order ledger..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No Orders Logged"
          description="Create your first customer order to track bills, invoices, and delivery schedules."
          actionTitle="Create Order"
          onAction={() => setModalVisible(true)}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const statusStyle = getStatusBadgeStyle(item.status);
            const customer = fetchCustomersOp.data?.find((c) => c.id === item.customer_id);

            return (
              <View style={styles.orderCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.customerName}>
                      {customer ? customer.name : `Customer ID: ${item.customer_id.slice(-6)}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
                    onPress={() => handleUpdateStatus(item.id, item.status)}
                  >
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {item.status} ✎
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                  <Text style={styles.amountText}>${item.total_amount.toFixed(2)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* New Order Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalBadge}>BILL BOOK ENTRY</Text>
            <Text style={styles.modalTitle}>Create Customer Order</Text>

            <Text style={styles.inputLabel}>Select Customer *</Text>
            {fetchCustomersOp.data && fetchCustomersOp.data.length > 0 ? (
              <View style={styles.customerPickerList}>
                {fetchCustomersOp.data.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.customerPickerItem,
                      (selectedCustomerId === c.id ||
                        (!selectedCustomerId && fetchCustomersOp.data?.[0]?.id === c.id)) &&
                        styles.customerPickerItemActive,
                    ]}
                    onPress={() => setSelectedCustomerId(c.id)}
                  >
                    <Text
                      style={[
                        styles.customerPickerText,
                        (selectedCustomerId === c.id ||
                          (!selectedCustomerId && fetchCustomersOp.data?.[0]?.id === c.id)) &&
                          styles.customerPickerTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.noCustNotice}>
                No customers available. Please add a customer first.
              </Text>
            )}

            <Text style={styles.inputLabel}>Total Amount ($) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 3500.00"
              placeholderTextColor="#555566"
              keyboardType="numeric"
              value={amountInput}
              onChangeText={setAmountInput}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Create Order"
                loading={createOrderOp.loading}
                onPress={handleCreateOrder}
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
  addBtn: {
    height: 38,
    paddingHorizontal: 16,
  },
  listContainer: {
    padding: 20,
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderId: {
    color: '#FF9500',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  customerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  dateText: {
    color: '#6C6C7D',
    fontSize: 12,
  },
  amountText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
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
  customerPickerList: {
    gap: 6,
    marginBottom: 14,
  },
  customerPickerItem: {
    backgroundColor: '#0D0D11',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  customerPickerItemActive: {
    borderColor: '#FF9500',
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
  },
  customerPickerText: {
    color: '#A0A0B0',
    fontSize: 13,
    fontWeight: '600',
  },
  customerPickerTextActive: {
    color: '#FF9500',
  },
  noCustNotice: {
    color: '#FF5252',
    fontSize: 12,
    marginBottom: 12,
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
