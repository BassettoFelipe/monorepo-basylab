import { Calendar, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'

export function SchedulePage() {
	const handleScheduleVisit = () => {
		toast.info('Em breve você poderá agendar visitas por aqui.')
	}

	return (
		<AdminLayout>
			<PageHeader
				title="Agenda"
				description="Gerencie visitas e compromissos"
				icon={Calendar}
				action={{
					label: 'Agendar Visita',
					onClick: handleScheduleVisit,
					icon: Plus,
				}}
			/>

			<EmptyState
				icon={Calendar}
				title="Nenhuma visita agendada"
				description="Organize suas visitas aos imóveis, compromissos com clientes e eventos importantes. Receba lembretes automáticos."
				action={{
					label: 'Agendar Primeira Visita',
					onClick: handleScheduleVisit,
				}}
			/>
		</AdminLayout>
	)
}
