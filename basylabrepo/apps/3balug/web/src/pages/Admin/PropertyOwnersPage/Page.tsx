import { Edit, Eye, Plus, Trash2, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/Button/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { Input } from "@/components/Input/Input";
import { Skeleton } from "@/components/Skeleton/Skeleton";
import { AdminLayout } from "@/layouts/AdminLayout/AdminLayout";
import { useDeletePropertyOwnerMutation } from "@/queries/property-owners/useDeletePropertyOwnerMutation";
import { usePropertyOwnerQuery } from "@/queries/property-owners/usePropertyOwnerQuery";
import { usePropertyOwnersQuery } from "@/queries/property-owners/usePropertyOwnersQuery";
import type { PropertyOwner } from "@/types/property-owner.types";
import { CreatePropertyOwnerModal } from "./components/CreatePropertyOwnerModal/CreatePropertyOwnerModal";
import { EditPropertyOwnerModal } from "./components/EditPropertyOwnerModal/EditPropertyOwnerModal";
import { ViewPropertyOwnerModal } from "./components/ViewPropertyOwnerModal/ViewPropertyOwnerModal";
import * as styles from "./styles.css";

export function PropertyOwnersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const limit = 20;

  // Extrair estados da URL
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;

  const modalAction = searchParams.get("modal");
  const editId = searchParams.get("id");

  const isCreateModalOpen = modalAction === "create";
  const isViewModalOpen = modalAction === "view" && !!editId;
  const isEditModalOpen = modalAction === "edit" && !!editId;
  const isDeleteDialogOpen = modalAction === "delete" && !!editId;

  const { data, isLoading, error } = usePropertyOwnersQuery({
    search: search || undefined,
    page,
    limit,
  });

  const { data: editOwnerData, isLoading: isLoadingOwner } = usePropertyOwnerQuery(editId || "", {
    enabled: isViewModalOpen || isEditModalOpen,
  });

  const deleteMutation = useDeletePropertyOwnerMutation();

  // Derivar ownerToDelete dos dados
  const ownerToDelete = data?.data.find((o) => o.id === editId);

  const updateSearchParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    }
    setSearchParams(newParams);
  };

  const openCreateModal = () => {
    updateSearchParams({ modal: "create" });
  };

  const openViewModal = (owner: PropertyOwner) => {
    updateSearchParams({ modal: "view", id: owner.id });
  };

  const openEditModal = (owner: PropertyOwner) => {
    updateSearchParams({ modal: "edit", id: owner.id });
  };

  const openEditFromView = () => {
    if (editId) {
      updateSearchParams({ modal: "edit", id: editId });
    }
  };

  const openDeleteDialog = (owner: PropertyOwner) => {
    updateSearchParams({ modal: "delete", id: owner.id });
  };

  const closeModal = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("modal");
    newParams.delete("id");
    setSearchParams(newParams);
  };

  const handleConfirmDelete = async () => {
    if (!editId) return;

    try {
      await deleteMutation.mutateAsync(editId);
      closeModal();
    } catch {
      // Error is handled by the mutation
    }
  };

  const formatDocument = (doc: string, type: "cpf" | "cnpj") => {
    const digits = doc.replace(/\D/g, "");
    if (type === "cpf" && digits.length === 11) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }
    if (type === "cnpj" && digits.length === 14) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }
    return doc;
  };

  return (
    <AdminLayout>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrapper}>
          <h2 className={styles.sectionTitle}>Proprietarios</h2>
          <p className={styles.sectionDescription}>
            {data?.total || 0}{" "}
            {data?.total === 1 ? "proprietario cadastrado" : "proprietarios cadastrados"}
          </p>
        </div>
        <Button onClick={openCreateModal} variant="primary">
          <Plus size={20} />
          Adicionar Proprietario
        </Button>
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.filterRow}>
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Buscar</label>
            <Input
              value={search}
              onChange={(e) => {
                updateSearchParams({ search: e.target.value, page: "1" });
              }}
              placeholder="Buscar por nome, documento ou email..."
              fullWidth
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div>
          <div style={{ marginBottom: "8px" }}>
            <Skeleton width="100%" height="60px" />
          </div>
          <div style={{ marginBottom: "8px" }}>
            <Skeleton width="100%" height="60px" />
          </div>
          <Skeleton width="100%" height="60px" />
        </div>
      )}

      {error && (
        <EmptyState
          icon={Users}
          title="Erro ao carregar proprietarios"
          description="Nao foi possivel carregar os proprietarios. Tente novamente."
        />
      )}

      {!isLoading && !error && data && data.data.length === 0 && (
        <EmptyState
          icon={Users}
          title="Nenhum proprietario cadastrado"
          description="Adicione proprietarios para gerenciar seus imoveis."
          action={{
            label: "Adicionar Primeiro Proprietario",
            onClick: openCreateModal,
          }}
        />
      )}

      {!isLoading && !error && data && data.data.length > 0 && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th className={styles.tableHeaderCell}>Proprietario</th>
                  <th className={styles.tableHeaderCell}>Tipo</th>
                  <th className={styles.tableHeaderCell}>Contato</th>
                  <th className={styles.tableHeaderCell}>Cidade/UF</th>
                  <th className={styles.tableHeaderCell}>Data de Cadastro</th>
                  <th className={styles.tableHeaderCell}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((owner) => (
                  <tr key={owner.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <div className={styles.ownerInfo}>
                        <span className={styles.ownerName}>{owner.name}</span>
                        <span className={styles.ownerDocument}>
                          {formatDocument(owner.document, owner.documentType)}
                        </span>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <span
                        className={`${styles.badge} ${
                          owner.documentType === "cpf" ? styles.badgeCpf : styles.badgeCnpj
                        }`}
                      >
                        {owner.documentType.toUpperCase()}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.ownerInfo}>
                        <span style={{ color: owner.email ? "#111827" : "#9CA3AF" }}>
                          {owner.email || "-"}
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: owner.phone ? "#6B7280" : "#9CA3AF",
                          }}
                        >
                          {owner.phone || "-"}
                        </span>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <span style={{ color: owner.city ? "#111827" : "#9CA3AF" }}>
                        {owner.city && owner.state
                          ? `${owner.city}/${owner.state}`
                          : owner.city || owner.state || "-"}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      {new Date(owner.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => openViewModal(owner)}
                          title="Visualizar proprietario"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => openEditModal(owner)}
                          title="Editar proprietario"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                          onClick={() => openDeleteDialog(owner)}
                          title="Excluir proprietario"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, data.total)} de{" "}
                {data.total} proprietarios
              </div>
              <div className={styles.paginationButtons}>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => updateSearchParams({ page: String(Math.max(1, page - 1)) })}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() =>
                    updateSearchParams({
                      page: String(Math.min(data.totalPages, page + 1)),
                    })
                  }
                  disabled={page === data.totalPages}
                >
                  Proxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <CreatePropertyOwnerModal isOpen={isCreateModalOpen} onClose={closeModal} />

      <ViewPropertyOwnerModal
        isOpen={isViewModalOpen}
        onClose={closeModal}
        propertyOwner={editOwnerData || null}
        onEdit={openEditFromView}
        isLoading={isLoadingOwner}
      />

      <EditPropertyOwnerModal
        isOpen={isEditModalOpen}
        onClose={closeModal}
        propertyOwner={editOwnerData || null}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen && !!ownerToDelete}
        onClose={closeModal}
        onConfirm={handleConfirmDelete}
        title="Excluir Proprietario"
        description={`Tem certeza que deseja excluir <strong>${ownerToDelete?.name || ""}</strong>? Esta acao nao pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </AdminLayout>
  );
}
