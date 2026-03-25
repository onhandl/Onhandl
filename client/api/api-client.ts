const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '') + '/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Automatic AI key injection from localStorage for AI/Test endpoints
    if (typeof window !== 'undefined' && (endpoint.includes('/ai/') || endpoint.includes('/test-connection'))) {
        try {
            const body = options.body ? JSON.parse(options.body as string) : {};
            const provider = body.provider || 'gemini';
            const apiKey = localStorage.getItem(`${provider.toLowerCase()}_api_key`);
            if (apiKey) {
                headers['x-ai-api-key'] = apiKey;
            }
        } catch (e) {
            // Body might not be JSON or might be missing
        }
    }

    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || response.statusText);
    }

    return response.json();
}
