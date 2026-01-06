import {
  Briefcase,
  Calendar,
  DollarSign,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/Button/Button";
import { Modal } from "@/components/Modal/Modal";
import { Skeleton } from "@/components/Skeleton/Skeleton";
import { useDocumentsQuery } from "@/queries/documents/documents.queries";
import { DOCUMENT_ENTITY_TYPES, DOCUMENT_TYPE_LABELS } from "@/types/document.types";
import type { Tenant } from "@/types/tenant.types";
import { applyMask } from "@/utils/masks";
import * as styles from "../ViewTenantModal.styles.css";

interface ViewTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onEdit?: () => void;
  isLoading?: boolean;
}

function ViewSkeleton() {
  return (
    <div className={styles.container}>
      {/* Header skeleton */}
      <div className={styles.header}>
        <Skeleton width={64} height={64} borderRadius="50%" />
        <div
          className={styles.headerInfo}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          <Skeleton width={200} height={24} />
          <Skeleton width={150} height={20} />
        </div>
      </div>

      {/* Contato skeleton */}
      <div className={styles.section}>
        <Skeleton width={100} height={16} />
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Skeleton width={18} height={18} borderRadius={4} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Skeleton width={80} height={12} />
              <Skeleton width={120} height={16} />
            </div>
          </div>
          <div className={styles.infoItem}>
            <Skeleton width={18} height={18} borderRadius={4} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Skeleton width={80} height={12} />
              <Skeleton width={180} height={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Endereco skeleton */}
      <div className={styles.section}>
        <Skeleton width={100} height={16} />
        <div className={styles.infoItem}>
          <Skeleton width={18} height={18} borderRadius={4} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Skeleton width={250} height={16} />
            <Skeleton width={180} height={16} />
          </div>
        </div>
      </div>

      {/* Informacoes Financeiras skeleton */}
      <div className={styles.section}>
        <Skeleton width={180} height={16} />
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Skeleton width={18} height={18} borderRadius={4} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Skeleton width={100} height={12} />
              <Skeleton width={120} height={16} />
            </div>
          </div>
          <div className={styles.infoItem}>
            <Skeleton width={18} height={18} borderRadius={4} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Skeleton width={100} height={12} />
              <Skeleton width={150} height={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Documentos skeleton */}
      <div className={styles.section}>
        <Skeleton width={120} height={16} />
        <div className={styles.documentsGrid}>
          <Skeleton width="100%" height={140} borderRadius={8} />
          <Skeleton width="100%" height={140} borderRadius={8} />
        </div>
      </div>

      {/* Metadata skeleton */}
      <div className={styles.metadata}>
        <Skeleton width={180} height={14} />
        <Skeleton width={180} height={14} />
      </div>
    </div>
  );
}

