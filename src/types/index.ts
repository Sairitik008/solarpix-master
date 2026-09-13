// Shared TypeScript types definition

export interface AppConfig {
  appName: string;
  version: string;
}

export type MainTabParamList = {
  HomeTab: undefined;
  CustomersTab: undefined;
  OrdersTab: undefined;
  DeliveriesTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  CustomerDetail: { customerId: string };
};

export interface ServiceError {
  code: string;
  message: string;
  userFacingMessage: string;
}

export type ServiceResult<T> =
  { success: true; data: T; error?: never } | { success: false; data?: never; error: ServiceError };
