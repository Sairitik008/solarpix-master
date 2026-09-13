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
import {
  deliveryService,
  orderService,
  customerService,
  deliveryService as delSvc,
  Delivery,
  DeliveryStatus,
} from '../services';
import { notificationService } from '../services';
import { useAsyncOperation } from '../hooks';
import { Button, Toast, LoadingState, EmptyState } from '../components';
import { formatDate } from '../utils';

export const DeliveriesScreen: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const [toastState, setToastState] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ visible: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastState({ visible: true, message, type });
  };

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);

  const createDeliveryOp = useAsyncOperation<
    Delivery,
    [{ order_id: string; delivery_date?: string; notes?: string }]
  >((data) => deliveryService.createDelivery(data));

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    // Fetch mock/database deliveries
    const customersRes = await customerService.getAllCustomers();
    const allDeliveries: Delivery[] = [];

    if (customersRes.success && customersRes.data) {
      for (const c of customersRes.data) {
        const oRes = await orderService.getOrdersByCustomer(c.id);
        if (oRes.success && oRes.data) {
          for (const ord of oRes.data) {
            const dRes = await deliveryService.getDeliveriesByOrder(ord.id);
            if (dRes.success && dRes.data) {
              allDeliveries.push(...dRes.data);
            }
          }
        }
      }
    }

    allDeliveries.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setDeliveries(allDeliveries);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const handleCreateDelivery = async () => {
    if (!orderIdInput) {
      showToast('Order ID is required to schedule a delivery.', 'error');
      return;
    }

    const res = await createDeliveryOp.execute({
      order_id: orderIdInput,
      notes: notesInput || 'Solar equipment dispatch',
    });

    if (res.success) {
      showToast('Delivery scheduled successfully!', 'success');
      await notificationService.scheduleDeliveryReminder(
        res.data.order_id,
        formatDate(res.data.created_at),
        5
      );
      setOrderIdInput('');
      setNotesInput('');
      setModalVisible(false);
      loadDeliveries();
    } else {
      showToast(res.error.userFacingMessage, 'error');
    }
  };

  const handleUpdateStatus = async (
    deliveryId: string,
    currentStatus: DeliveryStatus,
    orderId: string
  ) => {
    const nextStatusMap: Record<DeliveryStatus, DeliveryStatus> = {
      SCHEDULED: 'IN_TRANSIT',
      IN_TRANSIT: 'DELIVERED',
      DELIVERED: 'FAILED',
      FAILED: 'SCHEDULED',
    };
    const nextStatus = nextStatusMap[currentStatus];
    const res = await delSvc.updateDeliveryStatus(deliveryId, nextStatus);

    if (res.success) {
      showToast(`Delivery status updated to ${nextStatus}`, 'info');
      if (nextStatus === 'DELIVERED') {
        notificationService.scheduleDeliveryReminder(orderId, 'NOW (COMPLETED)', 2);
      }
      loadDeliveries();
    } else {
      showToast(res.error.userFacingMessage, 'error');
    }
  };

  const getStatusBadgeStyle = (status: DeliveryStatus) => {
    switch (status) {
      case 'DELIVERED':
        return { bg: 'rgba(76, 175, 80, 0.15)', text: '#4CAF50' };
      case 'IN_TRANSIT':
        return { bg: 'rgba(33, 150, 243, 0.15)', text: '#2196F3' };
      case 'FAILED':
        return { bg: 'rgba(255, 82, 82, 0.15)', text: '#FF5252' };
      case 'SCHEDULED':
      default:
        return { bg: 'rgba(255, 149, 0, 0.15)', text: '#FF9500' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D11" />

      <View style={styles.header}>
        <View>
          <Text style={styles.badge}>SOLARPIX LOGISTICS</Text>
          <Text style={styles.title}>Deliveries Schedule</Text>
        </View>
        <Button title="+ Schedule" onPress={() => setModalVisible(true)} style={styles.addBtn} />
      </View>

      {loading ? (
        <LoadingState message="Fetching active delivery schedules..." />
      ) : deliveries.length === 0 ? (
        <EmptyState
          title="No Scheduled Deliveries"
          description="Schedule equipment deliveries for your customer orders to track dispatch progress and receive alerts."
          actionTitle="Schedule Delivery"
          onAction={() => setModalVisible(true)}
        />
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const statusStyle = getStatusBadgeStyle(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderRef}>
                      Order #{item.order_id.slice(-6).toUpperCase()}
                    </Text>
                    <Text style={styles.notesText}>{item.notes || 'Equipment delivery'}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
                    onPress={() => handleUpdateStatus(item.id, item.status, item.order_id)}
                  >
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {item.status} ✎
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>
                    Scheduled: {formatDate(item.delivery_date || item.created_at)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Schedule Delivery Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalBadge}>LOGISTICS DISPATCH</Text>
            <Text style={styles.modalTitle}>Schedule Delivery</Text>

            <Text style={styles.inputLabel}>Order Reference ID *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ord_1001"
              placeholderTextColor="#555566"
              value={orderIdInput}
              onChangeText={setOrderIdInput}
            />

            <Text style={styles.inputLabel}>Delivery Notes</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Solar panels & inverter package"
              placeholderTextColor="#555566"
              value={notesInput}
              onChangeText={setNotesInput}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Schedule Alert"
                loading={createDeliveryOp.loading}
                onPress={handleCreateDelivery}
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
  card: {
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
    marginBottom: 10,
  },
  orderRef: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '800',
  },
  notesText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  dateText: {
    color: '#6C6C7D',
    fontSize: 12,
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
