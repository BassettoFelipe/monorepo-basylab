import { zodResolver } from '@hookform/resolvers/zod'
import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { Button } from '@/components/Button/Button'
import { DocumentPicker, type SelectedDocument } from '@/components/DocumentPicker/DocumentPicker'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { useCreateContractMutation } from '@/queries/contracts/useCreateContractMutation'
import { useUploadDocumentMutation } from '@/queries/documents/documents.queries'
import { usePropertiesQuery } from '@/queries/properties/usePropertiesQuery'
import { useTenantsQuery } from '@/queries/tenants/useTenantsQuery'
import { DOCUMENT_ENTITY_TYPES } from '@/types/document.types'
import { applyMask, getCurrencyRawValue } from '@/utils/masks'
import * as styles from '../ContractForm.styles.css'

const createContractSchema = z
	.object({
		propertyId: z.string().min(1, 'Selecione um imovel'),
		tenantId: z.string().min(1, 'Selecione um inquilino'),
		startDate: z.string().min(1, 'Data de inicio e obrigatoria'),
		endDate: z.string().min(1, 'Data de fim e obrigatoria'),
		rentalAmount: z.string().min(1, 'Valor do aluguel e obrigatorio'),
		paymentDay: z.string().min(1, 'Dia de vencimento e obrigatorio'),
		depositAmount: z.string().optional(),
		notes: z.string().optional(),
	})
	.refine(
		(data) => {
			if (!data.startDate || !data.endDate) return true
			return new Date(data.endDate) > new Date(data.startDate)
		},
		{
			message: 'Data de fim deve ser posterior a data de inicio',
			path: ['endDate'],
		},
	)
	.refine(
		(data) => {
			const day = Number.parseInt(data.paymentDay, 10)
			return day >= 1 && day <= 31
		},
		{
			message: 'Dia de vencimento deve ser entre 1 e 31',
			path: ['paymentDay'],
		},
	)

type CreateContractFormData = z.infer<typeof createContractSchema>

interface CreateContractModalProps {
	isOpen: boolean
	onClose: () => void
}

