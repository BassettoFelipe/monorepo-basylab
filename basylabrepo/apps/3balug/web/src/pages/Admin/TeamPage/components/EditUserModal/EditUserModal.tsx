import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input/Input";
import { Modal } from "@/components/Modal/Modal";
import { Select } from "@/components/Select/Select";
import { useUser } from "@/queries/auth/useUser";
import { useUpdateUserMutation } from "@/queries/users/useUpdateUserMutation";
import type { TeamUser } from "@/types/user.types";

const editUserSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  role: z.enum(["broker", "manager", "insurance_analyst"], {
    message: "Selecione uma função",
  }),
  phone: z
    .string()
    .min(10, "Celular deve ter no mínimo 10 caracteres")
    .max(20, "Celular deve ter no máximo 20 caracteres"),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: TeamUser | null;
}

export function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const updateUserMutation = useUpdateUserMutation();
  const { user: currentUser } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    mode: "onBlur",
  });

  // Preenche o formulário quando o usuário muda
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        role: user.role as "broker" | "manager" | "insurance_analyst",
        phone: user.phone || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return;

    try {
      const response = await updateUserMutation.mutateAsync({
        userId: user.id,
        input: data,
      });
      toast.success(response.message || "Usuário atualizado com sucesso!");
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Erro ao atualizar usuário";
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    if (!updateUserMutation.isPending) {
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Membro da Equipe"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={updateUserMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={updateUserMutation.isPending}
          >
            Salvar Alterações
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          value={user.email}
          label="Email"
          disabled
          fullWidth
          style={{ opacity: 0.6, cursor: "not-allowed" }}
        />

        <Input
          {...register("name")}
          label="Nome Completo"
          placeholder="Digite o nome completo"
          error={errors.name?.message}
          fullWidth
          disabled={updateUserMutation.isPending}
          style={{ marginTop: "16px" }}
        />

        <Input
          {...register("phone")}
          type="tel"
          label="Celular *"
          placeholder="(11) 99999-9999"
          error={errors.phone?.message}
          fullWidth
          disabled={updateUserMutation.isPending}
          style={{ marginTop: "16px" }}
        />

        <Select
          {...register("role")}
          label="Função"
          error={errors.role?.message}
          fullWidth
          disabled={updateUserMutation.isPending}
          options={[
            { value: "broker", label: "Corretor" },
            { value: "manager", label: "Gerente" },
            {
              value: "insurance_analyst",
              label:
                currentUser && currentUser.role === "owner"
                  ? "Analista de Seguros"
                  : "Analista de Seguros (Apenas Owner)",
              disabled: !currentUser || currentUser.role !== "owner",
            },
          ]}
          style={{ marginTop: "16px" }}
        />
      </form>
    </Modal>
  );
}
