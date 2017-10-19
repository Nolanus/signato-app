/**
 * Created by sebastian.fuss on 04.10.17.
 */
import logger = require('electron-log');

export default abstract class IpcHandler {

	protected ipcMain: Electron.IpcMain;
	protected logger;

	constructor(ipcMain: Electron.IpcMain) {
		this.ipcMain = ipcMain;
		this.logger = logger;
		this.register();
	}

	protected abstract register();
}
