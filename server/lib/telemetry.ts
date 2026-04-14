// Application-wide Logger
export const Logger = {
    info: (msg: string, meta?: any) => {
        console.log(`[INFO] ${msg}`, meta ? JSON.stringify(meta) : '');
    },
    error: (msg: string, error?: any) => {
        console.error(`[ERROR] ${msg}`, error);
    },
    warn: (msg: string, meta?: any) => {
        console.warn(`[WARN] ${msg}`, meta ? JSON.stringify(meta) : '');
    }
};
