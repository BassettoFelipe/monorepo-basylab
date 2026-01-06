import { DollarSign, Link2, UserPlus, Users } from "lucide-react";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { StatCard } from "@/components/StatCard/StatCard";
import { AdminLayout } from "@/layouts/AdminLayout/AdminLayout";
import * as styles from "./styles.css";

export function AffiliatesPage() {
  const afiliadosStats = [
    {
      title: "Total de Afiliados",
      value: "0",
      icon: Users,
      color: "primary" as const,
    },
    {
      title: "Indicações Ativas",
      value: "0",
      icon: Link2,
      color: "info" as const,
    },
    {
      title: "Comissões do Mês",
      value: "R$ 0,00",
      icon: DollarSign,
      color: "success" as const,
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Programa de Afiliados"
        description="Gerencie seu programa de indicações"
        icon={UserPlus}
      />

      <div className={styles.statsGrid}>
        {afiliadosStats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <EmptyState
        icon={UserPlus}
        title="Programa de afiliados em breve"
        description="Crie um programa de indicações, gere links personalizados e acompanhe as comissões dos seus afiliados."
      />
    </AdminLayout>
  );
}
