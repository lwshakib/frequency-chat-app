import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Centralized environment configuration
 * All environment variables should be accessed through this module
 */
const envs = {
  // Server Configuration
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Clerk Authentication
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // Cloudinary Configuration
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,

  // Redis Configuration
  REDIS_URL: process.env.REDIS_URL,
  REDIS_USERNAME: process.env.REDIS_USERNAME,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,

  // Kafka Configuration
  KAFKA_BROKER: process.env.KAFKA_BROKER,
  KAFKA_HOST: process.env.KAFKA_HOST,
  KAFKA_PORT: process.env.KAFKA_PORT,
  KAFKA_USERNAME: process.env.KAFKA_USERNAME,
  KAFKA_PASSWORD: process.env.KAFKA_PASSWORD,
  KAFKA_CERTIFICATE: process.env.KAFKA_CERTIFICATE,
};

export default envs;
