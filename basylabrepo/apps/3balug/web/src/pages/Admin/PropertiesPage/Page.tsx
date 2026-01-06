import { Building2, Edit, Eye, Plus, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/Button/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { Input } from "@/components/Input/Input";
import { Select } from "@/components/Select/Select";
import { Skeleton } from "@/components/Skeleton/Skeleton";
import { AdminLayout } from "@/layouts/AdminLayout/AdminLayout";
import { useDeletePropertyMutation } from "@/queries/properties/useDeletePropertyMutation";
import { usePropertiesQuery } from "@/queries/properties/usePropertiesQuery";
import { usePropertyQuery } from "@/queries/properties/usePropertyQuery";
import type { ListingType, Property, PropertyStatus, PropertyType } from "@/types/property.types";
import { CreatePropertyModal } from "./components/CreatePropertyModal/CreatePropertyModal";
import { EditPropertyModal } from "./components/EditPropertyModal/EditPropertyModal";
import * as styles from "./styles.css";

const propertyTypeLabels: Record<PropertyType, string> = {
  house: "Casa",
  apartment: "Apartamento",
  land: "Terreno",
  commercial: "Comercial",
  rural: "Rural",
};

const listingTypeLabels: Record<ListingType, string> = {
  rent: "Locacao",
  sale: "Venda",
  both: "Ambos",
};

const statusLabels: Record<PropertyStatus, string> = {
  available: "Disponivel",
  rented: "Alugado",
  sold: "Vendido",
  maintenance: "Manutencao",
  unavailable: "Indisponivel",
};

const getTypeBadgeClass = (type: PropertyType) => {
  const classes: Record<PropertyType, string> = {
    house: styles.badgeHouse,
    apartment: styles.badgeApartment,
    land: styles.badgeLand,
    commercial: styles.badgeCommercial,
    rural: styles.badgeRural,
  };
  return classes[type];
};

const getListingTypeBadgeClass = (listingType: ListingType) => {
  const classes: Record<ListingType, string> = {
    rent: styles.badgeRent,
    sale: styles.badgeSale,
    both: styles.badgeBoth,
  };
  return classes[listingType];
};

const getStatusBadgeClass = (status: PropertyStatus) => {
  const classes: Record<PropertyStatus, string> = {
    available: styles.badgeAvailable,
    rented: styles.badgeRented,
    sold: styles.badgeSold,
    maintenance: styles.badgeMaintenance,
    unavailable: styles.badgeUnavailable,
  };
  return classes[status];
};

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
};

const typeOptions = [
  { value: "", label: "Todos" },
  { value: "house", label: "Casa" },
  { value: "apartment", label: "Apartamento" },
  { value: "land", label: "Terreno" },
  { value: "commercial", label: "Comercial" },
  { value: "rural", label: "Rural" },
];

const listingTypeFilterOptions = [
  { value: "", label: "Todas" },
  { value: "rent", label: "Locacao" },
  { value: "sale", label: "Venda" },
  { value: "both", label: "Ambos" },
];

const statusOptions = [
  { value: "", label: "Todos" },
  { value: "available", label: "Disponivel" },
  { value: "rented", label: "Alugado" },
  { value: "sold", label: "Vendido" },
  { value: "maintenance", label: "Manutencao" },
  { value: "unavailable", label: "Indisponivel" },
];

