export type ContractStatus = "active" | "terminated" | "cancelled" | "expired";

export interface Contract {
  id: string;
  propertyId: string;
  ownerId: string;
  tenantId: string;
  brokerId: string | null;
  startDate: string;
  endDate: string;
  rentalAmount: number;
  paymentDay: number;
  depositAmount: number | null;
  status: ContractStatus;
  terminatedAt: string | null;
  terminationReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    title: string;
    address: string | null;
    city: string | null;
    state: string | null;
  };
  owner?: {
    id: string;
    name: string;
  };
  tenant?: {
    id: string;
    name: string;
  };
  broker?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateContractInput {
  propertyId: string;
  tenantId: string;
  brokerId?: string;
  startDate: string;
  endDate: string;
  rentalAmount: number;
  paymentDay: number;
  depositAmount?: number;
  notes?: string;
}

export interface UpdateContractInput {
  rentalAmount?: number;
  paymentDay?: number;
  depositAmount?: number;
  notes?: string;
}

export interface TerminateContractInput {
  reason?: string;
}

export interface ListContractsParams {
  status?: ContractStatus;
  propertyId?: string;
  tenantId?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
}

export interface ListContractsApiResponse {
  data: Contract[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ListContractsResponse {
  data: Contract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
