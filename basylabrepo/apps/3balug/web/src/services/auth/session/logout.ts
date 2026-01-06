import { api } from '@/lib/api'
import { storage } from '@/utils/storage'

export const logout = async (): Promise<void> => {
	try {
		if (storage.isAuthenticated()) {
			await api.post('/auth/logout')
		}
	} finally {
		storage.clearAll()
	}
}
