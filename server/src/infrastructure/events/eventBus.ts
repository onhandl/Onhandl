import { EventEmitter } from 'events'

class EventBus extends EventEmitter { }

export const eventBus = new EventBus()

// Listeners config
// Example: eventBus.on('agent.run.started', (data) => { ... })
