import { AlertCircle, CheckCircle2, FileText, RefreshCw, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/Button/Button";
import {
  type ExistingFile,
  FileUploadLocal,
  type LocalFile,
} from "@/components/FileUploadLocal/FileUploadLocal";
import { FormSection } from "@/components/FormSection/FormSection";
import { Input } from "@/components/Input/Input";
import { Logo } from "@/components/Logo/Logo";
import { ProgressBar } from "@/components/ProgressBar/ProgressBar";
import { Select } from "@/components/Select/Select";
import { Skeleton } from "@/components/Skeleton/Skeleton";
import { useMyCustomFieldsQuery } from "@/queries/custom-fields/useMyCustomFieldsQuery";
import { useSaveMyCustomFieldsMutation } from "@/queries/custom-fields/useSaveMyCustomFieldsMutation";
import { uploadWithPresignedUrl } from "@/services/files/upload";
import type { CustomFieldWithValue } from "@/types/custom-field.types";
import { FIELD_TYPES } from "@/types/custom-field.types";
import { storage } from "@/utils/storage";
import * as styles from "./SetupProfilePage.css";

export function SetupProfilePage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useMyCustomFieldsQuery();
  const saveMutation = useSaveMyCustomFieldsMutation();

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldFiles, setFieldFiles] = useState<Record<string, LocalFile[]>>({});
  const [existingFieldFiles, setExistingFieldFiles] = useState<Record<string, ExistingFile[]>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  const fields = data?.data || [];

  // Inicializar valores dos campos quando carregarem
  if (fields.length > 0 && Object.keys(fieldValues).length === 0) {
    const initialValues: Record<string, string> = {};
    const initialExistingFiles: Record<string, ExistingFile[]> = {};

    for (const field of fields) {
      if (field.type === FIELD_TYPES.FILE && field.value) {
        try {
          const parsed = JSON.parse(field.value);
          if (Array.isArray(parsed)) {
            initialExistingFiles[field.id] = parsed.map(
              (f: { url: string; fileName: string; key: string }, idx: number) => ({
                url: f.url,
                name: f.fileName,
                id: f.key || `existing-${idx}`,
              }),
            );
          }
        } catch {
          // Ignore parsing errors
        }
        initialValues[field.id] = "";
      } else {
        initialValues[field.id] = field.value || "";
      }
    }

    if (Object.keys(initialValues).length > 0) {
      setFieldValues(initialValues);
    }
    if (Object.keys(initialExistingFiles).length > 0) {
      setExistingFieldFiles(initialExistingFiles);
    }
  }

  // Limpa o cache local quando não há campos para preencher
  useEffect(() => {
    if (!isLoading && !error && fields.length === 0) {
      storage.setHasPendingCustomFields(false);
    }
  }, [isLoading, error, fields.length]);

  // Agrupar campos por tipo
  const fieldGroups = useMemo(() => {
    const groups: Record<string, CustomFieldWithValue[]> = {
      personal: [],
      documents: [],
      other: [],
    };

    for (const field of fields) {
      if (field.type === FIELD_TYPES.FILE) {
        groups.documents.push(field);
      } else if (
        field.type === FIELD_TYPES.TEXT ||
        field.type === FIELD_TYPES.EMAIL ||
        field.type === FIELD_TYPES.PHONE
      ) {
        groups.personal.push(field);
      } else {
        groups.other.push(field);
      }
    }

    return Object.fromEntries(Object.entries(groups).filter(([_, f]) => f.length > 0));
  }, [fields]);

  // Calcular progresso
  const progress = useMemo(() => {
    let completed = 0;
    let total = 0;

    for (const field of fields) {
      if (field.isRequired) {
        total++;
        if (field.type === FIELD_TYPES.FILE) {
          const hasNewFiles = fieldFiles[field.id]?.length > 0;
          const hasExistingFiles = existingFieldFiles[field.id]?.length > 0;
          if (hasNewFiles || hasExistingFiles) completed++;
        } else if (field.type === FIELD_TYPES.SELECT && field.allowMultiple) {
          // Para múltipla seleção, verificar se pelo menos uma opção foi selecionada
          const value = fieldValues[field.id];
          if (value) {
            try {
              const selectedValues = JSON.parse(value) as string[];
              if (selectedValues.length > 0) completed++;
            } catch {
              // Ignora erros de parse
            }
          }
        } else {
          if (fieldValues[field.id]?.trim()) completed++;
        }
      }
    }

    return { completed, total };
  }, [fields, fieldValues, fieldFiles, existingFieldFiles]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleFileChange = (fieldId: string, files: LocalFile[]) => {
    setFieldFiles((prev) => ({ ...prev, [fieldId]: files }));
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleRemoveExistingFile = (fieldId: string, file: ExistingFile) => {
    setExistingFieldFiles((prev) => ({
      ...prev,
      [fieldId]: (prev[fieldId] || []).filter((f) => f.id !== file.id),
    }));
  };

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};

    for (const field of fields) {
      if (field.isRequired) {
        if (field.type === FIELD_TYPES.FILE) {
          const newFiles = fieldFiles[field.id] || [];
          const existingFiles = existingFieldFiles[field.id] || [];
          if (newFiles.length === 0 && existingFiles.length === 0) {
            errors[field.id] = `${field.label} é obrigatório`;
          }
        } else if (field.type === FIELD_TYPES.SELECT && field.allowMultiple) {
          // Para múltipla seleção, verificar se pelo menos uma opção foi selecionada
          const value = fieldValues[field.id];
          if (!value) {
            errors[field.id] = `${field.label} é obrigatório`;
          } else {
            try {
              const selectedValues = JSON.parse(value) as string[];
              if (selectedValues.length === 0) {
                errors[field.id] = `${field.label} é obrigatório`;
              }
            } catch {
              errors[field.id] = `${field.label} é obrigatório`;
            }
          }
        } else {
          const value = fieldValues[field.id];
          if (!value || !value.trim()) {
            errors[field.id] = `${field.label} é obrigatório`;
          }
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFields()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setIsUploading(true);

      // Coletar todos os uploads necessários
      const uploadTasks: Array<{
        fieldId: string;
        file: File;
        maxFileSize: number;
        allowedTypes: string[];
      }> = [];

      for (const field of fields) {
        if (field.type === FIELD_TYPES.FILE) {
          const localFiles = fieldFiles[field.id] || [];
          for (const localFile of localFiles) {
            uploadTasks.push({
              fieldId: field.id,
              file: localFile.file,
              maxFileSize: field.fileConfig?.maxFileSize || 5,
              allowedTypes: field.fileConfig?.allowedTypes || [],
            });
          }
        }
      }

      // Fazer uploads em paralelo usando presigned URLs
      const uploadResults = await Promise.all(
        uploadTasks.map((task) =>
          uploadWithPresignedUrl({
            file: task.file,
            fieldId: task.fieldId,
            maxFileSize: task.maxFileSize,
            allowedTypes: task.allowedTypes,
          }).then((result) => ({
            fieldId: task.fieldId,
            ...result,
          })),
        ),
      );

      // Agrupar resultados por fieldId
      const uploadedFiles: Record<
        string,
        Array<{
          url: string;
          key: string;
          fileName: string;
          size: number;
          contentType: string;
        }>
      > = {};

      for (const result of uploadResults) {
        if (!uploadedFiles[result.fieldId]) {
          uploadedFiles[result.fieldId] = [];
        }
        uploadedFiles[result.fieldId].push({
          url: result.url,
          key: result.key,
          fileName: result.fileName,
          size: result.size,
          contentType: result.contentType,
        });
      }

      // Preparar dados para salvar
      const fieldsToSave = fields.map((field) => {
        if (field.type === FIELD_TYPES.FILE) {
          const newFiles = uploadedFiles[field.id] || [];
          const existing = existingFieldFiles[field.id] || [];

          // Converter existing files de volta para o formato original
          const existingFormatted = existing.map((ef) => ({
            url: ef.url,
            key: ef.id,
            fileName: ef.name,
            size: 0,
            contentType: "",
          }));

          const allFiles = [...existingFormatted, ...newFiles];
          return {
            fieldId: field.id,
            value: allFiles.length > 0 ? JSON.stringify(allFiles) : null,
          };
        }
        return {
          fieldId: field.id,
          value: fieldValues[field.id] || null,
        };
      });

      await saveMutation.mutateAsync({ fields: fieldsToSave });
      storage.setHasPendingCustomFields(false);
      toast.success("Perfil configurado com sucesso!");
      navigate("/dashboard");
    } catch (err) {
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Erro ao salvar informações";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    const hasRequiredFields = fields.some((f) => f.isRequired);
    if (hasRequiredFields) {
      toast.warning("Você precisa preencher os campos obrigatórios");
      return;
    }
    storage.setHasPendingCustomFields(false);
    navigate("/dashboard");
  };

  const renderField = (field: CustomFieldWithValue) => {
    const value = fieldValues[field.id] || "";
    const error = fieldErrors[field.id];

    switch (field.type) {
      case FIELD_TYPES.SELECT:
        if (field.allowMultiple) {
          // Múltipla seleção - renderiza checkboxes
          const selectedValues: string[] = value
            ? (() => {
                try {
                  return JSON.parse(value);
                } catch {
                  return [];
                }
              })()
            : [];

          const handleMultipleChange = (opt: string, checked: boolean) => {
            let newValues: string[];
            if (checked) {
              newValues = [...selectedValues, opt];
            } else {
              newValues = selectedValues.filter((v) => v !== opt);
            }
            handleFieldChange(field.id, JSON.stringify(newValues));
          };

          return (
            <div key={field.id} className={styles.fieldWrapper}>
              <label className={styles.fieldLabel}>
                {field.label}
                {field.isRequired && " *"}
              </label>
              <div
                className={`${styles.checkboxGroupOptions} ${error ? styles.checkboxGroupOptionsError : ""}`}
              >
                {(field.options || []).map((opt) => (
                  <label key={opt} className={styles.checkboxWrapper}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      checked={selectedValues.includes(opt)}
                      onChange={(e) => handleMultipleChange(opt, e.target.checked)}
                      disabled={saveMutation.isPending || isUploading}
                    />
                    <span className={styles.checkboxLabel}>{opt}</span>
                  </label>
                ))}
              </div>
              {field.helpText && <p className={styles.fieldHelpText}>{field.helpText}</p>}
              {error && <p className={styles.fieldError}>{error}</p>}
            </div>
          );
        }

        // Seleção única - renderiza select normal
        return (
          <Select
            key={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            label={`${field.label}${field.isRequired ? " *" : ""}`}
            error={error}
            fullWidth
            disabled={saveMutation.isPending || isUploading}
            options={(field.options || []).map((opt) => ({
              value: opt,
              label: opt,
            }))}
            placeholder={field.placeholder || `Selecione ${field.label}`}
          />
        );

      case FIELD_TYPES.TEXTAREA:
        return (
          <div key={field.id} className={`${styles.fieldWrapper} ${styles.fullWidthField}`}>
            <label className={styles.fieldLabel}>
              {field.label}
              {field.isRequired && " *"}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder || ""}
              disabled={saveMutation.isPending || isUploading}
              className={`${styles.textarea} ${error ? styles.textareaError : ""}`}
            />
            {field.helpText && <p className={styles.fieldHelpText}>{field.helpText}</p>}
            {error && <p className={styles.fieldError}>{error}</p>}
          </div>
        );

      case FIELD_TYPES.CHECKBOX:
        return (
          <div key={field.id} className={styles.fieldWrapper}>
            <label
              className={`${styles.checkboxWrapper} ${error ? styles.checkboxWrapperError : ""}`}
            >
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={value === "true"}
                onChange={(e) => handleFieldChange(field.id, e.target.checked ? "true" : "")}
                disabled={saveMutation.isPending || isUploading}
              />
              <span className={styles.checkboxLabel}>
                {field.label}
                {field.isRequired && " *"}
              </span>
            </label>
            {field.helpText && <p className={styles.fieldHelpText}>{field.helpText}</p>}
            {error && <p className={styles.fieldError}>{error}</p>}
          </div>
        );

      case FIELD_TYPES.FILE:
        return (
          <div key={field.id} className={`${styles.fieldWrapper} ${styles.fullWidthField}`}>
            <FileUploadLocal
              label={field.label}
              required={field.isRequired}
              maxFileSize={field.fileConfig?.maxFileSize || 5}
              maxFiles={field.fileConfig?.maxFiles || 1}
              allowedTypes={field.fileConfig?.allowedTypes || []}
              value={fieldFiles[field.id] || []}
              existingFiles={existingFieldFiles[field.id] || []}
              onChange={(files) => handleFileChange(field.id, files)}
              onRemoveExisting={(file) => handleRemoveExistingFile(field.id, file)}
              disabled={saveMutation.isPending || isUploading}
              error={error}
            />
            {field.helpText && <p className={styles.fieldHelpText}>{field.helpText}</p>}
          </div>
        );

      default:
        return (
          <Input
            key={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            type={
              field.type === FIELD_TYPES.NUMBER
                ? "number"
                : field.type === FIELD_TYPES.DATE
                  ? "date"
                  : field.type === FIELD_TYPES.EMAIL
                    ? "email"
                    : field.type === FIELD_TYPES.PHONE
                      ? "tel"
                      : "text"
            }
            label={`${field.label}${field.isRequired ? " *" : ""}`}
            placeholder={field.placeholder || ""}
            error={error}
            fullWidth
            disabled={saveMutation.isPending || isUploading}
          />
        );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <Logo variant="primary" size="medium" />
            </div>
            <Skeleton height="2rem" width="60%" />
            <Skeleton height="1rem" width="80%" />
          </div>
          <div className={styles.form}>
            <Skeleton height="3rem" width="100%" />
            <Skeleton height="3rem" width="100%" />
            <Skeleton height="3rem" width="100%" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <Logo variant="primary" size="medium" />
            </div>
          </div>
          <div className={styles.stateContainer}>
            <div className={`${styles.stateIconWrapper} ${styles.stateIconError}`}>
              <AlertCircle size={40} />
            </div>
            <h1 className={styles.stateTitle}>Erro ao carregar</h1>
            <p className={styles.stateDescription}>
              Não foi possível carregar as informações do seu perfil. Verifique sua conexão e tente
              novamente.
            </p>
            <div className={styles.stateActions}>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw size={16} />
                Tentar novamente
              </Button>
              <Button onClick={() => navigate("/dashboard")}>Ir para o Dashboard</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No fields state
  if (fields.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <Logo variant="primary" size="medium" />
            </div>
          </div>
          <div className={styles.stateContainer}>
            <div className={`${styles.stateIconWrapper} ${styles.stateIconSuccess}`}>
              <CheckCircle2 size={40} />
            </div>
            <h1 className={styles.stateTitle}>Tudo pronto!</h1>
            <p className={styles.stateDescription}>
              Seu perfil está completo. Não há informações adicionais para preencher no momento.
            </p>
            <div className={styles.stateActions}>
              <Button onClick={() => navigate("/dashboard")}>Ir para o Dashboard</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasRequiredFields = fields.some((f) => f.isRequired);
  const hasMultipleGroups = Object.keys(fieldGroups).length > 1;
  const isBusy = saveMutation.isPending || isUploading;

  const groupConfig = {
    personal: {
      title: "Informações Gerais",
      icon: <User size={16} />,
    },
    documents: {
      title: "Arquivos",
      icon: <FileText size={16} />,
    },
    other: {
      title: "Informações Adicionais",
      icon: <FileText size={16} />,
    },
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Logo variant="primary" size="medium" />
          </div>
          <h1 className={styles.title}>Complete seu Perfil</h1>
          <p className={styles.subtitle}>Preencha as informações para finalizar seu cadastro.</p>
        </div>

        {progress.total > 0 && (
          <div className={styles.progressSection}>
            <ProgressBar completedFields={progress.completed} totalFields={progress.total} />
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {hasMultipleGroups ? (
            Object.entries(fieldGroups).map(([groupKey, groupFields]) => {
              const config = groupConfig[groupKey as keyof typeof groupConfig];
              const requiredInGroup = groupFields.filter((f) => f.isRequired).length;
              const completedRequiredInGroup = groupFields.filter((f) => {
                if (!f.isRequired) return false;
                if (f.type === FIELD_TYPES.FILE) {
                  const hasNewFiles = fieldFiles[f.id]?.length > 0;
                  const hasExistingFiles = existingFieldFiles[f.id]?.length > 0;
                  return hasNewFiles || hasExistingFiles;
                }
                if (f.type === FIELD_TYPES.SELECT && f.allowMultiple) {
                  const value = fieldValues[f.id];
                  if (!value) return false;
                  try {
                    const selectedValues = JSON.parse(value) as string[];
                    return selectedValues.length > 0;
                  } catch {
                    return false;
                  }
                }
                return fieldValues[f.id]?.trim();
              }).length;
              const optionalInGroup = groupFields.filter((f) => !f.isRequired).length;
              const completedOptionalInGroup = groupFields.filter((f) => {
                if (f.isRequired) return false;
                if (f.type === FIELD_TYPES.FILE) {
                  const hasNewFiles = fieldFiles[f.id]?.length > 0;
                  const hasExistingFiles = existingFieldFiles[f.id]?.length > 0;
                  return hasNewFiles || hasExistingFiles;
                }
                if (f.type === FIELD_TYPES.SELECT && f.allowMultiple) {
                  const value = fieldValues[f.id];
                  if (!value) return false;
                  try {
                    const selectedValues = JSON.parse(value) as string[];
                    return selectedValues.length > 0;
                  } catch {
                    return false;
                  }
                }
                return fieldValues[f.id]?.trim();
              }).length;

              return (
                <FormSection
                  key={groupKey}
                  title={config.title}
                  icon={config.icon}
                  requiredFields={requiredInGroup}
                  completedFields={completedRequiredInGroup}
                  optionalFields={optionalInGroup}
                  completedOptionalFields={completedOptionalInGroup}
                  defaultExpanded={true}
                  collapsible={true}
                >
                  {groupFields.map((field) => renderField(field))}
                </FormSection>
              );
            })
          ) : (
            <div className={styles.formSection}>{fields.map((field) => renderField(field))}</div>
          )}

          <div className={styles.actions}>
            {!hasRequiredFields && (
              <Button type="button" variant="outline" onClick={handleSkip} disabled={isBusy}>
                Pular
              </Button>
            )}

            <Button type="submit" loading={isBusy}>
              {isUploading
                ? "Enviando arquivos..."
                : saveMutation.isPending
                  ? "Salvando..."
                  : "Salvar e Continuar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