export function CreateContractModal({ isOpen, onClose }: CreateContractModalProps) {
	const createMutation = useCreateContractMutation()
	const uploadDocumentMutation = useUploadDocumentMutation()
	const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocument[]>([])
	const [isUploading, setIsUploading] = useState(false)

	const isSubmitting = createMutation.isPending || isUploading

	// Cleanup previews on unmount
	useEffect(() => {
		return () => {
			for (const doc of selectedDocuments) {
				if (doc.preview) {
					URL.revokeObjectURL(doc.preview)
				}
			}
		}
	}, [selectedDocuments])

	const { data: propertiesData } = usePropertiesQuery({
		status: 'available',
		limit: 100,
	})
	const { data: tenantsData } = useTenantsQuery({ limit: 100 })

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
	} = useForm<CreateContractFormData>({
		resolver: zodResolver(createContractSchema),
		mode: 'onBlur',
		defaultValues: {
			paymentDay: '5',
		},
	})

	const handleCurrencyChange =
		(field: 'rentalAmount' | 'depositAmount') => (e: ChangeEvent<HTMLInputElement>) => {
			const masked = applyMask(e.target.value, 'currency')
			setValue(field, masked, { shouldValidate: false })
		}

	const onSubmit = async (data: CreateContractFormData) => {
		try {
			const payload = {
				propertyId: data.propertyId,
				tenantId: data.tenantId,
				startDate: data.startDate,
				endDate: data.endDate,
				rentalAmount: getCurrencyRawValue(data.rentalAmount),
				paymentDay: Number.parseInt(data.paymentDay, 10),
				depositAmount: data.depositAmount ? getCurrencyRawValue(data.depositAmount) : undefined,
				notes: data.notes || undefined,
			}

			const response = await createMutation.mutateAsync(payload)
			const contractId = response.data.id

			// Upload documents if any were selected
			if (selectedDocuments.length > 0) {
				setIsUploading(true)
				try {
					for (const doc of selectedDocuments) {
						await uploadDocumentMutation.mutateAsync({
							entityType: DOCUMENT_ENTITY_TYPES.CONTRACT,
							entityId: contractId,
							documentType: doc.documentType,
							file: doc.file,
						})
					}
				} catch {
					toast.error('Contrato criado, mas houve erro ao enviar alguns documentos')
				} finally {
					setIsUploading(false)
				}
			}

			toast.success(response.message || 'Contrato criado com sucesso!')
			// Cleanup previews
			for (const doc of selectedDocuments) {
				if (doc.preview) {
					URL.revokeObjectURL(doc.preview)
				}
			}
			setSelectedDocuments([])
			reset()
			onClose()
		} catch (error: unknown) {
			const errorMessage =
				error &&
				typeof error === 'object' &&
				'response' in error &&
				error.response &&
				typeof error.response === 'object' &&
				'data' in error.response &&
				error.response.data &&
				typeof error.response.data === 'object' &&
				'message' in error.response.data
					? String(error.response.data.message)
					: 'Erro ao criar contrato'
			toast.error(errorMessage)
		}
	}

	const handleClose = () => {
		if (!isSubmitting) {
			// Cleanup previews
			for (const doc of selectedDocuments) {
				if (doc.preview) {
					URL.revokeObjectURL(doc.preview)
				}
			}
			setSelectedDocuments([])
			reset()
			onClose()
		}
	}

	const propertyOptions = [
		{ value: '', label: 'Selecione um imovel disponivel' },
		...(propertiesData?.data.map((property) => ({
			value: property.id,
			label: `${property.title} - ${property.city}/${property.state}`,
		})) || []),
	]

	const tenantOptions = [
		{ value: '', label: 'Selecione um inquilino' },
		...(tenantsData?.data.map((tenant) => ({
			value: tenant.id,
			label: tenant.name,
		})) || []),
	]

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Novo Contrato"
			size="lg"
			footer={
				<>
					<Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
						Cancelar
					</Button>
					<Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
						{isUploading ? 'Enviando documentos...' : 'Criar Contrato'}
					</Button>
				</>
			}
		>
			<form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
				<div className={styles.section}>
					<h3 className={styles.sectionTitle}>Imovel e Inquilino</h3>
					<Select
						label="Imovel"
						error={errors.propertyId?.message}
						{...register('propertyId')}
						options={propertyOptions}
						fullWidth
						required
					/>
					<Select
						label="Inquilino"
						error={errors.tenantId?.message}
						{...register('tenantId')}
						options={tenantOptions}
						fullWidth
						required
					/>
				</div>

				<div className={styles.section}>
					<h3 className={styles.sectionTitle}>Periodo do Contrato</h3>
					<div className={styles.row2Cols}>
						<Input
							label="Data de Inicio"
							type="date"
							error={errors.startDate?.message}
							{...register('startDate')}
							fullWidth
							required
						/>
						<Input
							label="Data de Fim"
							type="date"
							error={errors.endDate?.message}
							{...register('endDate')}
							fullWidth
							required
						/>
					</div>
				</div>

				<div className={styles.section}>
					<h3 className={styles.sectionTitle}>Valores</h3>
					<div className={styles.row3Cols}>
						<Input
							label="Valor do Aluguel"
							placeholder="R$ 0,00"
							error={errors.rentalAmount?.message}
							{...register('rentalAmount')}
							onChange={handleCurrencyChange('rentalAmount')}
							fullWidth
							required
						/>
						<Input
							label="Dia de Vencimento"
							type="number"
							min="1"
							max="31"
							placeholder="5"
							error={errors.paymentDay?.message}
							{...register('paymentDay')}
							fullWidth
							required
						/>
						<Input
							label="Caucao/Deposito"
							placeholder="R$ 0,00"
							error={errors.depositAmount?.message}
							{...register('depositAmount')}
							onChange={handleCurrencyChange('depositAmount')}
							fullWidth
						/>
					</div>
				</div>

				<div className={styles.section}>
					<h3 className={styles.sectionTitle}>Documentos</h3>
					<DocumentPicker
						documents={selectedDocuments}
						onChange={setSelectedDocuments}
						disabled={isSubmitting}
					/>
				</div>

				<div className={styles.section}>
					<h3 className={styles.sectionTitle}>Observacoes</h3>
					<Textarea
						label="Observacoes"
						placeholder="Observacoes adicionais sobre o contrato..."
						error={errors.notes?.message}
						{...register('notes')}
						rows={3}
					/>
				</div>
			</form>
		</Modal>
	)
}
