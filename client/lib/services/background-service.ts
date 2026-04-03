/** Stub — Background job scheduler for live-mode-manager */
export const backgroundService = {
    registerJob(_name: string, _fn: () => void, _opts?: { interval?: number }) {},
    unregisterJob(_name: string) {},
}
