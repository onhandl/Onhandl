import "dotenv/config";

export const ENV = {
    MONGO_URI: process.env.MONGO_URI as string,
    JWT_SECRET: process.env.JWT_SECRET || 'supersecret_faev',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY as string,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(",").map(origin => origin.trim()) || ["http://localhost:3000"],
    OPENAI_API_KEY: process.env.OPENAI_API_KEY as string,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL as string,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL as string,
};

const REQUIRED_ENV = [
    "ALLOWED_ORIGINS",
    "MONGO_URI",
    "GEMINI_API_KEY",
    "JWT_SECRET",
    "OPENAI_API_KEY",
];

// Check that all required env variables are set
for (const key of REQUIRED_ENV) {
    if (!ENV[key as keyof typeof ENV]) {
        console.error(`Missing required environment variable: ${key}`);
        process.exit(1);
    }
}

console.log("Allowed origins:", ENV.ALLOWED_ORIGINS); // Debug log