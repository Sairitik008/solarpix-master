import { getDatabaseConnection, DeliveryRepository, Delivery, DeliveryStatus } from '../db';
import { ServiceResult } from '../types';
import { getVendorErrorMessage } from '../utils';

export class DeliveryService {
  private async getRepo(): Promise<DeliveryRepository> {
    const conn = await getDatabaseConnection();
    return new DeliveryRepository(conn);
  }

  async createDelivery(data: {
    order_id: string;
    delivery_date?: string;
    notes?: string;
  }): Promise<ServiceResult<Delivery>> {
    try {
      if (!data.order_id) {
        const code = 'ORDER_NOT_FOUND';
        return {
          success: false,
          error: {
            code,
            message: 'Order ID is required for delivery.',
            userFacingMessage: getVendorErrorMessage(code),
          },
        };
      }

      const repo = await this.getRepo();
      const now = new Date().toISOString();
      const delivery: Delivery = {
        id: `del_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        order_id: data.order_id,
        status: 'SCHEDULED',
        delivery_date: data.delivery_date || now,
        notes: data.notes?.trim(),
        created_at: now,
        updated_at: now,
      };

      await repo.insert(delivery);
      return { success: true, data: delivery };
    } catch (err: any) {
      const code = 'DB_QUERY_FAILED';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to create delivery record.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async getDeliveriesByOrder(orderId: string): Promise<ServiceResult<Delivery[]>> {
    try {
      const repo = await this.getRepo();
      const deliveries = await repo.getByOrderId(orderId);
      return { success: true, data: deliveries };
    } catch (err: any) {
      const code = 'DB_QUERY_FAILED';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to fetch order deliveries.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async updateDeliveryStatus(id: string, status: DeliveryStatus): Promise<ServiceResult<boolean>> {
    try {
      const repo = await this.getRepo();
      await repo.updateStatus(id, status, new Date().toISOString());
      return { success: true, data: true };
    } catch (err: any) {
      const code = 'DB_QUERY_FAILED';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to update delivery status.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }
}

export const deliveryService = new DeliveryService();
