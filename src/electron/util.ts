import { ipcMain, IpcMainInvokeEvent } from 'electron';


export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}
  /**
 * A type-safe wrapper for ipcMain.handle.
 *
 * @param channel The IPC channel name.
 * @param handler The function to handle the invoke call. It receives the event and arguments.
 */
export function ipcHandle<T, R extends any[]>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: R) => T | Promise<T>
) {
  ipcMain.handle(channel, (event, ...args: R) => {
    // We explicitly cast the arguments to ensure type safety.
    // The handler function is now correctly called with all arguments.
    // The return value (or Promise) of the handler is returned to ipcMain.handle.
    return handler(event, ...args);
  });
}