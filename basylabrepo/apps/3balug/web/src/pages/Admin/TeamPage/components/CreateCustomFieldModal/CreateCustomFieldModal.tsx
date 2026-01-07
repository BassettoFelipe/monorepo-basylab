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
import { Select } from '@/components/Select/Select'
import { Switch } from '@/components/Switch/Switch'
import { useCreateCustomFieldMutation } from '@/queries/custom-fields/useCreateCustomFieldMutation'
import { FIELD_TYPES } from '@/types/custom-field.types'
import * as styles from '../CreateCustomFieldModal.styles.css'

const FILE_TYPE_OPTIONS = [
	{ value: 'image/*', label: 'Imagens (JPG, PNG, GIF, etc)' },
	{ value: 'application/pdf', label: 'PDF' },
	{ value: '.doc,.docx', label: 'Documentos Word' },
	{ value: '.xls,.xlsx', label: 'Planilhas Excel' },
]

const schema = z
	.object({
		type: z.string().min(1, 'Tipo é obrigatório'),
		label: z
			.string()
			.min(2, 'Nome deve ter pelo menos 2 caracteres')
			.max(100, 'Nome deve ter no máximo 100 caracteres'),
		placeholder: z.string().optional(),
		helpText: z.string().optional(),
		isRequired: z.boolean(),
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
			// Se tipo é SELECT, precisa ter pelo menos 2 opções
			if (data.type === FIELD_TYPES.SELECT) {
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
			// Se tipo é FILE, precisa ter pelo menos 1 tipo de arquivo
			if (data.type === FIELD_TYPES.FILE) {
				return data.fileAllowedTypes && data.fileAllowedTypes.length >= 1
			}
			return true
		},
		{
			message: 'Selecione pelo menos um tipo de arquivo',
			path: ['fileAllowedTypes'],
		},
	)

type FormData = z.infer<typeof schema>

interface CreateCustomFieldModalProps {
	isOpen: boolean
	onClose: () => void
}

export function CreateCustomFieldModal({ isOpen, onClose }: CreateCustomFieldModalProps) {
	const createMutation = useCreateCustomFieldMutation()

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		watch,
		setValue,
		control,
	} = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			type: FIELD_TYPES.TEXT,
			isRequired: false,
			options: [],
			newOption: '',
			allowMultiple: false,
			fileMaxSize: 5,
			fileMaxFiles: 1,
			fileAllowedTypes: ['image/*', 'application/pdf'],
		},
	})

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'options',
	})

	const selectedType = watch('type')
	const isRequired = watch('isRequired')
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

	// Reset form when modal closes
	useEffect(() => {
		if (!isOpen) {
			reset()
			// Limpar preview files e revogar URLs
			setPreviewFiles((prev) => {
				for (const file of prev) {
					if (file.previewUrl) {
						URL.revokeObjectURL(file.previewUrl)
					}
				}
				return []
			})
		}
	}, [isOpen, reset])

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

	const onSubmit = (data: FormData) => {
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
			...(selectedType === FIELD_TYPES.SELECT &&
				options &&
				options.length > 0 && {
					options: options.map((opt) => opt.value),
					allowMultiple: allowMultipleValue ?? false,
				}),
			...(selectedType === FIELD_TYPES.FILE && {
				fileConfig: {
					maxFileSize: maxSize,
					maxFiles: maxFiles,
					allowedTypes: allowedTypes,
				},
			}),
		}

		createMutation.mutate(payload, {
			onSuccess: () => {
				onClose()
			},
		})
	}

	const handleClose = () => {
		if (!createMutation.isPending) {
			onClose()
		}
	}

	const renderPreview = () => {
		if (!selectedType) return null

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
					<span className={styles.previewLabel} id="preview-field-label">
						{previewLabel}
						{isRequired && <span className={styles.previewRequired}>*</span>}
					</span>

					{selectedType === FIELD_TYPES.TEXT && (
						<input
							type="text"
							className={styles.previewInput}
							placeholder={previewPlaceholder}
							aria-labelledby="preview-field-label"
						/>
					)}

					{selectedType === FIELD_TYPES.TEXTAREA && (
						<textarea
							className={styles.previewTextarea}
							placeholder={previewPlaceholder}
							rows={3}
						/>
					)}

					{selectedType === FIELD_TYPES.NUMBER && (
						<input type="number" className={styles.previewInput} placeholder={previewPlaceholder} />
					)}

					{selectedType === FIELD_TYPES.EMAIL && (
						<input type="email" className={styles.previewInput} placeholder={previewPlaceholder} />
					)}

					{selectedType === FIELD_TYPES.PHONE && (
						<input type="tel" className={styles.previewInput} placeholder={previewPlaceholder} />
					)}

					{selectedType === FIELD_TYPES.DATE && (
						<input type="date" className={styles.previewInput} />
					)}

					{selectedType === FIELD_TYPES.SELECT && !allowMultiple && (
						<select className={styles.previewSelect}>
							<option>{previewPlaceholder}</option>
							{fields.map((field) => (
								<option key={field.id}>{field.value}</option>
							))}
						</select>
					)}

					{selectedType === FIELD_TYPES.SELECT && allowMultiple && (
						<div className={styles.checkboxGroup}>
							{fields.length > 0 ? (
								fields.map((field) => (
									<label key={field.id} className={styles.checkboxLabel}>
										<input type="checkbox" className={styles.checkbox} />
										{field.value}
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

					{selectedType === FIELD_TYPES.CHECKBOX && (
						<div className={styles.previewCheckboxContainer}>
							<input type="checkbox" className={styles.previewCheckbox} />
							<span className={styles.previewCheckboxLabel}>
								{previewPlaceholder || 'Marque esta opção'}
							</span>
						</div>
					)}

					{selectedType === FIELD_TYPES.FILE && (
						<div className={styles.filePreviewContainer}>
							{previewFiles.length < (fileMaxFiles || 1) && (
								<button
									type="button"
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
										aria-hidden="true"
									>
										<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
										<polyline points="17 8 12 3 7 8" />
										<line x1="12" y1="3" x2="12" y2="15" />
									</svg>
									<span className={styles.fileDropText}>
										Clique para selecionar ou arraste arquivos
									</span>
									<span className={styles.fileDropHint}>
										Máx. {fileMaxSize || 5}MB por arquivo • Até {fileMaxFiles || 1} arquivo(s)
									</span>
									<span className={styles.fileDropTypes}>
										{fileAllowedTypes
											?.map((t) => {
												const option = FILE_TYPE_OPTIONS.find((o) => o.value === t)
												return option?.label || t
											})
											.join(', ') || 'Imagens e PDF'}
									</span>
								</button>
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
														aria-hidden="true"
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
												aria-label="Remover arquivo"
											>
												<svg
													width="10"
													height="10"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="3"
													aria-hidden="true"
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

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Adicionar Campo Customizado"
			size="xl"
			footer={
				<>
					<Button variant="outline" onClick={handleClose} disabled={createMutation.isPending}>
						Cancelar
					</Button>
					<Button
						variant="primary"
						onClick={handleSubmit(onSubmit)}
						loading={createMutation.isPending}
					>
						Criar Campo
					</Button>
				</>
			}
		>
			<div className={styles.modalContent}>
				<div className={styles.formSection}>
					<form onSubmit={handleSubmit(onSubmit)}>
						<Select
							{...register('type')}
							label="Tipo de Campo"
							error={errors.type?.message}
							fullWidth
							disabled={createMutation.isPending}
							options={[
								{ value: FIELD_TYPES.TEXT, label: 'Texto Simples' },
								{ value: FIELD_TYPES.TEXTAREA, label: 'Texto Multilinha' },
								{ value: FIELD_TYPES.NUMBER, label: 'Número' },
								{ value: FIELD_TYPES.EMAIL, label: 'Email' },
								{ value: FIELD_TYPES.PHONE, label: 'Telefone' },
								{ value: FIELD_TYPES.DATE, label: 'Data' },
								{ value: FIELD_TYPES.SELECT, label: 'Lista de Opções' },
								{ value: FIELD_TYPES.CHECKBOX, label: 'Sim/Não' },
								{ value: FIELD_TYPES.FILE, label: 'Arquivo' },
							]}
							placeholder="Selecione o tipo de campo"
						/>

						<div style={{ marginTop: '16px' }}>
							<Input
								{...register('label')}
								label="Nome do Campo"
								placeholder="Ex: CRECI, Especialidade, Região de Atuação"
								error={errors.label?.message}
								fullWidth
								disabled={createMutation.isPending}
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
								disabled={createMutation.isPending}
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
								disabled={createMutation.isPending}
							/>
							<p className={styles.fieldDescription}>
								Uma dica que aparece abaixo do campo para ajudar no preenchimento
							</p>
						</div>

						<div style={{ marginTop: '16px' }}>
							<div className={styles.switchLabel}>
								<span id="switch-required-label">Tornar este campo obrigatório</span>
								<Switch
									checked={isRequired}
									onChange={(checked) => setValue('isRequired', checked)}
									disabled={createMutation.isPending}
									aria-labelledby="switch-required-label"
								/>
							</div>
							<p className={styles.fieldDescription}>
								Se ativado, o usuário não poderá salvar sem preencher este campo
							</p>
						</div>

						{/* Opções para SELECT */}
						{selectedType === FIELD_TYPES.SELECT && (
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
									<div className={styles.switchLabel}>
										<span id="switch-multiple-label">Permitir múltiplas opções</span>
										<Switch
											checked={allowMultiple ?? false}
											onChange={(checked) => setValue('allowMultiple', checked)}
											disabled={createMutation.isPending}
											aria-labelledby="switch-multiple-label"
										/>
									</div>
									<p className={styles.fieldDescription}>
										Se ativado, o usuário poderá selecionar mais de uma opção
									</p>
								</div>

								<div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
									<Input
										{...register('newOption')}
										placeholder="Digite uma opção"
										fullWidth
										disabled={createMutation.isPending}
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
										disabled={createMutation.isPending || !newOption?.trim()}
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
										{fields.map((field, index) => (
											<div key={field.id} className={styles.optionItem}>
												<span style={{ fontSize: '14px' }}>{field.value}</span>
												<button
													type="button"
													onClick={() => remove(index)}
													disabled={createMutation.isPending}
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
						{selectedType === FIELD_TYPES.FILE && (
							<div className={styles.optionsSection}>
								<p className={styles.optionsTitle}>Configurações do Arquivo</p>
								<p className={styles.fieldDescription}>Defina os limites para upload de arquivos</p>

								<div style={{ marginTop: '16px' }}>
									<Select
										label="Tamanho máximo por arquivo"
										value={String(fileMaxSize)}
										onChange={(e) => setValue('fileMaxSize', Number(e.target.value))}
										disabled={createMutation.isPending}
										fullWidth
										options={[
											{ value: '1', label: '1 MB' },
											{ value: '2', label: '2 MB' },
											{ value: '3', label: '3 MB' },
											{ value: '5', label: '5 MB' },
											{ value: '10', label: '10 MB' },
										]}
									/>
								</div>

								<div style={{ marginTop: '16px' }}>
									<Select
										label="Quantidade máxima de arquivos"
										value={String(fileMaxFiles)}
										onChange={(e) => setValue('fileMaxFiles', Number(e.target.value))}
										disabled={createMutation.isPending}
										fullWidth
										options={[
											{ value: '1', label: '1 arquivo' },
											{ value: '2', label: '2 arquivos' },
											{ value: '3', label: '3 arquivos' },
											{ value: '5', label: '5 arquivos' },
										]}
									/>
								</div>

								<div style={{ marginTop: '16px' }}>
									<span
										className={`${styles.fieldTypeLabel} ${errors.fileAllowedTypes ? styles.labelError : ''}`}
										id="file-types-label"
									>
										Tipos de arquivos permitidos
									</span>
									<div
										className={`${styles.checkboxGroup} ${errors.fileAllowedTypes ? styles.checkboxGroupError : ''}`}
									>
										{FILE_TYPE_OPTIONS.map((option) => (
											<label
												key={option.value}
												className={`${styles.checkboxLabel} ${createMutation.isPending ? styles.checkboxLabelDisabled : ''}`}
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
													disabled={createMutation.isPending}
												/>
												{option.label}
											</label>
										))}
									</div>
									{errors.fileAllowedTypes && (
										<p className={styles.errorText}>{errors.fileAllowedTypes.message}</p>
									)}
									<p className={styles.fieldDescription}>Selecione pelo menos um tipo de arquivo</p>
								</div>
							</div>
						)}
					</form>
				</div>

				{selectedType && <div className={styles.previewSection}>{renderPreview()}</div>}
			</div>
		</Modal>
	)
}
