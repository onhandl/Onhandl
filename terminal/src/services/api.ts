import axios, { AxiosInstance } from 'axios';
import { SessionStore } from './session.js';

// During development, assume the server handles it on localhost:3001 or from ENV.
const API_BASE_URL = process.env.ONHANDL_API_URL || 'http://localhost:3001/api';

export class ApiClient {
    public http: AxiosInstance;

    constructor() {
        this.http = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Inject saved auth token if available
        this.http.interceptors.request.use((config) => {
            const session = SessionStore.load();
            if (session?.accessToken) {
                config.headers.set('Authorization', `Bearer ${session?.accessToken}`);
            }
            return config;
        });

        this.http.interceptors.response.use(
            response => response,
            error => {
                if (error.response?.status === 401) {
                    SessionStore.clear(); // Token expired or invalid
                }
                return Promise.reject(error);
            }
        );
    }
}

export const apiClient = new ApiClient().http;
