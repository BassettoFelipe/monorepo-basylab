export function JsonLd() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://basylab.com.br/#organization",
    name: "Basylab",
    alternateName: "Basylab Desenvolvimento de Software",
    url: "https://basylab.com.br",
    logo: {
      "@type": "ImageObject",
      url: "https://basylab.com.br/images/logo-dark.png",
      width: 320,
      height: 107,
    },
    image: "https://basylab.com.br/og-image.png",
    description:
      "Desenvolvimento de software sob medida: sistemas web, aplicativos mobile e automações. Código limpo, prazos respeitados e qualidade técnica garantida.",
    email: "contato@basylab.com.br",
    telephone: "+55-14-99622-3121",
    address: {
      "@type": "PostalAddress",
      addressCountry: "BR",
      addressLocality: "Brasil",
    },
    sameAs: [
      "https://github.com/basylab",
      "https://www.instagram.com/basy.lab/",
    ],
    foundingDate: "2023",
    numberOfEmployees: {
      "@type": "QuantitativeValue",
      minValue: 1,
      maxValue: 10,
    },
    slogan: "Chega de software medíocre.",
    knowsAbout: [
      "Desenvolvimento Web",
      "Desenvolvimento Mobile",
      "React",
      "Next.js",
      "TypeScript",
      "Node.js",
      "Automação de Processos",
      "APIs REST",
      "Integrações de Sistemas",
    ],
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": "https://basylab.com.br/#localbusiness",
    name: "Basylab",
    image: "https://basylab.com.br/og-image.png",
    url: "https://basylab.com.br",
    telephone: "+55-14-99622-3121",
    email: "contato@basylab.com.br",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressCountry: "BR",
      addressRegion: "SP",
      addressLocality: "Bauru",
      postalCode: "17012-000",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -22.3155,
      longitude: -49.0709,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://basylab.com.br/#website",
    url: "https://basylab.com.br",
    name: "Basylab",
    description:
      "Desenvolvimento de software sob medida para empresas que precisam de soluções digitais de qualidade.",
    publisher: {
      "@id": "https://basylab.com.br/#organization",
    },
    inLanguage: "pt-BR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://basylab.com.br/?s={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": "https://basylab.com.br/#services",
    name: "Serviços de Desenvolvimento de Software",
    description: "Serviços oferecidos pela Basylab",
    numberOfItems: 3,
    itemListElement: [
      {
        "@type": "Service",
        position: 1,
        name: "Desenvolvimento Web",
        description:
          "Plataformas, sistemas e dashboards que rodam no navegador. Construídos com React, Next.js e TypeScript.",
        provider: {
          "@id": "https://basylab.com.br/#organization",
        },
        serviceType: "Desenvolvimento de Software",
        areaServed: {
          "@type": "Country",
          name: "Brasil",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Projetos Web",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "E-commerce",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Dashboard",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Sistema Web",
              },
            },
          ],
        },
      },
      {
        "@type": "Service",
        position: 2,
        name: "Desenvolvimento Mobile",
        description:
          "Aplicativos nativos e híbridos para iOS e Android. Performance e experiência do usuário em primeiro lugar.",
        provider: {
          "@id": "https://basylab.com.br/#organization",
        },
        serviceType: "Desenvolvimento de Software",
        areaServed: {
          "@type": "Country",
          name: "Brasil",
        },
      },
      {
        "@type": "Service",
        position: 3,
        name: "Automação e Integrações",
        description:
          "Automações de processos, bots e integrações via API para otimizar operações do seu negócio.",
        provider: {
          "@id": "https://basylab.com.br/#organization",
        },
        serviceType: "Automação de Processos",
        areaServed: {
          "@type": "Country",
          name: "Brasil",
        },
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": "https://basylab.com.br/#faq",
    mainEntity: [
      {
        "@type": "Question",
        name: "Quais tipos de software a Basylab desenvolve?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Desenvolvemos sistemas web (plataformas, dashboards, e-commerce), aplicativos mobile (iOS e Android) e automações (integrações, bots, APIs). Cada projeto é feito sob medida para as necessidades específicas do cliente.",
        },
      },
      {
        "@type": "Question",
        name: "Quanto custa desenvolver um software com a Basylab?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "O custo varia de acordo com a complexidade do projeto, escopo de funcionalidades e prazo desejado. Oferecemos desde MVPs para validação de ideias até soluções enterprise completas. Entre em contato para receber um orçamento personalizado.",
        },
      },
      {
        "@type": "Question",
        name: "Qual é o prazo de entrega de um projeto?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "O prazo depende da complexidade e escopo do projeto. Um MVP pode ser entregue em poucas semanas, enquanto projetos mais robustos podem levar alguns meses. Trabalhamos com prazos flexíveis, normais ou urgentes conforme sua necessidade.",
        },
      },
      {
        "@type": "Question",
        name: "A Basylab oferece suporte após a entrega?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sim! O acompanhamento pós-entrega está incluso em todos os projetos. Oferecemos suporte, manutenção e evoluções do sistema conforme necessário.",
        },
      },
      {
        "@type": "Question",
        name: "Quais tecnologias a Basylab utiliza?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Utilizamos tecnologias modernas e consolidadas como React, Next.js, TypeScript, Node.js, React Native, PostgreSQL, entre outras. A escolha das tecnologias é feita com base nas necessidades específicas de cada projeto.",
        },
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": "https://basylab.com.br/#breadcrumb",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: "https://basylab.com.br",
      },
    ],
  };

  const schemas = [
    organizationSchema,
    localBusinessSchema,
    websiteSchema,
    serviceSchema,
    faqSchema,
    breadcrumbSchema,
  ];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires dangerouslySetInnerHTML - content is static schema data
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}
    </>
  );
}
