import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { z } from 'zod'

interface PreviewFile {
	id: string
	name: string
	size: number
	type: string
	previewUrl?: string
}

import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Switch } from '@/components/Switch/Switch'
import { useUpdateCustomFieldMutation } from '@/queries/custom-fields/useUpdateCustomFieldMutation'
import { type CustomField, FIELD_TYPES } from '@/types/custom-field.types'
import * as styles from '../CreateCustomFieldModal.styles.css'

const FIELD_TYPE_LABELS: Record<string, string> = {
	[FIELD_TYPES.TEXT]: 'Texto Simples',
	[FIELD_TYPES.TEXTAREA]: 'Texto Multilinha',
	[FIELD_TYPES.NUMBER]: 'Número',
	[FIELD_TYPES.EMAIL]: 'Email',
	[FIELD_TYPES.PHONE]: 'Telefone',
	[FIELD_TYPES.DATE]: 'Data',
	[FIELD_TYPES.SELECT]: 'Lista de Opções',
	[FIELD_TYPES.CHECKBOX]: 'Sim/Não',
	[FIELD_TYPES.FILE]: 'Arquivo',
}

const FILE_TYPE_OPTIONS = [
	{ value: 'image/*', label: 'Imagens (JPG, PNG, GIF, etc)' },
	{ value: 'application/pdf', label: 'PDF' },
	{ value: '.doc,.docx', label: 'Documentos Word' },
	{ value: '.xls,.xlsx', label: 'Planilhas Excel' },
]

const createSchema = (fieldType: string | undefined) =>
	z
		.object({
			label: z
				.string()
				.min(2, 'Nome deve ter pelo menos 2 caracteres')
				.max(100, 'Nome deve ter no máximo 100 caracteres'),
			placeholder: z.string().optional(),
			helpText: z.string().optional(),
			isRequired: z.boolean(),
			isActive: z.boolean(),
			options: z
				.array(
					z.object({
						value: z.string().min(1),
					}),
				)
				.optional(),
			newOption: z.string().optional(),
			allowMultiple: z.boolean().optional(),
			// Configurações de arquivo
			fileMaxSize: z.number().min(1).max(10).optional(),
			fileMaxFiles: z.number().min(1).max(5).optional(),
			fileAllowedTypes: z.array(z.string()).optional(),
		})
		.refine(
			(data) => {
				if (fieldType === FIELD_TYPES.SELECT) {
					return data.options && data.options.length >= 2
				}
				return true
			},
			{
				message: 'Campos do tipo seleção devem ter pelo menos 2 opções',
				path: ['options'],
			},
		)
		.refine(
			(data) => {
				if (fieldType === FIELD_TYPES.FILE) {
					return data.fileAllowedTypes && data.fileAllowedTypes.length >= 1
				}
				return true
			},
			{
				message: 'Selecione pelo menos um tipo de arquivo',
				path: ['fileAllowedTypes'],
			},
		)

type FormData = z.infer<ReturnType<typeof createSchema>>

interface EditCustomFieldModalProps {
	isOpen: boolean
	onClose: () => void
	field: CustomField | null
}

