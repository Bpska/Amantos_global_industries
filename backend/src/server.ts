import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './utils/prisma';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Retailer Onboarding & Sales Tracking API is running on port ${env.PORT}`);
  console.log(`📚 Swagger documentation available at http://localhost:${env.PORT}/api/docs`);
});

// Graceful shutdown
const handleShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database disconnected. Process exited.');
    process.exit(0);
  });

  // Force shutdown after 10s if dangling connections remain
  setTimeout(() => {
    console.error('Forcefully terminating process after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
