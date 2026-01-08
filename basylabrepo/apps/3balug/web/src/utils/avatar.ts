/**
 * Cores para avatares gerados
 */
export const AVATAR_COLORS = [
	{ bg: '#DBEAFE', text: '#1E40AF' }, // blue
	{ bg: '#E0E7FF', text: '#4338CA' }, // indigo
	{ bg: '#D1FAE5', text: '#065F46' }, // green
	{ bg: '#FEF3C7', text: '#92400E' }, // amber
	{ bg: '#FCE7F3', text: '#9D174D' }, // pink
	{ bg: '#E0F2FE', text: '#0369A1' }, // sky
	{ bg: '#F3E8FF', text: '#7C3AED' }, // violet
] as const

export type AvatarColor = (typeof AVATAR_COLORS)[number]

/**
 * Extrai as iniciais de um nome
 * @param name - Nome completo
 * @returns Iniciais (primeira e ultima letra do nome, ou apenas primeira se nome unico)
 */
export function getInitials(name: string): string {
	const parts = name.trim().split(' ').filter(Boolean)
	if (parts.length === 0) return ''
	if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
	return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Retorna uma cor de avatar baseada no nome
 * A cor e deterministica - o mesmo nome sempre retorna a mesma cor
 * @param name - Nome para gerar a cor
 * @returns Objeto com cores de background e texto
 */
export function getAvatarColor(name: string): AvatarColor {
	const index = name.length % AVATAR_COLORS.length
	return AVATAR_COLORS[index]
}
