import './HowItWorksSection.css'

const steps = [
	{
		number: '01',
		title: 'Cadastre seus dados',
		description:
			'Adicione professores, turmas e disciplinas. Informe a disponibilidade de cada professor e a carga horaria semanal.',
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
					d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
				/>
			</svg>
		),
	},
	{
		number: '02',
		title: 'Configure as regras',
		description:
			'Defina suas preferencias: evitar janelas, limitar aulas consecutivas, ou priorizar determinados horarios.',
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
					d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
				/>
			</svg>
		),
	},
	{
		number: '03',
		title: 'Gere a grade',
		description:
			'Clique em gerar e em segundos tenha sua grade otimizada, sem conflitos e pronta para exportar.',
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
					d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
				/>
			</svg>
		),
	},
]

export function HowItWorksSection() {
	return (
		<section className="how-it-works" id="como-funciona">
			<div className="how-it-works__container">
				<header className="how-it-works__header">
					<span className="how-it-works__label">Como funciona</span>
					<h2 className="how-it-works__title">
						Simples de usar,
						<br />
						<span className="how-it-works__highlight">poderoso nos resultados</span>
					</h2>
					<p className="how-it-works__subtitle">
						Em apenas tres passos, transforme horas de trabalho manual em minutos.
					</p>
				</header>

				<div className="how-it-works__grid">
					{steps.map((step, index) => (
						<article key={step.number} className="how-it-works__card">
							<div className="how-it-works__card-header">
								<span className="how-it-works__number">{step.number}</span>
								<div className="how-it-works__icon">{step.icon}</div>
							</div>
							<h3 className="how-it-works__card-title">{step.title}</h3>
							<p className="how-it-works__card-description">{step.description}</p>
							{index < steps.length - 1 && (
								<div className="how-it-works__arrow">
									<svg
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2}
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M17 8l4 4m0 0l-4 4m4-4H3"
										/>
									</svg>
								</div>
							)}
						</article>
					))}
				</div>

				<div className="how-it-works__cta">
					<a href="/cadastro" className="how-it-works__button">
						Testar gratuitamente
						<svg
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
							aria-hidden="true"
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</a>
					<span className="how-it-works__cta-note">7 dias gratis para explorar a plataforma</span>
				</div>
			</div>
		</section>
	)
}
