module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: 'production',
    trustProxy: true
  },
  
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000,
      acquire: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || [],
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.AWS_S3_BUCKET
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      enabled: true,
      path: process.env.LOG_FILE_PATH || './logs/app.log',
      maxSize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: process.env.LOG_MAX_FILES || '14d'
    },
    console: {
      enabled: false
    }
  },
  
  session: {
    secret: process.env.SESSION_SECRET,
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAME_SITE || 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },
  
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 15 * 60 * 1000
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ]
  },
  
  socket: {
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000,
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000
  },
  
  features: {
    swaggerDocs: process.env.ENABLE_SWAGGER_DOCS === 'true',
    debugLogging: process.env.ENABLE_DEBUG_LOGGING === 'true',
    metrics: process.env.ENABLE_METRICS === 'true'
  }
};
