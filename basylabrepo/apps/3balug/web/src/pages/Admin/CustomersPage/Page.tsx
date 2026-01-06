import { UserPlus, Users } from "lucide-react";
import { toast } from "react-toastify";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { AdminLayout } from "@/layouts/AdminLayout/AdminLayout";

export function CustomersPage() {
  const handleAddCustomer = () => {
    toast.info("Em breve você poderá cadastrar clientes por aqui.");
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Clientes"
        description="Gerencie proprietários e locatários"
        icon={Users}
        action={{
          label: "Adicionar Cliente",
          onClick: handleAddCustomer,
          icon: UserPlus,
        }}
      />

      <EmptyState
        icon={Users}
        title="Nenhum cliente cadastrado"
        description="Adicione proprietários e locatários ao sistema. Você poderá gerenciar documentos, histórico e informações de contato."
        action={{
          label: "Adicionar Primeiro Cliente",
          onClick: handleAddCustomer,
        }}
      />
    </AdminLayout>
  );
}
