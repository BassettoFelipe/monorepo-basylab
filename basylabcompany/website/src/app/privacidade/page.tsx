import type { Metadata } from "next";
import {
  LegalPageLayout,
  List,
  Highlight,
  ContactCard,
  type Section,
} from "@/components/LegalPageLayout";

// ============================================
// METADATA
// ============================================

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Saiba como a Basylab coleta, usa e protege seus dados pessoais. Transparência e segurança são prioridades para nós.",
  alternates: {
    canonical: "/privacidade",
  },
  openGraph: {
    title: "Política de Privacidade | Basylab",
    description:
      "Saiba como a Basylab coleta, usa e protege seus dados pessoais.",
    url: "/privacidade",
  },
};

// ============================================
// ICON
// ============================================

const ShieldIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

// ============================================
// SECTIONS CONTENT
// ============================================

const sections: Section[] = [
  {
    id: "introducao",
    title: "Introdução",
    content: (
      <>
        <p>
          A Basylab valoriza sua privacidade. Esta política explica de forma
          simples e direta como tratamos seus dados quando você visita nosso
          site ou entra em contato conosco.
        </p>
        <Highlight title="Nosso compromisso">
          Seguimos a Lei Geral de Proteção de Dados (LGPD). Coletamos apenas o
          necessário e nunca vendemos seus dados.
        </Highlight>
      </>
    ),
  },
  {
    id: "dados-coletados",
    title: "Dados que coletamos",
    content: (
      <>
        <p>
          <strong>Quando você entra em contato:</strong>
        </p>
        <List
          items={[
            "Nome e e-mail para responder sua mensagem",
            "Telefone, se você fornecer",
            "Informações sobre seu projeto para preparar uma proposta",
          ]}
        />
        <p>
          <strong>Automaticamente pelo site:</strong>
        </p>
        <List
          items={[
            "Páginas visitadas e tempo de navegação",
            "Tipo de navegador e dispositivo",
            "Cookies para melhorar sua experiência",
          ]}
        />
      </>
    ),
  },
  {
    id: "uso-dados",
    title: "Como usamos seus dados",
    content: (
      <>
        <p>Usamos suas informações para:</p>
        <List
          items={[
            "Responder suas mensagens e dúvidas",
            "Preparar propostas comerciais",
            "Melhorar nosso site com base em estatísticas de uso",
            "Cumprir obrigações legais quando necessário",
          ]}
        />
        <p>
          <strong>Não fazemos:</strong> venda de dados, spam ou compartilhamento
          para publicidade.
        </p>
      </>
    ),
  },
  {
    id: "compartilhamento",
    title: "Compartilhamento",
    content: (
      <>
        <p>Seus dados podem ser compartilhados apenas com:</p>
        <List
          items={[
            "Serviços essenciais (hospedagem, e-mail) que usamos para operar",
            "Autoridades públicas se exigido por lei",
          ]}
        />
        <p>
          Todos os serviços que usamos seguem padrões adequados de segurança.
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "Segurança",
    content: (
      <>
        <p>Protegemos seus dados com:</p>
        <List
          items={[
            "Conexão segura (HTTPS) em todo o site",
            "Acesso restrito apenas a quem precisa",
            "Servidores com certificações de segurança",
          ]}
        />
      </>
    ),
  },
  {
    id: "seus-direitos",
    title: "Seus direitos",
    content: (
      <>
        <p>Você pode a qualquer momento:</p>
        <List
          items={[
            "Pedir uma cópia dos seus dados",
            "Corrigir informações incorretas",
            "Solicitar a exclusão dos seus dados",
            "Revogar consentimentos dados anteriormente",
          ]}
        />
        <p>Para exercer qualquer direito, é só entrar em contato conosco.</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    content: (
      <>
        <p>
          Usamos cookies para entender como você navega no site e melhorar sua
          experiência. Você pode desativá-los nas configurações do seu
          navegador.
        </p>
      </>
    ),
  },
  {
    id: "contato",
    title: "Contato",
    content: (
      <>
        <p>Dúvidas sobre privacidade? Fale com a gente:</p>
        <ContactCard />
      </>
    ),
  },
];

// ============================================
// PAGE COMPONENT
// ============================================

export default function PrivacidadePage() {
  return (
    <LegalPageLayout
      title="Política de Privacidade"
      subtitle="Como cuidamos dos seus dados"
      icon={<ShieldIcon />}
      lastUpdated="08 de janeiro de 2026"
      version="1.0"
      sections={sections}
    />
  );
}
