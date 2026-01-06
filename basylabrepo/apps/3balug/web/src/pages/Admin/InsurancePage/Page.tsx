import { FileUp, Shield } from 'lucide-react'
import { toast } from 'react-toastify'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'

export function InsurancePage() {
	const handleRequestInsuranceReview = () => {
		toast.info('Em breve você poderá solicitar análises de seguros por aqui.')
	}

	return (
		<AdminLayout>
			<PageHeader
				title="Seguros"
				description="Área de análise de seguros e documentos"
				icon={Shield}
				action={{
					label: 'Solicitar Análise',
					onClick: handleRequestInsuranceReview,
					icon: FileUp,
				}}
			/>

			<EmptyState
				icon={Shield}
				title="Nenhum seguro em análise"
				description="Gerencie análises de seguros, faça upload de documentos e acompanhe o status das solicitações. Integração com Desk Data para consultas."
				action={{
					label: 'Solicitar Primeira Análise',
					onClick: handleRequestInsuranceReview,
				}}
			/>
		</AdminLayout>
	)
}
