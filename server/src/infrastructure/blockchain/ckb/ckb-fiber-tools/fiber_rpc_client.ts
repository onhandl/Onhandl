const FIBER_URL = process.env.FIBER_NODE_URL || "http://localhost:8227";
const FIBER_AUTH_TOKEN = process.env.FIBER_AUTH_TOKEN || "";

export async function fiberRpcCall(method: string, params: any[]) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (FIBER_AUTH_TOKEN) {
        headers["Authorization"] = `Bearer ${FIBER_AUTH_TOKEN}`;
    }

    const body = JSON.stringify({ id: 1, jsonrpc: "2.0", method, params });
    console.debug(`[Fiber RPC] → ${FIBER_URL} | ${method} | body: ${body}`);

    const res = await fetch(FIBER_URL, { method: "POST", headers, body });
    const data = await res.json();
    console.debug(`[Fiber RPC] ← ${method} | response: ${JSON.stringify(data)}`);
    if (data.error) throw new Error(`Fiber RPC error (${method}): ${JSON.stringify(data.error)}`);
    return data.result;
}
