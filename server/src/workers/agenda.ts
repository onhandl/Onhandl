import { Agenda, Job } from 'agenda';
import { ENV } from '../shared/config/environments';

const agenda = new Agenda({ db: { address: ENV.MONGO_URI, collection: 'agendaJobs' } });

agenda.define('execute-llm-call', async (job: Job) => {
    const { executionId, nodeId, prompt } = job.attrs.data;
    console.log(`Executing LLM call for execution ${executionId}, node ${nodeId}`);
});

agenda.define('submit-blockchain-tx', async (job: Job) => {
    const { executionId, txData } = job.attrs.data;
    console.log(`Submitting TX for execution ${executionId}`);
});

export const startWorkers = async () => {
    await agenda.start();
    console.log('Agenda workers started');
};
