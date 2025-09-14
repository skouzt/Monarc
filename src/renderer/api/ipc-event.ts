/* eslint-disable no-bitwise */

import { ipcRenderer } from 'electron';

(String.prototype as any).hashCode = function hashCode() {
  let hash = 0;
  let i;
  let chr;

  if (this.length === 0) {
    return hash;
  }
  for (i = 0; i < this.length; i += 1) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // convert to 32bit integer
  }
  return hash;
};

class Event {
  scope: string;
  event: string;
  listeners: string[];

  constructor(scope: string, event: string) {
    this.scope = scope;
    this.event = event;
    this.listeners = [];
  }

  addListener(callback: (...args: any) => any): void {
    const digest = (callback.toString() as any).hashCode();
    this.listeners.push(digest);
    ipcRenderer.on(
      `Monarc-${this.scope}-add-listener-${this.event}-result-${digest}`, (event, args) => {
        callback(...args);
      }
    );
    ipcRenderer.send(`Monarc-${this.scope}-add-listener-${this.event}`, digest);
  }

  removeListener(callback: (...args: any) => any): void {
    const digest = (callback.toString() as any).hashCode();
    this.listeners = this.listeners.filter(c => (c !== digest));
    ipcRenderer.removeAllListeners(
      `Monarc-${this.scope}-add-listener-${this.event}-result-${digest}`
    );
    ipcRenderer.send(`Monarc-${this.scope}-remove-listener-${this.event}`, digest);
  }

  emit(...args: any): void {
    ipcRenderer.send(`Monarc-${this.scope}-emit-${this.event}`, args);
  }
}

export default Event;
