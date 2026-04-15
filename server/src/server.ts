import { app } from './app';
import connectDb from './infrastructure/database/connectDB';
import { ENV } from './shared/config/environments';
import { startWorkers } from './workers/agenda';
import { syncBlockchainToolsToDb } from './modules/tools/tool-sync.service';

const startServer = async () => {
    try {
        await startWorkers();
        await syncBlockchainToolsToDb();
        await app.listen({ port: 3001, host: '0.0.0.0' });
        app.log.info(`Server listening — NODE_ENV=${ENV.NODE_ENV}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

connectDb(startServer);
