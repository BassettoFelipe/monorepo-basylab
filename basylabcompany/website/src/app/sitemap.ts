import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://basylab.com.br";
  const lastModified = new Date();

  // Páginas reais do site (URLs com # não são válidas para sitemap)
  const pages = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "privacidade", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "termos", priority: 0.5, changeFrequency: "yearly" as const },
  ];

  return pages.map((page) => ({
    url: page.path ? `${baseUrl}/${page.path}` : baseUrl,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
