import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://basylab.com.br";
  const lastModified = new Date();

  // Seções da página principal (âncoras)
  const sections = [
    { id: "", priority: 1.0, changeFrequency: "weekly" as const },
    { id: "#sobre", priority: 0.9, changeFrequency: "monthly" as const },
    { id: "#servicos", priority: 0.9, changeFrequency: "monthly" as const },
    { id: "#processo", priority: 0.8, changeFrequency: "monthly" as const },
    { id: "#tecnologias", priority: 0.7, changeFrequency: "monthly" as const },
    { id: "#cases", priority: 0.8, changeFrequency: "weekly" as const },
    { id: "#contato", priority: 0.9, changeFrequency: "monthly" as const },
  ];

  return sections.map((section) => ({
    url: `${baseUrl}/${section.id}`,
    lastModified,
    changeFrequency: section.changeFrequency,
    priority: section.priority,
  }));
}
