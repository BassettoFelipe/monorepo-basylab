import { t } from 'elysia'

/**
 * Schema para validacao de estados brasileiros
 */
export const brazilianStateSchema = t.Union([
	t.Literal('AC'),
	t.Literal('AL'),
	t.Literal('AP'),
	t.Literal('AM'),
	t.Literal('BA'),
	t.Literal('CE'),
	t.Literal('DF'),
	t.Literal('ES'),
	t.Literal('GO'),
	t.Literal('MA'),
	t.Literal('MT'),
	t.Literal('MS'),
	t.Literal('MG'),
	t.Literal('PA'),
	t.Literal('PB'),
	t.Literal('PR'),
	t.Literal('PE'),
	t.Literal('PI'),
	t.Literal('RJ'),
	t.Literal('RN'),
	t.Literal('RS'),
	t.Literal('RO'),
	t.Literal('RR'),
	t.Literal('SC'),
	t.Literal('SP'),
	t.Literal('SE'),
	t.Literal('TO'),
])

/**
 * Schema para validacao de tipo de documento (CPF ou CNPJ)
 */
export const documentTypeSchema = t.Union([t.Literal('cpf'), t.Literal('cnpj')])

/**
 * Schema para validacao de estado civil
 */
export const maritalStatusSchema = t.Union([
	t.Literal('solteiro'),
	t.Literal('casado'),
	t.Literal('divorciado'),
	t.Literal('viuvo'),
	t.Literal('uniao_estavel'),
])

/**
 * Schema para campo nullable (string ou null)
 */
export const nullableString = t.Union([t.String(), t.Null()])
