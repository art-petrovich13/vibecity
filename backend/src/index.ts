import app from './app';
import { config } from './config';
import { prisma } from './prisma';

const bootstrap = async () => {
  await prisma.$connect();

  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[vibecity] API запущен на http://localhost:${config.port} (${config.nodeEnv})`);
  });

  const shutdown = (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`[vibecity] Получен ${signal}, останавливаем сервер...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

bootstrap().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error('[vibecity] Не удалось запустить сервер:', error);
  await prisma.$disconnect();
  process.exit(1);
});
