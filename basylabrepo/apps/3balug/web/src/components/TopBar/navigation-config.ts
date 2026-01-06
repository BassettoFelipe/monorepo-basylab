import {
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Filter,
  KeyRound,
  Search,
  Settings,
  Shield,
  Store,
  TrendingUp,
  User,
  UserCheck,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number }>;
  badge?: string;
}

export interface NavGroup {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    icon: Building2,
    label: "Imóveis",
    items: [
      {
        label: "Imóveis",
        path: "/properties",
        icon: Building2,
      },
      {
        label: "Contratos",
        path: "/contracts",
        icon: FileText,
      },
      {
        label: "Proprietários",
        path: "/property-owners",
        icon: KeyRound,
      },
      {
        label: "Inquilinos",
        path: "/tenants",
        icon: UserCheck,
      },
      {
        label: "Gestão de Imóveis",
        path: "/property-management",
        icon: Settings,
        badge: "Em breve",
      },
    ],
  },
  {
    icon: UserPlus,
    label: "Leads",
    items: [
      {
        label: "Novo Cliente",
        path: "/clients/new",
        icon: UserPlus,
        badge: "Em breve",
      },
      {
        label: "Clientes",
        path: "/clients",
        icon: Users,
        badge: "Em breve",
      },
      {
        label: "Agenda",
        path: "/schedule",
        icon: Calendar,
        badge: "Em breve",
      },
      {
        label: "Funil",
        path: "/funnel",
        icon: Filter,
        badge: "Em breve",
      },
      {
        label: "Consultar",
        path: "/serasa/consult",
        icon: Search,
        badge: "Em breve",
      },
      {
        label: "Histórico de Consultas",
        path: "/serasa/history",
        icon: FileText,
        badge: "Em breve",
      },
      {
        label: "Crédito",
        path: "/serasa/credit",
        icon: CreditCard,
        badge: "Em breve",
      },
    ],
  },
  {
    icon: TrendingUp,
    label: "Gestão Imobiliária",
    items: [
      {
        label: "Cadastrar Corretor/Gerente",
        path: "/team/new",
        icon: UserPlus,
        badge: "Em breve",
      },
      {
        label: "Equipes",
        path: "/team",
        icon: UsersRound,
      },
      {
        label: "BI Imóveis",
        path: "/bi/properties",
        icon: BarChart3,
        badge: "Em breve",
      },
      {
        label: "Financeiro",
        path: "/finance",
        icon: DollarSign,
        badge: "Em breve",
      },
      {
        label: "Contratos",
        path: "/contracts",
        icon: FileText,
      },
    ],
  },
  {
    icon: DollarSign,
    label: "Financeiro",
    items: [
      {
        label: "Faturamento",
        path: "/billing",
        icon: DollarSign,
        badge: "Em breve",
      },
      {
        label: "BI Financeiro",
        path: "/bi/finance",
        icon: BarChart3,
        badge: "Em breve",
      },
    ],
  },
  {
    icon: Shield,
    label: "Seguros",
    items: [
      {
        label: "Análises",
        path: "/insurance/analysis",
        icon: FileText,
        badge: "Em breve",
      },
      {
        label: "Imóveis Segurados",
        path: "/insurance",
        icon: Shield,
        badge: "Em breve",
      },
    ],
  },
  {
    icon: Store,
    label: "3BA",
    items: [
      {
        label: "Seja um Afiliado",
        path: "/affiliates",
        icon: UserPlus,
        badge: "Em breve",
      },
    ],
  },
  {
    icon: Settings,
    label: "Configuração",
    items: [
      {
        label: "Clientes",
        path: "/settings/clients",
        icon: Users,
        badge: "Em breve",
      },
      {
        label: "Perfil",
        path: "/profile",
        icon: User,
      },
      {
        label: "Acessos",
        path: "/settings/access",
        icon: Settings,
        badge: "Em breve",
      },
      {
        label: "Dados",
        path: "/settings",
        icon: FileText,
      },
    ],
  },
];

// Mapa simples: rota -> grupo
export const routeToGroup: Record<string, string> = {
  "/properties": "Imóveis",
  "/contracts": "Imóveis",
  "/property-owners": "Imóveis",
  "/tenants": "Imóveis",
  "/property-management": "Imóveis",
  "/clients/new": "Leads",
  "/clients": "Leads",
  "/schedule": "Leads",
  "/funnel": "Leads",
  "/serasa/consult": "Leads",
  "/serasa/history": "Leads",
  "/serasa/credit": "Leads",
  "/team/new": "Gestão Imobiliária",
  "/team": "Gestão Imobiliária",
  "/bi/properties": "Gestão Imobiliária",
  "/finance": "Gestão Imobiliária",
  "/billing": "Financeiro",
  "/bi/finance": "Financeiro",
  "/insurance/analysis": "Seguros",
  "/insurance": "Seguros",
  "/affiliates": "3BA",
  "/settings/clients": "Configuração",
  "/profile": "Configuração",
  "/settings/access": "Configuração",
  "/settings": "Configuração",
};

export const getActiveRoute = (pathname: string): string => {
  const cleanPath = pathname.split("?")[0].split("#")[0];
  return Object.keys(routeToGroup).find((route) => cleanPath.startsWith(route)) || "";
};

export const getActiveGroup = (pathname: string): string => {
  const activeRoute = getActiveRoute(pathname);
  return routeToGroup[activeRoute] || "";
};
