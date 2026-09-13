import { getDatabaseConnection, OrderRepository, Order, OrderStatus } from '../db';
import { ServiceResult } from '../types';
import { getVendorErrorMessage } from '../utils';

export class OrderService {
  private async getRepo(): Promise<OrderRepository> {
    const conn = await getDatabaseConnection();
    return new OrderRepository(conn);
  }

  async createOrder(data: {
    customer_id: string;
    total_amount: number;
  }): Promise<ServiceResult<Order>> {
    try {
      if (!data.customer_id) {
        const code = 'ORDER_CUSTOMER_REQUIRED';
        return {
          success: false,
          error: {
            code,
            message: 'Customer ID is required.',
            userFacingMessage: getVendorErrorMessage(code),
          },
        };
      }

      if (data.total_amount <= 0) {
        const code = 'ORDER_INVALID_AMOUNT';
        return {
          success: false,
          error: {
            code,
            message: 'Order total amount must be greater than zero.',
            userFacingMessage: getVendorErrorMessage(code),
          },
        };
      }

      const repo = await this.getRepo();
      const now = new Date().toISOString();
      const order: Order = {
        id: `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        customer_id: data.customer_id,
        status: 'PENDING',
        total_amount: data.total_amount,
        created_at: now,
        updated_at: now,
      };

      await repo.insert(order);
      return { success: true, data: order };
    } catch (err: any) {
      const code = 'DB_QUERY_FAILED';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to create order.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async getOrderById(id: string): Promise<ServiceResult<Order>> {
    try {
      const repo = await this.getRepo();
      const order = await repo.getById(id);
      if (!order) {
        const code = 'ORDER_NOT_FOUND';
        return {
          success: false,
          error: {
            code,
            message: `Order ${id} not found.`,
            userFacingMessage: getVendorErrorMessage(code),
          },
        };
      }
      return { success: true, data: order };
    } catch (err: any) {
      const code = 'DB_QUERY_FAILED';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Database error while fetching order.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async getOrdersByCustomer(customerId: string): Promise<ServiceResult<Order[]>> {
    try {
      const repo = await this.getRepo();
      const orders = await repo.getByCustomerId(customerId);
      return { success: true, data: orders };
    } catch (err: any) {
      const code = 'DB_QUERY_FAILED';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to fetch customer orders.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<ServiceResult<boolean>> {
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
          message: err?.message || 'Failed to update order status.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }
}

export const orderService = new OrderService();
