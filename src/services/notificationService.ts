import * as Notifications from 'expo-notifications';
import { ServiceResult } from '../types';
import { getVendorErrorMessage } from '../utils';

// Configure notification behavior for foreground alerts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch {
      return false;
    }
  }

  async schedulePaymentReminder(
    customerName: string,
    amount: number,
    secondsFromNow: number = 10
  ): Promise<ServiceResult<string>> {
    try {
      await this.requestPermissions();
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'SolarPix Payment Reminder ☀️',
          body: `Pending balance payment reminder: ${customerName} has an outstanding balance of $${amount.toFixed(2)}.`,
          data: { type: 'PAYMENT_REMINDER', customerName, amount },
        },
        trigger: {
          seconds: Math.max(1, secondsFromNow),
        } as Notifications.TimeIntervalTriggerInput,
      });

      return { success: true, data: notificationId };
    } catch (err: any) {
      const code = 'UNKNOWN_ERROR';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to schedule payment reminder.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async scheduleDeliveryReminder(
    orderId: string,
    deliveryDateStr: string,
    secondsFromNow: number = 10
  ): Promise<ServiceResult<string>> {
    try {
      await this.requestPermissions();
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'SolarPix Delivery Schedule Alert 🚚',
          body: `Upcoming delivery due for Order #${orderId.slice(-6).toUpperCase()} scheduled for ${deliveryDateStr}.`,
          data: { type: 'DELIVERY_REMINDER', orderId },
        },
        trigger: {
          seconds: Math.max(1, secondsFromNow),
        } as Notifications.TimeIntervalTriggerInput,
      });

      return { success: true, data: notificationId };
    } catch (err: any) {
      const code = 'UNKNOWN_ERROR';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to schedule delivery reminder.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // Ignore in non-native environments
    }
  }
}

export const notificationService = new NotificationService();
