export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          {/* Logo/Brand */}
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-brand" />
            <span className="text-2xl font-bold text-foreground">Basylab</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Transformamos ideias em <span className="text-brand">software</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-foreground-muted">
            Desenvolvemos soluções digitais sob medida para empresas que buscam
            inovação, qualidade e resultados.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#contato"
              className="inline-flex h-12 items-center justify-center rounded-full bg-brand px-8 text-base font-medium text-white transition-colors hover:bg-brand-hover"
            >
              Fale Conosco
            </a>
            <a
              href="#projetos"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border px-8 text-base font-medium text-foreground transition-colors hover:bg-background-subtle"
            >
              Ver Projetos
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-3xl text-center text-sm text-foreground-muted">
          © {new Date().getFullYear()} Basylab. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
