export const FIELD_TYPES = {
  TEXT: "text",
  TEXTAREA: "textarea",
  NUMBER: "number",
  EMAIL: "email",
  PHONE: "phone",
  SELECT: "select",
  CHECKBOX: "checkbox",
  DATE: "date",
  FILE: "file",
} as const;

export type FieldType = (typeof FIELD_TYPES)[keyof typeof FIELD_TYPES];

export interface CustomFieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface CustomFieldFileConfig {
  maxFileSize?: number; // MB (1-10)
  maxFiles?: number; // 1-5
  allowedTypes?: string[]; // ex: ["image/*", "application/pdf"]
}

export interface CustomField {
  id: string;
  companyId: string;
  label: string;
  type: FieldType;
  placeholder?: string | null;
  helpText?: string | null;
  isRequired: boolean;
  options?: string[] | null;
  allowMultiple?: boolean | null;
  validation?: CustomFieldValidation | null;
  fileConfig?: CustomFieldFileConfig | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListCustomFieldsResponse {
  success: boolean;
  data: CustomField[];
  hasFeature: boolean;
}

export interface CustomFieldWithValue extends CustomField {
  value: string | null;
}

export interface MyCustomFieldsResponse {
  success: boolean;
  data: CustomFieldWithValue[];
  hasFeature: boolean;
}

export interface SaveMyCustomFieldsInput {
  fields: Array<{
    fieldId: string;
    value: string | null;
  }>;
}

export interface SaveMyCustomFieldsResponse {
  success: boolean;
  message: string;
}
