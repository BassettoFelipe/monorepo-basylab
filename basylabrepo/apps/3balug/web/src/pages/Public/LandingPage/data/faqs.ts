export interface Faq {
	question: string
	answer: string
}

export const faqs: Faq[] = [
	{
		question: 'Posso mudar de plano a qualquer momento?',
		answer:
			'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças entram em vigor no próximo ciclo de faturamento.',
	},
	{
		question: 'Como funciona o suporte?',
		answer:
			'Todos os planos incluem suporte por email. Planos Imobiliária e House incluem suporte prioritário via chat e telefone.',
	},
	{
		question: 'Meus dados estão seguros?',
		answer:
			'Sim! Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança. Seus dados são armazenados em servidores seguros com backup diário.',
	},
	{
		question: 'Quais são as formas de pagamento?',
		answer:
			'Aceitamos pagamento via cartão de crédito, boleto bancário e PIX. O pagamento é processado mensalmente de forma automática.',
	},
]
