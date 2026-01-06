import { Settings } from "lucide-react";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { AdminLayout } from "@/layouts/AdminLayout/AdminLayout";

export function SettingsPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Configurações"
        description="Gerencie suas preferências e configurações do sistema"
        icon={Settings}
      />

      <EmptyState
        icon={Settings}
        title="Configurações em desenvolvimento"
        description="Em breve você poderá personalizar o sistema, gerenciar permissões, configurar notificações e muito mais."
      />
    </AdminLayout>
  );
}
