// PM2 Ecosystem Config para basylab.com.br
// Usar na VPS: pm2 start ecosystem.config.cjs --env production
// Docs: https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    {
      name: "basylab-site",
      script: "server.js",
      cwd: "/apps/basylab-site/current",
      instances: 1,
      exec_mode: "fork",

      // Ambiente de producao
      env_production: {
        NODE_ENV: "production",
        PORT: 3005,
        HOSTNAME: "0.0.0.0",
      },

      // =============================================
      // Configuracoes de Restart (OTIMIZADO)
      // =============================================
      // Aumentado de 300M para 512M - Next.js 16 + React 19 precisa mais memoria
      max_memory_restart: "512M",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000, // Aumentado para 2s entre restarts

      // Evita restarts prematuros durante cold start
      min_uptime: "30s", // Processo precisa rodar 30s para ser considerado estavel
      listen_timeout: 15000, // 15s para o servidor iniciar (cold start do Next.js)
      kill_timeout: 8000, // 8s para graceful shutdown

      // =============================================
      // Configuracoes de Logs
      // =============================================
      log_file: "/apps/basylab-site/shared/logs/combined.log",
      out_file: "/apps/basylab-site/shared/logs/out.log",
      error_file: "/apps/basylab-site/shared/logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Rotacao de logs para evitar disco cheio
      // PM2 nao faz rotacao nativa, usar pm2-logrotate ou logrotate do sistema

      // =============================================
      // Monitoramento
      // =============================================
      watch: false, // Nao usar em producao
      source_map_support: false, // Desabilitado para performance

      // Expor metricas para Prometheus (pm2-prometheus-exporter)
      // Isso permite coletar metricas via /metrics endpoint
    },
  ],
};
