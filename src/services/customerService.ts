import { getDatabaseConnection, CustomerRepository, Customer } from '../db';
import { ServiceResult } from '../types';
import { getVendorErrorMessage } from '../utils';

export class CustomerService {
  private async getRepo(): Promise<CustomerRepository> {
    const conn = await getDatabaseConnection();
    return new CustomerRepository(conn);
  }

  async createCustomer(
    data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ServiceResult<Customer>> {
    try {
      if (!data.name || data.name.trim().length === 0) {
        const code = 'CUSTOMER_NAME_REQUIRED';
        return {
          success: false,
          error: {
            code,
            message: 'Name field cannot be empty.',
            userFacingMessage: getVendorErrorMessage(code),
          },
        };
      }

      const repo = await this.getRepo();
      const now = new Date().toISOString();
      const customer: Customer = {
        id: `cust_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: data.name.trim(),
        phone: data.phone?.trim(),
        email: data.email?.trim(),
        address: data.address?.trim(),
        created_at: now,
        updated_at: now,
      };

      await repo.insert(customer);
      return { success: true, data: customer };
    } catch (err: any) {
      const code = 'DB_QUERY_FAILED';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to insert customer.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async getCustomerById(id: string): Promise<ServiceResult<Customer>> {
    try {
      if (!id) {
        const code = 'INVALID_CUSTOMER_ID';
        return {
          success: false,
          error: {
            code,
            message: 'ID parameter missing.',
            userFacingMessage: getVendorErrorMessage(code),
          },
        };
      }

      const repo = await this.getRepo();
      const customer = await repo.getById(id);
      if (!customer) {
        const code = 'CUSTOMER_NOT_FOUND';
        return {
          success: false,
          error: {
            code,
            message: `Customer ${id} not found.`,
            userFacingMessage: getVendorErrorMessage(code),
          },
        };
      }

      return { success: true, data: customer };
    } catch (err: any) {
      const code = 'DB_QUERY_FAILED';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Database query error.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async getAllCustomers(): Promise<ServiceResult<Customer[]>> {
    try {
      const repo = await this.getRepo();
      const customers = await repo.getAll();
      return { success: true, data: customers };
    } catch (err: any) {
      const code = 'DB_QUERY_FAILED';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to fetch customers list.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async updateCustomer(customer: Customer): Promise<ServiceResult<Customer>> {
    try {
      if (!customer.name || customer.name.trim().length === 0) {
        const code = 'CUSTOMER_NAME_REQUIRED';
        return {
          success: false,
          error: {
            code,
            message: 'Name field cannot be empty.',
            userFacingMessage: getVendorErrorMessage(code),
          },
        };
      }

      const repo = await this.getRepo();
      const updated: Customer = {
        ...customer,
        updated_at: new Date().toISOString(),
      };

      await repo.update(updated);
      return { success: true, data: updated };
    } catch (err: any) {
      const code = 'DB_QUERY_FAILED';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to update customer.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }

  async deleteCustomer(id: string): Promise<ServiceResult<boolean>> {
    try {
      const repo = await this.getRepo();
      await repo.delete(id);
      return { success: true, data: true };
    } catch (err: any) {
      const code = 'DB_QUERY_FAILED';
      return {
        success: false,
        error: {
          code,
          message: err?.message || 'Failed to delete customer.',
          userFacingMessage: getVendorErrorMessage(code),
        },
      };
    }
  }
}

export const customerService = new CustomerService();
