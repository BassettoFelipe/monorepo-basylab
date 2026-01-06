import { Building2, Calendar, DollarSign, ExternalLink, FileText, User } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { Modal } from "@/components/Modal/Modal";
import { Skeleton } from "@/components/Skeleton/Skeleton";
import { useDocumentsQuery } from "@/queries/documents/documents.queries";
import type { Contract, ContractStatus } from "@/types/contract.types";
import { DOCUMENT_ENTITY_TYPES, DOCUMENT_TYPE_LABELS } from "@/types/document.types";
import * as styles from "../ViewContractModal.styles.css";

interface ViewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  onEdit?: () => void;
  isLoading?: boolean;
}

const statusLabels: Record<ContractStatus, string> = {
  active: "Ativo",
  terminated: "Encerrado",
  cancelled: "Cancelado",
  expired: "Expirado",
};

const getStatusClass = (status: ContractStatus) => {
  const classes: Record<ContractStatus, string> = {
    active: styles.badgeActive,
    terminated: styles.badgeTerminated,
    cancelled: styles.badgeCancelled,
    expired: styles.badgeExpired,
  };
  return classes[status];
};

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
          <Skeleton width={180} height={24} />
          <Skeleton width={80} height={24} borderRadius={12} />
        </div>
      </div>

      {/* Imovel skeleton */}
      <div className={styles.section}>
        <Skeleton width={80} height={16} />
        <div className={styles.infoItem}>
          <Skeleton width={18} height={18} borderRadius={4} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Skeleton width={60} height={12} />
            <Skeleton width={200} height={16} />
            <Skeleton width={150} height={14} />
          </div>
        </div>
      </div>

      {/* Inquilino skeleton */}
      <div className={styles.section}>
        <Skeleton width={100} height={16} />
        <div className={styles.infoItem}>
          <Skeleton width={18} height={18} borderRadius={4} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Skeleton width={60} height={12} />
            <Skeleton width={180} height={16} />
          </div>
        </div>
      </div>

      {/* Periodo skeleton */}
      <div className={styles.section}>
        <Skeleton width={80} height={16} />
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Skeleton width={18} height={18} borderRadius={4} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Skeleton width={100} height={12} />
              <Skeleton width={100} height={16} />
            </div>
          </div>
          <div className={styles.infoItem}>
            <Skeleton width={18} height={18} borderRadius={4} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Skeleton width={100} height={12} />
              <Skeleton width={100} height={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Valores skeleton */}
      <div className={styles.section}>
        <Skeleton width={80} height={16} />
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Skeleton width={18} height={18} borderRadius={4} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Skeleton width={120} height={12} />
              <Skeleton width={100} height={20} />
            </div>
          </div>
          <div className={styles.infoItem}>
            <Skeleton width={18} height={18} borderRadius={4} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Skeleton width={120} height={12} />
              <Skeleton width={60} height={16} />
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

export function ViewContractModal({
  isOpen,
  onClose,
  contract,
  onEdit,
  isLoading,
}: ViewContractModalProps) {
  const { data: documentsData } = useDocumentsQuery(
    DOCUMENT_ENTITY_TYPES.CONTRACT,
    contract?.id || "",
    { enabled: isOpen && !!contract?.id },
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const isImageFile = (mimeType: string) => {
    return mimeType.startsWith("image/");
  };

  const canEdit = contract?.status === "active";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes do Contrato"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {canEdit && onEdit && (
            <Button variant="primary" onClick={onEdit} disabled={isLoading}>
              Editar
            </Button>
          )}
        </>
      }
    >
      {isLoading || !contract ? (
        <ViewSkeleton />
      ) : (
        <div className={styles.container}>
          {/* Header com status */}
          <div className={styles.header}>
            <div className={styles.avatar}>
              <FileText size={32} />
            </div>
            <div className={styles.headerInfo}>
              <h2 className={styles.name}>Contrato de Locacao</h2>
              <div className={styles.badges}>
                <span className={`${styles.badge} ${getStatusClass(contract.status)}`}>
                  {statusLabels[contract.status]}
                </span>
              </div>
            </div>
          </div>

          {/* Imovel */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Imovel</h3>
            <div className={styles.infoItem}>
              <Building2 size={18} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Titulo</span>
                <span className={styles.infoValue}>{contract.property?.title || "-"}</span>
                {contract.property?.address && (
                  <span className={styles.infoSubValue}>
                    {contract.property.address}
                    {contract.property.city && contract.property.state && (
                      <>
                        {" "}
                        - {contract.property.city}/{contract.property.state}
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Inquilino */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Inquilino</h3>
            <div className={styles.infoItem}>
              <User size={18} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Nome</span>
                <span className={styles.infoValue}>{contract.tenant?.name || "-"}</span>
              </div>
            </div>
          </div>

          {/* Periodo do Contrato */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Periodo</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <Calendar size={18} className={styles.infoIcon} />
                <div>
                  <span className={styles.infoLabel}>Data de Inicio</span>
                  <span className={styles.infoValue}>{formatDate(contract.startDate)}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Calendar size={18} className={styles.infoIcon} />
                <div>
                  <span className={styles.infoLabel}>Data de Termino</span>
                  <span className={styles.infoValue}>{formatDate(contract.endDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Valores</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <DollarSign size={18} className={styles.infoIcon} />
                <div>
                  <span className={styles.infoLabel}>Valor do Aluguel</span>
                  <span className={styles.infoValueHighlight}>
                    {formatCurrency(contract.rentalAmount)}
                  </span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Calendar size={18} className={styles.infoIcon} />
                <div>
                  <span className={styles.infoLabel}>Dia de Vencimento</span>
                  <span className={styles.infoValue}>Dia {contract.paymentDay}</span>
                </div>
              </div>
              {contract.depositAmount && (
                <div className={styles.infoItem}>
                  <DollarSign size={18} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Caucao</span>
                    <span className={styles.infoValue}>
                      {formatCurrency(contract.depositAmount)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

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
          {contract.notes && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Observacoes</h3>
              <p className={styles.notes}>{contract.notes}</p>
            </div>
          )}

          {/* Encerramento */}
          {contract.status === "terminated" && contract.terminatedAt && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Encerramento</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <Calendar size={18} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Data de Encerramento</span>
                    <span className={styles.infoValue}>{formatDate(contract.terminatedAt)}</span>
                  </div>
                </div>
                {contract.terminationReason && (
                  <div className={styles.infoItem}>
                    <FileText size={18} className={styles.infoIcon} />
                    <div>
                      <span className={styles.infoLabel}>Motivo</span>
                      <span className={styles.infoValue}>{contract.terminationReason}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadados */}
          <div className={styles.metadata}>
            <span>Cadastrado em: {formatDate(contract.createdAt)}</span>
            {contract.updatedAt && <span>Atualizado em: {formatDate(contract.updatedAt)}</span>}
          </div>
        </div>
      )}
    </Modal>
  );
}
