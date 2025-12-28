// PM2 Configuration for Production
module.exports = {
  apps: [{
    name: 'accident-app-backend',
    script: './src/server.js',
    instances: process.env.PM2_INSTANCES || 'max',
    exec_mode: 'cluster',
    
    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Restart behavior
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Monitoring
    instance_var: 'INSTANCE_ID',
    
    // Advanced features
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // Cron restart (optional - restart daily at 3 AM)
    cron_restart: '0 3 * * *',
    
    // Source map support
    source_map_support: true,
    
    // Graceful reload
    shutdown_with_message: true
  }],
  
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/accident-app.git',
      path: '/opt/accident-app',
      'post-deploy': 'cd backend && npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /opt/accident-app/backend/logs'
    }
  }
};
