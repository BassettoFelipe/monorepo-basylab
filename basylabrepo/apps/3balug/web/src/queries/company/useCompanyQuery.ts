import { useQuery } from "@tanstack/react-query";
import type { Company } from "@/services/company/get-company";
import { getCompany } from "@/services/company/get-company";

export const useCompanyQuery = () => {
  return useQuery<Company>({
    queryKey: ["company", "me"],
    queryFn: () => getCompany(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
