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
  title: "Termos de Uso",
  description:
    "Termos e condições de uso do site da Basylab. Simples e direto ao ponto.",
  alternates: {
    canonical: "/termos",
  },
  openGraph: {
    title: "Termos de Uso | Basylab",
    description: "Termos e condições de uso do site da Basylab.",
    url: "/termos",
  },
};

// ============================================
// ICON
// ============================================

const DocumentIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

// ============================================
// SECTIONS CONTENT
// ============================================

const sections: Section[] = [
  {
    id: "sobre",
    title: "Sobre estes termos",
    content: (
      <>
        <p>
          Estes termos explicam as regras básicas para usar nosso site. Ao
          navegar aqui, você concorda com elas. É simples: use o site de forma
          responsável e respeitosa.
        </p>
      </>
    ),
  },
  {
    id: "servicos",
    title: "O que fazemos",
    content: (
      <>
        <p>A Basylab desenvolve software sob medida:</p>
        <List
          items={[
            "Sistemas web e plataformas digitais",
            "Aplicativos mobile",
            "Automações e integrações",
          ]}
        />
        <p>
          A contratação de serviços é feita através de propostas e contratos
          específicos, separados destes termos.
        </p>
      </>
    ),
  },
  {
    id: "uso-site",
    title: "Uso do site",
    content: (
      <>
        <p>Pedimos apenas bom senso:</p>
        <List
          items={[
            "Forneça informações verdadeiras ao entrar em contato",
            "Não tente acessar áreas restritas do site",
            "Não sobrecarregue nossos servidores de propósito",
          ]}
        />
      </>
    ),
  },
  {
    id: "propriedade",
    title: "Conteúdo e marca",
    content: (
      <>
        <p>
          O conteúdo do site (textos, imagens, design, código) pertence à
          Basylab. Você pode:
        </p>
        <List
          items={[
            "Navegar e compartilhar links do site",
            "Imprimir páginas para uso pessoal",
          ]}
        />
        <p>
          Para usar nossa marca ou conteúdo de outras formas, fale conosco
          antes.
        </p>
      </>
    ),
  },
  {
    id: "projetos",
    title: "Sobre projetos",
    content: (
      <>
        <p>
          A propriedade do código desenvolvido para clientes é definida no
          contrato de cada projeto. Em geral, após a conclusão e pagamento, o
          código específico do seu projeto é seu.
        </p>
        <Highlight title="Portfólio">
          Podemos mencionar a existência do projeto em nosso portfólio, a menos
          que você prefira confidencialidade.
        </Highlight>
      </>
    ),
  },
  {
    id: "responsabilidade",
    title: "Informações do site",
    content: (
      <>
        <p>
          As informações no site têm caráter informativo e podem mudar. Para
          decisões comerciais, entre em contato para informações atualizadas.
        </p>
        <p>
          Links para sites externos são apenas referências. Não nos
          responsabilizamos pelo conteúdo de terceiros.
        </p>
      </>
    ),
  },
  {
    id: "alteracoes",
    title: "Alterações",
    content: (
      <>
        <p>
          Podemos atualizar estes termos ocasionalmente. A data no início da
          página indica quando foi a última atualização.
        </p>
      </>
    ),
  },
  {
    id: "legislacao",
    title: "Legislação",
    content: (
      <>
        <p>
          Estes termos seguem a legislação brasileira. Em caso de dúvidas ou
          problemas, preferimos sempre resolver de forma amigável através de
          conversa direta.
        </p>
      </>
    ),
  },
  {
    id: "contato",
    title: "Contato",
    content: (
      <>
        <p>Dúvidas sobre estes termos? Fale com a gente:</p>
        <ContactCard />
      </>
    ),
  },
];

// ============================================
// PAGE COMPONENT
// ============================================

export default function TermosPage() {
  return (
    <LegalPageLayout
      title="Termos de Uso"
      subtitle="Regras simples para usar nosso site"
      icon={<DocumentIcon />}
      lastUpdated="08 de janeiro de 2026"
      version="1.0"
      sections={sections}
    />
  );
}
