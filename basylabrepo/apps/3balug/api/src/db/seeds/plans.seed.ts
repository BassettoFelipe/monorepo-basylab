import { db } from '@/db'
import { plans, subscriptions } from '@/db/schema'

const PAGARME_PLAN_IDS = {
	BASICO: 'plan_Oj7K8EaSYH8jZnoq',
	IMOBILIARIA: 'plan_XMvjLKZS80cK47yn',
	HOUSE: 'plan_AKQD4v7S2cwlPvEm',
}

export async function seedPlans() {
	await db.delete(subscriptions)

	await db.delete(plans)

	await db.insert(plans).values([
		{
			name: 'Plano Básico',
			slug: 'basico',
			description: 'Ideal para corretor individual',
			price: 4990,
			maxUsers: 1,
			maxManagers: 0,
			maxSerasaQueries: 10,
			allowsLateCharges: 0,
			pagarmePlanId: PAGARME_PLAN_IDS.BASICO,
			features: [
				'Painel gestor corretor',
				'Geração de boletos',
				'Cadastro de imóveis ilimitados',
				'Cadastro de clientes ilimitados',
				'10 consultas Serasa',
				'Boleto de aluguel automático enviado para o cliente',
				'Lembrança de aluguel a vencer',
				'Emissão de contrato em PDF',
				'Página do imóvel cadastrado para acesso do cliente',
				'Acesso a analista de seguros',
			],
		},
		{
			name: 'Plano Imobiliária',
			slug: 'imobiliaria',
			description: 'Perfeito para pequenas e médias imobiliárias',
			price: 19900,
			maxUsers: 10,
			maxManagers: 0,
			maxSerasaQueries: 10,
			allowsLateCharges: 1,
			pagarmePlanId: PAGARME_PLAN_IDS.IMOBILIARIA,
			features: [
				'Painel gestor imobiliária',
				'Até 10 corretores com acesso à plataforma (cada um com seu login e senha)',
				'Cobrança de aluguel atrasado com juros',
				'Geração de boletos',
				'Cadastro de imóveis ilimitados',
				'Cadastro de clientes ilimitados',
				'10 consultas Serasa',
				'Boleto de aluguel automático enviado para o cliente',
				'Lembrança de aluguel a vencer',
				'Emissão de contrato em PDF',
				'Página do imóvel cadastrado para acesso do cliente',
				'Acesso a analista de seguros',
			],
		},
		{
			name: 'Plano House',
			slug: 'house',
			description: 'Para grandes imobiliárias e redes',
			price: 49900,
			maxUsers: null,
			maxManagers: 2,
			maxSerasaQueries: 30,
			allowsLateCharges: 1,
			pagarmePlanId: PAGARME_PLAN_IDS.HOUSE,
			features: [
				'Painel gestor House',
				'2 logins de gerentes',
				'Cadastro de corretores ilimitados',
				'15 consultas Serasa por gerente (total: 30)',
				'Geração de boletos',
				'Cadastro de imóveis ilimitados',
				'Cadastro de clientes ilimitados',
				'Boleto de aluguel automático enviado para o cliente',
				'Lembrança de aluguel a vencer',
				'Emissão de contrato em PDF',
				'Página do imóvel cadastrado para acesso do cliente',
				'Acesso a analista de seguros',
			],
		},
	])
}
