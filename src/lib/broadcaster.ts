import EventEmitter from 'events';

// Simple in-memory broadcaster for server-sent events.
// This is fine for single-process development. For multi-process (production), replace with Redis or another pub/sub.

const emitter = new EventEmitter();

export function subscribe(channel: string, handler: (data: any) => void) {
  emitter.on(channel, handler);
}

export function unsubscribe(channel: string, handler: (data: any) => void) {
  emitter.off(channel, handler);
}

export function notify(channel: string, data: any) {
  try {
    emitter.emit(channel, data);
  } catch (e) {
    console.error('broadcaster notify error', e);
  }
}

export default { subscribe, unsubscribe, notify };
