/**
 * PM2 Ecosystem Configuration
 *
 * Zero-Downtime Deployment Strategy:
 * - Cluster mode: múltiplas instâncias (utiliza todos os CPUs)
 * - Graceful reload: PM2 mantém instâncias antigas até novas estarem prontas
 * - Auto-restart: reinicia automaticamente em caso de crash
 * - Health checks: monitora saúde da aplicação
 */

module.exports = {
  apps: [
    {
      name: "3balug-api",
      script: "./dist/server.js",
      interpreter: "/root/.bun/bin/bun",
      instances: 2, // 2 instâncias (Bun não suporta cluster mode com 'max')
      exec_mode: "fork", // Fork mode (Bun limitation)

      // Zero-Downtime Deploy
      // wait_ready: true, // Disabled - Bun doesn't send ready signal
      listen_timeout: 3000, // Timeout para app ficar pronta (3s)
      kill_timeout: 5000, // Tempo para graceful shutdown (5s)

      // Auto-restart strategies
      autorestart: true,
      max_restarts: 10, // Máximo de restarts em window_time
      min_uptime: "10s", // Tempo mínimo online para não ser considerado crash
      restart_delay: 4000, // Delay entre restarts (4s)

      // Crash monitoring
      max_memory_restart: "500M", // Restart se exceder 500MB por instância

      // Environment
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },

      // Logs
      error_file: "/var/www/3balug/backend/shared/logs/error.log",
      out_file: "/var/www/3balug/backend/shared/logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true, // Combina logs de todas as instâncias

      // Monitoring
      instance_var: "INSTANCE_ID",
    },
  ],

  // Deploy configuration
  deploy: {
    production: {
      user: "root",
      host: "46.202.150.28",
      ref: "origin/main",
      repo: "git@github.com:seu-usuario/3balug.git",
      path: "/var/www/3balug/backend",
      "post-deploy":
        "bun install --production && bun run build && pm2 reload ecosystem.config.cjs --env production",
    },
  },
};
