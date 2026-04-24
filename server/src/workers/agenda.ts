import Agenda from 'agenda';
import { ENV } from '../shared/config/environments';
import { CkbFundsReceivedSource } from '../core/financial-runtime/EventSources';

const agenda = new Agenda({ db: { address: ENV.MONGO_URI, collection: 'agendaJobs' } });

agenda.define('poll-ckb-funds-received', async () => {
    console.log('[workers] Polling CKB funds received source');
    try {
        const source = new CkbFundsReceivedSource();
        await source.pollOnce();
    } catch (error) {
        console.error('[workers] CKB funds polling failed:', error);
        throw error;
    }
});

export const startWorkers = async () => {
    await agenda.start();
    console.log('Agenda workers started');

    // Clear any locks left by previous crashed process — without this, jobs can silently skip
    await agenda.cancel({ lockedAt: { $ne: null } });

    await agenda.every('10 seconds', 'poll-ckb-funds-received');
    console.log('[workers] CKB funds received polling job registered');
};
