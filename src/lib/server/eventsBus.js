// lib/server/eventsBus.js
import { EventEmitter } from "events";

const globalForBus = globalThis;
if (!globalForBus.__EVENTS_BUS__) {
  globalForBus.__EVENTS_BUS__ = new EventEmitter();
  globalForBus.__EVENTS_BUS__.setMaxListeners(1000);
}

export const eventsBus = globalForBus.__EVENTS_BUS__;
