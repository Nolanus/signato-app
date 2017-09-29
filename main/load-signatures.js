const fs = require('fs');
const path = require('path');

const async = require('async');
const xml2js = require('xml2js');

const app = require('electron').app;
const ipc = require('electron').ipcMain;

const paths = require('../data/paths');

ipc.on('load-signatures', function (event) {
	const allPaths = paths.local.concat(paths.icloud);
	const dirs = allPaths.map((folderName) => path.resolve(process.env.HOME, folderName));
	async.map(dirs, (file, cb) => {
		fs.stat(file + '/AllSignatures.plist', (err, stats) => {
			if (err && err.code !== 'ENOENT') {
				cb(err);
				return;
			}
			cb(null, stats || false);
		});
	}, function (err, results) {
		if (err) {
			event.sender.send('loaded-signatures', err);
			return;
		}
		let folders = [];
		results.forEach((stat, index) => {
			if (stat && stat.isFile()) {
				folders.push(allPaths[index]);
			}
		});
		event.sender.send('loaded-signatures', null, folders);
		//async.map(folders, fs.)
	});
});
