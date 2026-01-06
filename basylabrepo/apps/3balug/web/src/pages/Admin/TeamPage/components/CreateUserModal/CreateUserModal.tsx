import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input/Input";
import { Modal } from "@/components/Modal/Modal";
import { Select } from "@/components/Select/Select";
import { useUser } from "@/queries/auth/useUser";
import { useCreateUserMutation } from "@/queries/users/useCreateUserMutation";

const createUserSchema = z.object({
  email: z.string().min(1, "Email é obrigatório").toLowerCase().pipe(z.email("Email inválido")),
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

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const createUserMutation = useCreateUserMutation();
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      const response = await createUserMutation.mutateAsync(data);
      toast.success(response.message || "Usuário criado com sucesso!");
      reset();
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Erro ao criar usuário";
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    if (!createUserMutation.isPending) {
      reset();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Adicionar Membro da Equipe"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={createUserMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={createUserMutation.isPending}
          >
            Adicionar
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          {...register("name")}
          label="Nome Completo"
          placeholder="Digite o nome completo"
          error={errors.name?.message}
          fullWidth
          disabled={createUserMutation.isPending}
        />

        <div style={{ marginTop: "16px" }}>
          <Input
            {...register("email")}
            type="email"
            label="Email"
            placeholder="Digite o email"
            error={errors.email?.message}
            fullWidth
            disabled={createUserMutation.isPending}
          />
        </div>

        <div style={{ marginTop: "16px" }}>
          <Input
            {...register("phone")}
            type="tel"
            label="Celular *"
            placeholder="(11) 99999-9999"
            error={errors.phone?.message}
            fullWidth
            disabled={createUserMutation.isPending}
          />
        </div>

        <div style={{ marginTop: "16px" }}>
          <Select
            {...register("role")}
            label="Função"
            error={errors.role?.message}
            fullWidth
            disabled={createUserMutation.isPending}
            options={[
              { value: "broker", label: "Corretor" },
              { value: "manager", label: "Gerente" },
              {
                value: "insurance_analyst",
                label:
                  user && user.role === "owner"
                    ? "Analista de Seguros"
                    : "Analista de Seguros (Apenas Owner)",
                disabled: !user || user.role !== "owner",
              },
            ]}
            placeholder="Selecione a função"
          />
        </div>

        <p
          style={{
            fontSize: "14px",
            color: "#6B7280",
            marginTop: "16px",
            lineHeight: "1.5",
          }}
        >
          Um email com instruções de acesso será enviado para o usuário.
        </p>
      </form>
    </Modal>
  );
}
