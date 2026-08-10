const devOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

const config = {
  port:           parseInt(process.env.PORT          ?? '3000', 10),
  jwtSecret:      process.env.JWT_SECRET              ?? 'nam-quan-dev-secret-change-in-prod',
  jwtExpiresIn:   process.env.JWT_EXPIRES_IN          ?? '7d',
  nodeEnv:        process.env.NODE_ENV                ?? 'development',
  openapiEnabled: process.env.OPENAPI_ENABLED         !== 'false',
  corsOrigin:     process.env.NODE_ENV === 'production'
                    ? (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
                    : devOrigins,
  databaseUrl:    process.env.DATABASE_URL            ?? 'postgresql://postgres:postgres@localhost:5432/nam_quan',
};

export default config;
