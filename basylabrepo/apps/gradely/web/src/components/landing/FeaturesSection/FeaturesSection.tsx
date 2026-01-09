import './FeaturesSection.css'

const features = [
	{
		title: 'Deteccao automatica de conflitos',
		description:
			'O sistema identifica automaticamente quando um professor esta alocado em duas turmas no mesmo horario.',
		icon: (
			<svg
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
				/>
			</svg>
		),
	},
	{
		title: 'Balanceamento de carga',
		description:
			'Distribua as aulas de forma equilibrada ao longo da semana, evitando sobrecarga em dias especificos.',
		icon: (
			<svg
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
				/>
			</svg>
		),
	},
	{
		title: 'Disponibilidade de professores',
		description:
			'Cadastre os horarios disponiveis de cada professor e o sistema respeita essas restricoes automaticamente.',
		icon: (
			<svg
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
				/>
			</svg>
		),
	},
	{
		title: 'Multiplas turmas e periodos',
		description:
			'Gerencie turmas de diferentes periodos (manha, tarde, noite) em uma unica plataforma.',
		icon: (
			<svg
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z"
				/>
			</svg>
		),
	},
	{
		title: 'Exportacao em PDF e Excel',
		description:
			'Exporte suas grades em formatos prontos para impressao ou compartilhamento com a equipe.',
		icon: (
			<svg
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
				/>
			</svg>
		),
	},
	{
		title: 'Historico de versoes',
		description:
			'Mantenha um historico de todas as grades geradas e volte a versoes anteriores quando necessario.',
		icon: (
			<svg
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={1.5}
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		),
	},
]

export function FeaturesSection() {
	return (
		<section className="features" id="funcionalidades">
			<div className="features__container">
				<header className="features__header">
					<span className="features__label">Funcionalidades</span>
					<h2 className="features__title">
						Tudo que voce precisa para
						<br />
						<span className="features__highlight">organizar sua escola</span>
					</h2>
					<p className="features__subtitle">
						Recursos pensados para simplificar o dia a dia de coordenadores e gestores escolares.
					</p>
				</header>

				<div className="features__grid">
					{features.map((feature) => (
						<article key={feature.title} className="features__card">
							<div className="features__icon">{feature.icon}</div>
							<h3 className="features__card-title">{feature.title}</h3>
							<p className="features__card-description">{feature.description}</p>
						</article>
					))}
				</div>
			</div>
		</section>
	)
}