export function EditCustomFieldModal({ isOpen, onClose, field }: EditCustomFieldModalProps) {
	const updateMutation = useUpdateCustomFieldMutation()

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		watch,
		setValue,
		control,
	} = useForm<FormData>({
		resolver: zodResolver(createSchema(field?.type)),
		defaultValues: {
			isRequired: false,
			isActive: true,
			options: [],
			newOption: '',
			allowMultiple: false,
			fileMaxSize: 5,
			fileMaxFiles: 1,
			fileAllowedTypes: ['image/*', 'application/pdf'],
		},
	})

	const { fields, append, remove, replace } = useFieldArray({
		control,
		name: 'options',
	})

	const isRequired = watch('isRequired')
	const isActive = watch('isActive')
	const label = watch('label')
	const placeholder = watch('placeholder')
	const helpText = watch('helpText')
	const newOption = watch('newOption')
	const allowMultiple = watch('allowMultiple')
	const fileMaxSize = watch('fileMaxSize')
	const fileMaxFiles = watch('fileMaxFiles')
	const fileAllowedTypes = watch('fileAllowedTypes')

	// Estado para preview de arquivos (apenas demonstração)
	const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([])
	const [isDragging, setIsDragging] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handlePreviewFiles = useCallback(
		(files: FileList | null) => {
			if (!files || files.length === 0) return

			const maxFiles = fileMaxFiles || 1
			const filesToAdd = Array.from(files).slice(0, maxFiles - previewFiles.length)

			const newFiles: PreviewFile[] = filesToAdd.map((file) => {
				const previewFile: PreviewFile = {
					id: `${file.name}-${Date.now()}-${Math.random()}`,
					name: file.name,
					size: file.size,
					type: file.type,
				}

				if (file.type.startsWith('image/')) {
					previewFile.previewUrl = URL.createObjectURL(file)
				}

				return previewFile
			})

			setPreviewFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles))
		},
		[fileMaxFiles, previewFiles.length],
	)

	const handleRemovePreviewFile = useCallback((id: string) => {
		setPreviewFiles((prev) => {
			const file = prev.find((f) => f.id === id)
			if (file?.previewUrl) {
				URL.revokeObjectURL(file.previewUrl)
			}
			return prev.filter((f) => f.id !== id)
		})
	}, [])

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(true)
	}, [])

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(false)
	}, [])

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			setIsDragging(false)
			handlePreviewFiles(e.dataTransfer.files)
		},
		[handlePreviewFiles],
	)

	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			handlePreviewFiles(e.target.files)
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		},
		[handlePreviewFiles],
	)

	useEffect(() => {
		if (field && isOpen) {
			reset({
				label: field.label,
				placeholder: field.placeholder || '',
				helpText: field.helpText || '',
				isRequired: field.isRequired,
				isActive: field.isActive,
				options: [],
				newOption: '',
				allowMultiple: field.allowMultiple ?? false,
				fileMaxSize: field.fileConfig?.maxFileSize || 5,
				fileMaxFiles: field.fileConfig?.maxFiles || 1,
				fileAllowedTypes: field.fileConfig?.allowedTypes || ['image/*', 'application/pdf'],
			})
			if (field.options && field.options.length > 0) {
				replace(field.options.map((opt) => ({ value: opt })))
			}
		}
	}, [field, isOpen, reset, replace])

	// Limpar preview files quando modal fecha
	useEffect(() => {
		if (!isOpen) {
			setPreviewFiles((prev) => {
				for (const file of prev) {
					if (file.previewUrl) {
						URL.revokeObjectURL(file.previewUrl)
					}
				}
				return []
			})
		}
	}, [isOpen])

	const handleAddOption = () => {
		const trimmedOption = newOption?.trim()
		if (trimmedOption) {
			const isDuplicate = fields.some((f) => f.value.toLowerCase() === trimmedOption.toLowerCase())
			if (isDuplicate) {
				toast.warning('Esta opção já existe na lista')
				return
			}
			append({ value: trimmedOption })
			setValue('newOption', '')
		}
	}

	const onSubmit = async (data: FormData) => {
		if (!field) return

		const {
			newOption: _,
			options,
			allowMultiple: allowMultipleValue,
			fileMaxSize: maxSize,
			fileMaxFiles: maxFiles,
			fileAllowedTypes: allowedTypes,
			...restData
		} = data

		const payload = {
			...restData,
			...(field.type === FIELD_TYPES.SELECT &&
				options &&
				options.length > 0 && {
					options: options.map((opt) => opt.value),
					allowMultiple: allowMultipleValue ?? false,
				}),
			...(field.type === FIELD_TYPES.FILE && {
				fileConfig: {
					maxFileSize: maxSize,
					maxFiles: maxFiles,
					allowedTypes: allowedTypes,
				},
			}),
		}

		updateMutation.mutate(
			{ fieldId: field.id, payload },
			{
				onSuccess: () => {
					onClose()
				},
			},
		)
	}

	const handleClose = () => {
		if (!updateMutation.isPending) {
			onClose()
		}
	}

	const renderPreview = () => {
		if (!field) return null

		const previewLabel = label || 'Nome do Campo'
		const previewPlaceholder = placeholder || 'Texto de Exemplo (Opcional)'
		const previewHelpText = helpText || 'Dica de Preenchimento (Opcional)'

		return (
			<div className={styles.previewContainer}>
				<div className={styles.previewHeader}>
					<span className={styles.previewTitle}>Pré-visualização</span>
					<span className={styles.previewSubtitle}>
						Veja como o campo aparecerá para os usuários
					</span>
				</div>

				<div className={styles.previewField}>
					<label className={styles.previewLabel}>
						{previewLabel}
						{isRequired && <span className={styles.previewRequired}>*</span>}
					</label>

					{field.type === FIELD_TYPES.TEXT && (
						<input
							type="text"
							className={styles.previewInput}
							placeholder={previewPlaceholder}
							disabled
						/>
					)}

					{field.type === FIELD_TYPES.TEXTAREA && (
						<textarea
							className={styles.previewTextarea}
							placeholder={previewPlaceholder}
							rows={3}
							disabled
						/>
					)}

					{field.type === FIELD_TYPES.NUMBER && (
						<input
							type="number"
							className={styles.previewInput}
							placeholder={previewPlaceholder}
							disabled
						/>
					)}

					{field.type === FIELD_TYPES.EMAIL && (
						<input
							type="email"
							className={styles.previewInput}
							placeholder={previewPlaceholder}
							disabled
						/>
					)}

					{field.type === FIELD_TYPES.PHONE && (
						<input
							type="tel"
							className={styles.previewInput}
							placeholder={previewPlaceholder}
							disabled
						/>
					)}

					{field.type === FIELD_TYPES.DATE && (
						<input type="date" className={styles.previewInput} disabled />
					)}

					{field.type === FIELD_TYPES.SELECT && !allowMultiple && (
						<select className={styles.previewSelect} disabled>
							<option>{previewPlaceholder}</option>
							{fields.map((f) => (
								<option key={f.id}>{f.value}</option>
							))}
						</select>
					)}

					{field.type === FIELD_TYPES.SELECT && allowMultiple && (
						<div className={styles.checkboxGroup}>
							{fields.length > 0 ? (
								fields.map((f) => (
									<label key={f.id} className={styles.checkboxLabel}>
										<input type="checkbox" className={styles.checkbox} disabled />
										{f.value}
									</label>
								))
							) : (
								<span
									style={{
										color: 'var(--color-text-tertiary)',
										fontSize: '14px',
									}}
								>
									Adicione opções para visualizar
								</span>
							)}
						</div>
					)}

					{field.type === FIELD_TYPES.CHECKBOX && (
						<div className={styles.previewCheckboxContainer}>
							<input type="checkbox" className={styles.previewCheckbox} disabled />
							<span className={styles.previewCheckboxLabel}>
								{previewPlaceholder || 'Marque esta opção'}
							</span>
						</div>
					)}

					{field.type === FIELD_TYPES.FILE && (
						<div className={styles.filePreviewContainer}>
							{previewFiles.length < (fileMaxFiles || 1) && (
								<div
									className={`${styles.fileDropZone} ${isDragging ? styles.fileDropZoneDragging : ''}`}
									onDragOver={handleDragOver}
									onDragLeave={handleDragLeave}
									onDrop={handleDrop}
									onClick={() => fileInputRef.current?.click()}
								>
									<input
										ref={fileInputRef}
										type="file"
										style={{ display: 'none' }}
										onChange={handleFileInputChange}
										accept={fileAllowedTypes?.join(',')}
										multiple={(fileMaxFiles || 1) > 1}
									/>
									<svg
										className={styles.fileDropIcon}
										width="40"
										height="40"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.5"
									>
										<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
										<polyline points="17 8 12 3 7 8" />
										<line x1="12" y1="3" x2="12" y2="15" />
									</svg>
									<span className={styles.fileDropText}>
										Clique para selecionar ou arraste arquivos
									</span>
									<span className={styles.fileDropHint}>
										Máx: {fileMaxFiles || 1} {(fileMaxFiles || 1) === 1 ? 'arquivo' : 'arquivos'} de{' '}
										{fileMaxSize || 5}MB cada
									</span>
									<span className={styles.fileDropTypes}>
										{fileAllowedTypes && fileAllowedTypes.length > 0
											? fileAllowedTypes
													.map((t) => {
														const option = FILE_TYPE_OPTIONS.find((o) => o.value === t)
														return option ? option.label : t
													})
													.join(', ')
											: 'Todos os tipos'}
									</span>
								</div>
							)}

							{previewFiles.length > 0 && (
								<div className={styles.fileItemsContainer}>
									{previewFiles.map((file) => (
										<div key={file.id} className={styles.fileItemPreview}>
											{file.previewUrl ? (
												<img
													src={file.previewUrl}
													alt={file.name}
													className={styles.fileItemImagePreview}
												/>
											) : (
												<span className={styles.fileItemIcon}>
													<svg
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
													>
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
														<polyline points="14 2 14 8 20 8" />
													</svg>
												</span>
											)}
											<span className={styles.fileItemName}>{file.name}</span>
											<button
												type="button"
												className={styles.fileItemRemove}
												onClick={() => handleRemovePreviewFile(file.id)}
												title="Remover"
											>
												<svg
													width="10"
													height="10"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="3"
												>
													<line x1="18" y1="6" x2="6" y2="18" />
													<line x1="6" y1="6" x2="18" y2="18" />
												</svg>
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{previewHelpText && <span className={styles.previewHelpText}>{previewHelpText}</span>}
				</div>
			</div>
		)
	}

	if (!field) return null

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Editar Campo Customizado"
			size="xl"
			footer={
				<>
					<Button variant="outline" onClick={handleClose} disabled={updateMutation.isPending}>
						Cancelar
					</Button>
					<Button
						variant="primary"
						onClick={handleSubmit(onSubmit)}
						loading={updateMutation.isPending}
					>
						Salvar Alterações
					</Button>
				</>
			}
		>
			<div className={styles.modalContent}>
				<div className={styles.formSection}>
					<form onSubmit={handleSubmit(onSubmit)}>
						{/* Tipo de Campo (apenas visualização) */}
						<div className={styles.fieldTypeDisplay}>
							<span className={styles.fieldTypeLabel}>Tipo de Campo</span>
							<span className={styles.fieldTypeValue}>
								{FIELD_TYPE_LABELS[field.type] || field.type}
							</span>
						</div>

						<div style={{ marginTop: '16px' }}>
							<Input
								{...register('label')}
								label="Nome do Campo"
								placeholder="Ex: CRECI, Especialidade, Região de Atuação"
								error={errors.label?.message}
								fullWidth
								disabled={updateMutation.isPending}
							/>
							<p className={styles.fieldDescription}>Este é o nome que aparecerá acima do campo</p>
						</div>

						<div style={{ marginTop: '16px' }}>
							<Input
								{...register('placeholder')}
								label="Texto de Exemplo (Opcional)"
								placeholder="Ex: Digite seu número CRECI"
								error={errors.placeholder?.message}
								fullWidth
								disabled={updateMutation.isPending}
							/>
							<p className={styles.fieldDescription}>
								Texto que aparece dentro do campo vazio como exemplo
							</p>
						</div>

						<div style={{ marginTop: '16px' }}>
							<Input
								{...register('helpText')}
								label="Dica de Preenchimento (Opcional)"
								placeholder="Ex: Apenas números, sem letras"
								error={errors.helpText?.message}
								fullWidth
								disabled={updateMutation.isPending}
							/>
							<p className={styles.fieldDescription}>
								Uma dica que aparece abaixo do campo para ajudar no preenchimento
							</p>
						</div>

						<div style={{ marginTop: '16px' }}>
							<label className={styles.switchLabel}>
								<span>Tornar este campo obrigatório</span>
								<Switch
									checked={isRequired}
									onChange={(checked) => setValue('isRequired', checked)}
									disabled={updateMutation.isPending}
								/>
							</label>
							<p className={styles.fieldDescription}>
								Se ativado, o usuário não poderá salvar sem preencher este campo
							</p>
						</div>

						<div style={{ marginTop: '16px' }}>
							<label className={styles.switchLabel}>
								<span>Campo ativo</span>
								<Switch
									checked={isActive}
									onChange={(checked) => setValue('isActive', checked)}
									disabled={updateMutation.isPending}
								/>
							</label>
							<p className={styles.fieldDescription}>
								Campos inativos não aparecem no formulário de cadastro
							</p>
						</div>

						{/* Opções para SELECT */}
						{field.type === FIELD_TYPES.SELECT && (
							<div
								className={`${styles.optionsSection} ${errors.options ? styles.checkboxGroupError : ''}`}
							>
								<p className={`${styles.optionsTitle} ${errors.options ? styles.labelError : ''}`}>
									Opções da Lista
								</p>
								<p className={styles.fieldDescription}>
									Adicione as opções que aparecerão na lista suspensa
								</p>
								{errors.options && <p className={styles.errorText}>{errors.options.message}</p>}

								<div style={{ marginTop: '16px' }}>
									<label className={styles.switchLabel}>
										<span>Permitir múltiplas opções</span>
										<Switch
											checked={allowMultiple ?? false}
											onChange={(checked) => setValue('allowMultiple', checked)}
											disabled={updateMutation.isPending}
										/>
									</label>
									<p className={styles.fieldDescription}>
										Se ativado, o usuário poderá selecionar mais de uma opção
									</p>
								</div>

								<div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
									<Input
										{...register('newOption')}
										placeholder="Digite uma opção"
										fullWidth
										disabled={updateMutation.isPending}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault()
												handleAddOption()
											}
										}}
									/>
									<Button
										type="button"
										variant="outline"
										onClick={handleAddOption}
										disabled={updateMutation.isPending || !newOption?.trim()}
									>
										Adicionar
									</Button>
								</div>

								{fields.length > 0 && (
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '4px',
											marginTop: '12px',
										}}
									>
										{fields.map((f, index) => (
											<div key={f.id} className={styles.optionItem}>
												<span style={{ fontSize: '14px' }}>{f.value}</span>
												<button
													type="button"
													onClick={() => remove(index)}
													disabled={updateMutation.isPending}
													className={styles.removeOptionButton}
												>
													Remover
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						)}

						{/* Configurações para FILE */}
						{field.type === FIELD_TYPES.FILE && (
							<div className={styles.optionsSection}>
								<p className={styles.optionsTitle}>Configurações do Arquivo</p>
								<p className={styles.fieldDescription}>
									Defina os limites e tipos de arquivos aceitos
								</p>

								<div style={{ marginTop: '12px' }}>
									<label className={styles.fieldTypeLabel}>Tamanho Máximo (MB)</label>
									<select
										className={styles.previewSelect}
										value={fileMaxSize}
										onChange={(e) => setValue('fileMaxSize', Number(e.target.value))}
										disabled={updateMutation.isPending}
									>
										{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
											<option key={size} value={size}>
												{size} MB
											</option>
										))}
									</select>
									<p className={styles.fieldDescription}>Tamanho máximo permitido por arquivo</p>
								</div>

								<div style={{ marginTop: '12px' }}>
									<label className={styles.fieldTypeLabel}>Quantidade Máxima de Arquivos</label>
									<select
										className={styles.previewSelect}
										value={fileMaxFiles}
										onChange={(e) => setValue('fileMaxFiles', Number(e.target.value))}
										disabled={updateMutation.isPending}
									>
										{[1, 2, 3, 4, 5].map((count) => (
											<option key={count} value={count}>
												{count} {count === 1 ? 'arquivo' : 'arquivos'}
											</option>
										))}
									</select>
									<p className={styles.fieldDescription}>
										Número máximo de arquivos que podem ser enviados
									</p>
								</div>

								<div style={{ marginTop: '12px' }}>
									<label
										className={`${styles.fieldTypeLabel} ${errors.fileAllowedTypes ? styles.labelError : ''}`}
									>
										Tipos de Arquivos Permitidos
									</label>
									<div
										className={`${styles.checkboxGroup} ${errors.fileAllowedTypes ? styles.checkboxGroupError : ''}`}
									>
										{FILE_TYPE_OPTIONS.map((option) => (
											<label
												key={option.value}
												className={`${styles.checkboxLabel} ${updateMutation.isPending ? styles.checkboxLabelDisabled : ''}`}
											>
												<input
													type="checkbox"
													className={styles.checkbox}
													checked={fileAllowedTypes?.includes(option.value) || false}
													onChange={(e) => {
														const current = fileAllowedTypes || []
														if (e.target.checked) {
															setValue('fileAllowedTypes', [...current, option.value], {
																shouldValidate: true,
															})
														} else {
															setValue(
																'fileAllowedTypes',
																current.filter((t) => t !== option.value),
																{ shouldValidate: true },
															)
														}
													}}
													disabled={updateMutation.isPending}
												/>
												{option.label}
											</label>
										))}
									</div>
									{errors.fileAllowedTypes && (
										<p className={styles.errorText}>{errors.fileAllowedTypes.message}</p>
									)}
									<p className={styles.fieldDescription}>
										Selecione quais tipos de arquivo serão aceitos
									</p>
								</div>
							</div>
						)}
					</form>
				</div>

				<div className={styles.previewSection}>{renderPreview()}</div>
			</div>
		</Modal>
	)
}
