// Shared TypeScript types definition

export interface AppConfig {
  appName: string;
  version: string;
}

export type RootStackParamList = {
  Home: undefined;
  Customers: undefined;
};

export interface ServiceError {
  code: string;
  message: string;
  userFacingMessage: string;
}

export type ServiceResult<T> =
  { success: true; data: T; error?: never } | { success: false; data?: never; error: ServiceError };
