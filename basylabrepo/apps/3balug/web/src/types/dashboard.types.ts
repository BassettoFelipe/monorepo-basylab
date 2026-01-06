export interface DashboardStats {
	properties: {
		total: number
		available: number
		rented: number
		sold: number
		maintenance: number
	}
	contracts: {
		total: number
		active: number
		terminated: number
		cancelled: number
		expired: number
		totalRentalAmount: number
	}
	propertyOwners: {
		total: number
	}
	tenants: {
		total: number
	}
	expiringContracts: Array<{
		id: string
		propertyId: string
		tenantId: string
		endDate: string
		rentalAmount: number
	}>
}

export interface GetDashboardStatsResponse {
	success: boolean
	data: DashboardStats
}
