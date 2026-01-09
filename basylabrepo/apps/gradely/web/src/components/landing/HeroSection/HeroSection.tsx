import './HeroSection.css'

export function HeroSection() {
	return (
		<section className="hero">
			{/* Animated background */}
			<div className="hero__background" />
			<div className="hero__grid" />

			{/* Floating shapes */}
			<div className="hero__shapes">
				<div className="hero__shape hero__shape--1" />
				<div className="hero__shape hero__shape--2" />
				<div className="hero__shape hero__shape--3" />
			</div>

			<div className="hero__container">
				{/* Text content */}
				<div className="hero__content">
					<div className="hero__badge">
						<span className="hero__badge-dot" />
						Sistema de gestao escolar
					</div>

					<h1 className="hero__title">
						Crie grades horarias <span className="hero__title-highlight">sem conflitos</span>
					</h1>

					<p className="hero__description">
						O Gradely simplifica a criacao de horarios escolares. Cadastre professores, turmas e
						disciplinas, e gere grades otimizadas em minutos. Chega de planilhas e trabalho manual.
					</p>

					<div className="hero__ctas">
						<a href="/cadastro" className="hero__cta hero__cta--primary">
							Criar conta gratuita
							<svg
								className="hero__cta-icon"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
								aria-hidden="true"
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
							</svg>
						</a>
						<a href="#como-funciona" className="hero__cta hero__cta--secondary">
							<svg
								className="hero__cta-icon"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							Como funciona
						</a>
					</div>

					<div className="hero__features">
						<div className="hero__feature">
							<svg
								className="hero__feature-icon"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span>Sem conflitos</span>
						</div>
						<div className="hero__feature">
							<svg
								className="hero__feature-icon"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
							<span>Carga balanceada</span>
						</div>
						<div className="hero__feature">
							<svg
								className="hero__feature-icon"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span>Menos trabalho</span>
						</div>
					</div>
				</div>

				{/* Visual - Dashboard mockup */}
				<div className="hero__visual">
					<div className="hero__dashboard">
						<div className="hero__dashboard-header">
							<div className="hero__dashboard-dots">
								<div className="hero__dashboard-dot hero__dashboard-dot--red" />
								<div className="hero__dashboard-dot hero__dashboard-dot--yellow" />
								<div className="hero__dashboard-dot hero__dashboard-dot--green" />
							</div>
							<div className="hero__dashboard-title">Grade de Horarios - 7o Ano A</div>
						</div>

						<div className="hero__schedule">
							{/* Header row */}
							<div className="hero__schedule-header" />
							<div className="hero__schedule-header">Seg</div>
							<div className="hero__schedule-header">Ter</div>
							<div className="hero__schedule-header">Qua</div>
							<div className="hero__schedule-header">Qui</div>
							<div className="hero__schedule-header">Sex</div>

							{/* Time slots */}
							<div className="hero__schedule-time">07:30</div>
							<div className="hero__schedule-cell hero__schedule-cell--math">Mat</div>
							<div className="hero__schedule-cell hero__schedule-cell--port">Port</div>
							<div className="hero__schedule-cell hero__schedule-cell--hist">Hist</div>
							<div className="hero__schedule-cell hero__schedule-cell--math">Mat</div>
							<div className="hero__schedule-cell hero__schedule-cell--cien">Cien</div>

							<div className="hero__schedule-time">08:20</div>
							<div className="hero__schedule-cell hero__schedule-cell--math">Mat</div>
							<div className="hero__schedule-cell hero__schedule-cell--port">Port</div>
							<div className="hero__schedule-cell hero__schedule-cell--geo">Geo</div>
							<div className="hero__schedule-cell hero__schedule-cell--hist">Hist</div>
							<div className="hero__schedule-cell hero__schedule-cell--cien">Cien</div>

							<div className="hero__schedule-time">09:10</div>
							<div className="hero__schedule-cell hero__schedule-cell--port">Port</div>
							<div className="hero__schedule-cell hero__schedule-cell--geo">Geo</div>
							<div className="hero__schedule-cell hero__schedule-cell--cien">Cien</div>
							<div className="hero__schedule-cell hero__schedule-cell--port">Port</div>
							<div className="hero__schedule-cell hero__schedule-cell--hist">Hist</div>

							<div className="hero__schedule-time">10:20</div>
							<div className="hero__schedule-cell hero__schedule-cell--hist">Hist</div>
							<div className="hero__schedule-cell hero__schedule-cell--cien">Cien</div>
							<div className="hero__schedule-cell hero__schedule-cell--port">Port</div>
							<div className="hero__schedule-cell hero__schedule-cell--geo">Geo</div>
							<div className="hero__schedule-cell hero__schedule-cell--math">Mat</div>
						</div>

						{/* Floating notification */}
						<div className="hero__notification">
							<div className="hero__notification-icon">
								<svg
									width="20"
									height="20"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
									aria-hidden="true"
								>
									<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							</div>
							<div className="hero__notification-content">
								<span className="hero__notification-title">Tudo certo!</span>
								<span className="hero__notification-text">Nenhum conflito encontrado</span>
							</div>
						</div>

						{/* Floating badge */}
						<div className="hero__floating-badge">
							<svg
								className="hero__floating-badge-icon"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							<span className="hero__floating-badge-text">2025.1</span>
						</div>
					</div>
				</div>
			</div>

			{/* Scroll indicator */}
			<div className="hero__scroll">
				<div className="hero__scroll-mouse">
					<div className="hero__scroll-wheel" />
				</div>
				<span>Role para explorar</span>
			</div>
		</section>
	)
}
