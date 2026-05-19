import { buildApp } from './app';
import connectDb from './infrastructure/database/connectDB';
import { ENV } from './shared/config/environments';
import { startWorkers } from './workers/agenda';

const startServer = async () => {
  const app = await buildApp();

  try {
    await startWorkers();

    await app.listen({
      port: 3001,
      host: '0.0.0.0',
    });

    app.log.info(`Server listening — NODE_ENV=${ENV.NODE_ENV}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

connectDb(startServer);