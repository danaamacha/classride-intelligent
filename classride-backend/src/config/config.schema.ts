import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // App
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().required(),

  // JWT (required in production, optional in development for now)
  JWT_SECRET: Joi.string().default('dev_jwt_secret_change_in_production'),
  JWT_REFRESH_SECRET: Joi.string().default('dev_refresh_secret_change_in_production'),
  JWT_EXP: Joi.string().default('15m'),
JWT_REFRESH_EXP: Joi.string().default('7d'),
});