export function ViewTenantModal({
  isOpen,
  onClose,
  tenant,
  onEdit,
  isLoading,
}: ViewTenantModalProps) {
  const { data: documentsData } = useDocumentsQuery(
    DOCUMENT_ENTITY_TYPES.TENANT,
    tenant?.id || "",
    { enabled: isOpen && !!tenant?.id },
  );

  const formatCpf = (cpf: string) => {
    return applyMask(cpf, "cpf");
  };

  const formatPhone = (phone: string) => {
    return applyMask(phone, "phone");
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const isImageFile = (mimeType: string) => {
    return mimeType.startsWith("image/");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes do Inquilino"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {onEdit && (
            <Button variant="primary" onClick={onEdit} disabled={isLoading}>
              Editar
            </Button>
          )}
        </>
      }
    >
      {isLoading || !tenant ? (
        <ViewSkeleton />
      ) : (
        <div className={styles.container}>
          {/* Header com avatar e info principal */}
          <div className={styles.header}>
            <div className={styles.avatar}>
              <User size={32} />
            </div>
            <div className={styles.headerInfo}>
              <h2 className={styles.name}>{tenant.name}</h2>
              <div className={styles.badges}>
                <span className={styles.badge}>CPF</span>
                <span className={styles.document}>{formatCpf(tenant.cpf)}</span>
              </div>
            </div>
          </div>

          {/* Informacoes de contato */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Contato</h3>
            <div className={styles.infoGrid}>
              {tenant.phone && (
                <div className={styles.infoItem}>
                  <Phone size={18} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Telefone</span>
                    <span className={styles.infoValue}>{formatPhone(tenant.phone)}</span>
                  </div>
                </div>
              )}
              {tenant.email && (
                <div className={styles.infoItem}>
                  <Mail size={18} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue}>{tenant.email}</span>
                  </div>
                </div>
              )}
              {tenant.birthDate && (
                <div className={styles.infoItem}>
                  <Calendar size={18} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Data de Nascimento</span>
                    <span className={styles.infoValue}>{formatDate(tenant.birthDate)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Endereco */}
          {(tenant.address || tenant.city || tenant.state || tenant.zipCode) && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Endereco</h3>
              <div className={styles.infoItem}>
                <MapPin size={18} className={styles.infoIcon} />
                <div>
                  <span className={styles.infoValue}>
                    {tenant.address && (
                      <>
                        {tenant.address}
                        <br />
                      </>
                    )}
                    {tenant.city && tenant.state && (
                      <>
                        {tenant.city}/{tenant.state}
                      </>
                    )}
                    {tenant.zipCode && <> - CEP: {applyMask(tenant.zipCode, "cep")}</>}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Informacoes Financeiras */}
          {(tenant.monthlyIncome || tenant.employer) && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Informacoes Financeiras</h3>
              <div className={styles.infoGrid}>
                {tenant.monthlyIncome && (
                  <div className={styles.infoItem}>
                    <DollarSign size={18} className={styles.infoIcon} />
                    <div>
                      <span className={styles.infoLabel}>Renda Mensal</span>
                      <span className={styles.infoValue}>
                        {formatCurrency(tenant.monthlyIncome)}
                      </span>
                    </div>
                  </div>
                )}
                {tenant.employer && (
                  <div className={styles.infoItem}>
                    <Briefcase size={18} className={styles.infoIcon} />
                    <div>
                      <span className={styles.infoLabel}>Empregador</span>
                      <span className={styles.infoValue}>{tenant.employer}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contato de Emergencia */}
          {(tenant.emergencyContact || tenant.emergencyPhone) && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Contato de Emergencia</h3>
              <div className={styles.infoGrid}>
                {tenant.emergencyContact && (
                  <div className={styles.infoItem}>
                    <Users size={18} className={styles.infoIcon} />
                    <div>
                      <span className={styles.infoLabel}>Nome</span>
                      <span className={styles.infoValue}>{tenant.emergencyContact}</span>
                    </div>
                  </div>
                )}
                {tenant.emergencyPhone && (
                  <div className={styles.infoItem}>
                    <Phone size={18} className={styles.infoIcon} />
                    <div>
                      <span className={styles.infoLabel}>Telefone</span>
                      <span className={styles.infoValue}>{formatPhone(tenant.emergencyPhone)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documentos */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Documentos ({documentsData?.data?.length || 0})</h3>
            {documentsData?.data && documentsData.data.length > 0 ? (
              <div className={styles.documentsGrid}>
                {documentsData.data.map((doc) => (
                  <div key={doc.id} className={styles.documentCard}>
                    {isImageFile(doc.mimeType) ? (
                      <div className={styles.documentPreview}>
                        <img
                          src={doc.url}
                          alt={doc.originalName}
                          className={styles.documentImage}
                        />
                      </div>
                    ) : (
                      <div className={styles.documentIconWrapper}>
                        <FileText size={24} />
                      </div>
                    )}
                    <div className={styles.documentInfo}>
                      <span className={styles.documentName} title={doc.originalName}>
                        {doc.originalName}
                      </span>
                      <span className={styles.documentType}>
                        {DOCUMENT_TYPE_LABELS[
                          doc.documentType as keyof typeof DOCUMENT_TYPE_LABELS
                        ] || doc.documentType}
                      </span>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.documentLink}
                      title="Abrir documento"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>Nenhum documento anexado</p>
            )}
          </div>

          {/* Observacoes */}
          {tenant.notes && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Observacoes</h3>
              <p className={styles.notes}>{tenant.notes}</p>
            </div>
          )}

          {/* Metadados */}
          <div className={styles.metadata}>
            <span>Cadastrado em: {formatDate(tenant.createdAt)}</span>
            {tenant.updatedAt && <span>Atualizado em: {formatDate(tenant.updatedAt)}</span>}
          </div>
        </div>
      )}
    </Modal>
  );
}
