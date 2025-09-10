import { ipcRenderer, IpcRendererEvent } from 'electron';

type Callback = (data: any) => void;

class MonarcEvent {
  private events: Record<string, Callback[]> = {};

  /**
   * Subscribe to an event
   * @param eventName Name of the event
   * @param callback Callback function to invoke
   */
  on(eventName: string, callback: Callback) {
    if (!this.events[eventName]) this.events[eventName] = [];
    this.events[eventName].push(callback);
  }

  /**
   * Unsubscribe from an event
   * @param eventName Name of the event
   * @param callback Callback to remove
   */
  off(eventName: string, callback?: Callback) {
    if (!this.events[eventName]) return;
    if (callback) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    } else {
      this.events[eventName] = [];
    }
  }

  /**
   * Emit an event
   * @param eventName Name of the event
   * @param data Data to pass to listeners
   */
  emit(eventName: string, data?: any) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(callback => callback(data));
  }

  /**
   * Listen to an Electron IPC event
   * @param channel IPC channel
   * @param callback Callback with event data
   */
  ipcOn(channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) {
    ipcRenderer.on(channel, callback);
  }

  /**
   * Send data to Electron main process
   * @param channel IPC channel
   * @param data Data to send
   */
  ipcSend(channel: string, data?: any) {
    ipcRenderer.send(channel, data);
  }

  /**
   * Invoke an IPC method and await response
   * @param channel IPC channel
   * @param args Arguments
   */
  ipcInvoke(channel: string, ...args: any[]): Promise<any> {
    return ipcRenderer.invoke(channel, ...args);
  }
}

// Global instance for renderer
const monarcEvent = new MonarcEvent();

// Expose to window for preload usage
declare global {
  interface Window {
    monarcEvent: MonarcEvent;
  }
}

window.monarcEvent = monarcEvent;

export default monarcEvent;
