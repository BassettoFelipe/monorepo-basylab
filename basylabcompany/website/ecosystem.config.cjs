// PM2 Ecosystem Config para basylab.com.br
// Usar na VPS: pm2 start ecosystem.config.cjs --env production

module.exports = {
  apps: [
    {
      name: "basylab-site",
      script: "server.js",
      cwd: "/apps/basylab-site/current",
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
        PORT: 3005,
        HOSTNAME: "0.0.0.0",
      },
      // Restart config
      max_memory_restart: "300M",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      // Logs
      log_file: "/apps/basylab-site/shared/logs/combined.log",
      out_file: "/apps/basylab-site/shared/logs/out.log",
      error_file: "/apps/basylab-site/shared/logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Monitoring
      watch: false,
      merge_logs: true,
    },
  ],
};
