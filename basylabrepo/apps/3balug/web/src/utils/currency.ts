export function formatPrice(priceInCents: number): string {
  return (priceInCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
