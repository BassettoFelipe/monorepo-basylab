import { describe, expect, test } from "bun:test";
import { extractKeyFromUrl } from "./s3-url.helper";

describe("extractKeyFromUrl", () => {
  test("deve extrair key de URL S3 válida", () => {
    const url = "https://my-bucket.s3.amazonaws.com/bucket-name/avatars/user-123/avatar.webp";
    const result = extractKeyFromUrl(url);
    expect(result).toBe("avatars/user-123/avatar.webp");
  });

  test("deve extrair key de URL com múltiplos níveis", () => {
    const url = "https://storage.example.com/bucket/files/user-456/field-abc/document.pdf";
    const result = extractKeyFromUrl(url);
    expect(result).toBe("files/user-456/field-abc/document.pdf");
  });

  test("deve retornar null para URL inválida", () => {
    const result = extractKeyFromUrl("not-a-valid-url");
    expect(result).toBeNull();
  });

  test("deve retornar null para string vazia", () => {
    const result = extractKeyFromUrl("");
    expect(result).toBeNull();
  });

  test("deve lidar com URL sem path", () => {
    const url = "https://storage.example.com/";
    const result = extractKeyFromUrl(url);
    expect(result).toBe("");
  });

  test("deve lidar com URL com apenas bucket name", () => {
    const url = "https://storage.example.com/bucket-name";
    const result = extractKeyFromUrl(url);
    expect(result).toBe("");
  });
});
