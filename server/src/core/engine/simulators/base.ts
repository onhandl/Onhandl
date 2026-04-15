export const timestamp = () => `[${new Date().toLocaleTimeString()}]`;

export const enhancedLog = (message: string, details?: any) => {
    const ts = timestamp();
    console.log(`${ts} 🔍 ${message}`);
    if (details) {
        console.log(JSON.stringify(details, null, 2));
    }
};