export function PropertiesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const limit = 20;

  // Extrair estados da URL ao invés de useState
  const search = searchParams.get("search") || "";
  const typeFilter = (searchParams.get("type") || "") as PropertyType | "";
  const statusFilter = (searchParams.get("status") || "") as PropertyStatus | "";
  const listingTypeFilter = (searchParams.get("listingType") || "") as ListingType | "";
  const page = Number(searchParams.get("page")) || 1;

  const modalAction = searchParams.get("modal");
  const editId = searchParams.get("id");

  const isCreateModalOpen = modalAction === "create";
  const isEditModalOpen = modalAction === "edit" && !!editId;
  const isDeleteDialogOpen = modalAction === "delete" && !!editId;

  const { data, isLoading, error } = usePropertiesQuery({
    search: search || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    listingType: listingTypeFilter || undefined,
    page,
    limit,
  });

  const { data: editPropertyData } = usePropertyQuery(editId || "", {
    enabled: isEditModalOpen,
  });

  const deleteMutation = useDeletePropertyMutation();

  // Derivar propertyToDelete dos dados ao invés de useState
  const propertyToDelete = data?.data.find((p) => p.id === editId);

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

  const openEditModal = (property: Property) => {
    updateSearchParams({ modal: "edit", id: property.id });
  };

  const openDeleteDialog = (property: Property) => {
    updateSearchParams({ modal: "delete", id: property.id });
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

  return (
    <AdminLayout>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrapper}>
          <h2 className={styles.sectionTitle}>Imoveis</h2>
          <p className={styles.sectionDescription}>
            {data?.total || 0} {data?.total === 1 ? "imovel cadastrado" : "imoveis cadastrados"}
          </p>
        </div>
        <Button onClick={openCreateModal} variant="primary">
          <Plus size={20} />
          Adicionar Imovel
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
              placeholder="Buscar por titulo, endereco..."
              fullWidth
            />
          </div>
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Tipo</label>
            <Select
              value={typeFilter}
              onChange={(e) => {
                updateSearchParams({ type: e.target.value, page: "1" });
              }}
              options={typeOptions}
              fullWidth
            />
          </div>
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Finalidade</label>
            <Select
              value={listingTypeFilter}
              onChange={(e) => {
                updateSearchParams({ listingType: e.target.value, page: "1" });
              }}
              options={listingTypeFilterOptions}
              fullWidth
            />
          </div>
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Status</label>
            <Select
              value={statusFilter}
              onChange={(e) => {
                updateSearchParams({ status: e.target.value, page: "1" });
              }}
              options={statusOptions}
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
          icon={Building2}
          title="Erro ao carregar imoveis"
          description="Nao foi possivel carregar os imoveis. Tente novamente."
        />
      )}

      {!isLoading && !error && data && data.data.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Nenhum imovel cadastrado"
          description="Adicione imoveis para comecar a gerenciar seu portfolio."
          action={{
            label: "Adicionar Primeiro Imovel",
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
                  <th className={styles.tableHeaderCell}>Imovel</th>
                  <th className={styles.tableHeaderCell}>Tipo</th>
                  <th className={styles.tableHeaderCell}>Finalidade</th>
                  <th className={styles.tableHeaderCell}>Status</th>
                  <th className={styles.tableHeaderCell}>Valores</th>
                  <th className={styles.tableHeaderCell}>Caracteristicas</th>
                  <th className={styles.tableHeaderCell}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((property) => (
                  <tr key={property.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <div className={styles.propertyInfo}>
                        <span className={styles.propertyTitle}>{property.title}</span>
                        <span className={styles.propertyAddress}>
                          {property.city && property.state
                            ? `${property.city}/${property.state}`
                            : property.city || property.state || "-"}
                        </span>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={`${styles.badge} ${getTypeBadgeClass(property.type)}`}>
                        {propertyTypeLabels[property.type]}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <span
                        className={`${styles.badge} ${getListingTypeBadgeClass(property.listingType)}`}
                      >
                        {listingTypeLabels[property.listingType]}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={`${styles.badge} ${getStatusBadgeClass(property.status)}`}>
                        {statusLabels[property.status]}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.priceInfo}>
                        {(property.listingType === "rent" || property.listingType === "both") &&
                          property.rentalPrice && (
                            <div>
                              <span className={styles.priceLabel}>Aluguel: </span>
                              <span className={styles.priceValue}>
                                {formatCurrency(property.rentalPrice)}
                              </span>
                            </div>
                          )}
                        {(property.listingType === "sale" || property.listingType === "both") &&
                          property.salePrice && (
                            <div>
                              <span className={styles.priceLabel}>Venda: </span>
                              <span className={styles.priceValue}>
                                {formatCurrency(property.salePrice)}
                              </span>
                            </div>
                          )}
                        {!property.rentalPrice && !property.salePrice && "-"}
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.propertyInfo}>
                        <span>
                          {property.bedrooms ?? 0} quartos | {property.bathrooms ?? 0} banheiros
                        </span>
                        <span className={styles.propertyAddress}>
                          {property.area ? `${property.area}m2` : "-"}
                        </span>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => navigate(`/properties/${property.id}`)}
                          title="Ver detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => openEditModal(property)}
                          title="Editar imovel"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                          onClick={() => openDeleteDialog(property)}
                          title="Excluir imovel"
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
                {data.total} imoveis
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

      <CreatePropertyModal isOpen={isCreateModalOpen} onClose={closeModal} />

      <EditPropertyModal
        isOpen={isEditModalOpen}
        onClose={closeModal}
        property={editPropertyData || null}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen && !!propertyToDelete}
        onClose={closeModal}
        onConfirm={handleConfirmDelete}
        title="Excluir Imovel"
        description={`Tem certeza que deseja excluir <strong>${propertyToDelete?.title || ""}</strong>? Esta acao nao pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </AdminLayout>
  );
}
