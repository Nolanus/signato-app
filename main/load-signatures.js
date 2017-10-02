const fs = require('fs');
const path = require('path');

const async = require('async');
const plist = require('plist');

const app = require('electron').app;
const ipc = require('electron').ipcMain;

const mailSigUtil = require('./../util/mailsignature');
const paths = require('../data/paths');

const preparePaths = function (paths) {
	if (paths.local.length === paths.icloud.length && paths.icloud.length === paths.os_names.length) {
		return paths.os_names.reduce((acc, item, index) => {
			acc.push({
				type: 'icloud',
				os: item,
				path: path.resolve(process.env.HOME, paths.icloud[index])
			});
			acc.push({
				type: 'local',
				os: item,
				path: path.resolve(process.env.HOME, paths.local[index])
			});
			return acc;
		}, []);
	} else {
		throw 'Path arrays are not of same length';
	}
};

ipc.on('load-signatures', function (event) {
	const allPaths = preparePaths(paths);
	async.map(allPaths, (file, cb) => {
		fs.stat(file.path + '/AllSignatures.plist', (err, stats) => {
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
		async.map(folders, (folder, cb) => {
			fs.readFile(folder.path + '/AllSignatures.plist', 'utf8', (err, contents) => {
				if (err) {
					cb(err);
					return;
				}

				let allSigs = plist.parse(contents);
				if (!Array.isArray(allSigs)) {
					allSigs = [];
				}
				async.map(allSigs, (sig, cb) => {
					fs.readFile(folder.path + '/' + sig.SignatureUniqueId + '.mailsignature', 'utf8', (err, sigContent) => {
						if (err) {
							cb(err);
							return;
						}
						cb(null, mailSigUtil.parse(sigContent));
					});
				}, (err, result) => {
					if (err) {
						cb(err);
						return;
					}
					folder.signatures = result;
					cb(null, folder);
				});
			});

		}, (err, data) => {
			if (err) {
				console.error(err);
				event.sender.send('loaded-signatures', err);
				return;
			}

			event.sender.send('loaded-signatures', null, data);
		});

		//async.map(folders, fs.)
	});
});
