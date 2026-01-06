export interface ApiError {
  type: string;
  message: string;
  code: number;
  email?: string;
  handledByInterceptor?: boolean;
  [key: string]: unknown;
}
