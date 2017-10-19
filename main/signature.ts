import { constants, access, readFile, writeFile } from 'fs';
import { resolve } from 'path';
import { exec } from 'child_process';

import { parse as plistParse } from 'fast-plist';
import { decode } from 'quoted-printable';
import { map as asyncMap, waterfall, map } from 'async';
import * as logger from 'electron-log';

import { SignaturesLocation } from '../data/paths';

export interface AllSignaturesEntry {
	SignatureUniqueId: string;
	SignatureName: string;
	SignatureIsRich: boolean;
}

export enum SignatureType {LOCALE, ICLOUD}

export default class Signature {

	public readonly type: SignatureType;
	public readonly path: string;
	public readonly os: string;

	public readonly signatureIsRich: boolean;
	public signatureName: string;
	public readonly signatureUniqueId: string;
	private _fileLocked: boolean;
	public readonly messageId?: string;
	public readonly encoding?: string;
	public readonly mimeVersion?: string;
	public content?: string;
	public readonly accountURLs: string[];

	constructor(signature: Signature);
	constructor(signatureLocation: SignaturesLocation, allSignaturesEntry: AllSignaturesEntry, fileLocked: boolean, accountURLs: string[], signatureFileContents: string);
	constructor(signature: any, allSignaturesEntry?: AllSignaturesEntry, fileLocked?: boolean, accountURLs?: string[], signatureFileContents?: string) {
		if (signature.signatureUniqueId !== undefined) {
			// It is a Signature object, but propaly on only containing data, no methods
			let sourceSignature = <Signature>signature;
			this.type = sourceSignature.type;
			this.path = sourceSignature.path;
			this.os = sourceSignature.os;
			this.signatureIsRich = sourceSignature.signatureIsRich;
			this.signatureName = sourceSignature.signatureName;
			this.signatureUniqueId = sourceSignature.signatureUniqueId;
			this._fileLocked = sourceSignature._fileLocked;
			this.messageId = sourceSignature.messageId;
			this.encoding = sourceSignature.encoding;
			this.mimeVersion = sourceSignature.mimeVersion;
			this.content = sourceSignature.content;
			this.accountURLs = sourceSignature.accountURLs;
		} else if (allSignaturesEntry && fileLocked !== undefined && signatureFileContents) {
			let signatureLocation = <SignaturesLocation>signature;
			this.path = signatureLocation.path;
			this.os = signatureLocation.os;
			this.type = signatureLocation.type;

			this.signatureIsRich = allSignaturesEntry.SignatureIsRich;
			this.signatureName = allSignaturesEntry.SignatureName;
			this.signatureUniqueId = allSignaturesEntry.SignatureUniqueId;
			this._fileLocked = fileLocked;

			const trimmed = signatureFileContents.trim();
			let encoding = trimmed.match(/^Content-Transfer-Encoding: (.+)$/im);
			let messageId = trimmed.match(/^Message-Id: <([0-9A-F\-]+)>$/im);
			let mimeVersion = trimmed.match(/Mime-Version: (.*)+/im);
			let content = trimmed.match(/^$([\s\S]*)/im);

			if (encoding === null || messageId === null || mimeVersion === null || content === null) {
				logger.info('MailSignature content is ' + signatureFileContents.trim());
				throw new Error('Illegal argument, not a valid mailsignature file content');
			}
			this.messageId = messageId[1];
			this.encoding = encoding[1];
			this.mimeVersion = mimeVersion[1];
			this.content = encoding[1] === 'quoted-printable' ? decode(content[0]).trim() : content[0].trim();
			this.accountURLs = accountURLs || [];
		} else {
			logger.warn('Tried to create a signature with insufficient data provided: ' + JSON.stringify(arguments));
			throw new Error('Tried to create a signature with insufficient data provided');
		}
	}

	public fileLocked(): boolean {
		return this._fileLocked;
	}

	public filePath(): string {
		return resolve(process.env.HOME, this.path, this.signatureUniqueId + '.mailsignature');
	}

	public changeFileLock(cb: (err: any, file: string, locked: boolean) => void) {
		let file = this.filePath();
		logger.debug('Changing file lock for ' + file + ', is currently ' + this._fileLocked);
		exec('chflags ' + (!this._fileLocked ? '' : 'no') + 'uchg "' + file + '"', (err) => {
			if (!err) {
				this._fileLocked = !this._fileLocked;
				logger.debug('Changed file flag without error');
			} else {
				logger.error('Error while changing file lock: ' + err);
			}
			cb(err, file, this._fileLocked);
		});
	}

	private checkFileLock(cb: (err: null, locked: boolean) => void) {
		logger.debug('About to check file write access for  ' + this.filePath());
		access(this.filePath(), constants.W_OK, (accessErr) => {
			logger.debug('File write check produced: ' + accessErr);
			cb(null, accessErr !== null);
		});
	}

	private writeFile(cb: (err: any) => void) {
		logger.debug('Writing new signature file contents to ' + this.filePath());
		writeFile(this.filePath(), 'Content-Transfer-Encoding: 7bit\n' +
			'Content-Type: text/html;\n' +
			'	charset=us-ascii\n' +
			'Message-Id: <' + this.messageId + '>\n' +
			'Mime-Version: ' + this.mimeVersion + '\n' +
			'\n' +
			this.content.replace(/\r?\n|\r/g, ''), {encoding: 'utf8'}, cb);
	}

	public save(cb: (err: any, signatureUniqueId: string) => void) {
		waterfall([
			(cb) => this.checkFileLock(cb),
			(fileLocked, cb) => {
				if (fileLocked) {
					this.changeFileLock(cb);
				} else {
					cb(null);
				}
			},
			(cb) => this.writeFile(cb),
			(cb) => {
				if (this.type === SignatureType.LOCALE) {
					// we need to lock locale files
					this.changeFileLock(cb);
				} else {
					// iCloud files do not need to be locked
					cb(null);
				}
			}
		], (err, result) => {
			if (err) {
				logger.error('Error while saving new signature: ' + err);
			} else {
				logger.info('File ' + this.filePath() + ' saved without errors');
			}
			cb(err, this.signatureUniqueId);
		});
	}

	public static loadAllSignatures(signaturesLocation: SignaturesLocation, cb: (err?: any, signatures?: Signature[]) => void): void {
		map([
				resolve(process.env.HOME, signaturesLocation.path, 'AllSignatures.plist'),
				resolve(process.env.HOME, signaturesLocation.path, 'AccountsMap.plist')
			], (filename, cb) => {
				readFile(filename, 'utf8', (err, contents) => {
					if (err) {
						cb(err);
						return;
					}
					cb(null, plistParse(contents));
				});
			}, (err, [allSignatures, accountsMap]) => {
				if (err) {
					cb(err);
					return;
				}
				logger.debug('Loaded allSignatures file contents:');
				logger.debug(JSON.stringify(allSignatures));
				logger.debug('Loaded AccountsMap file contents:');
				logger.debug(JSON.stringify(accountsMap));

				if (!Array.isArray(allSignatures)) {
					cb(new Error('Illegal argument, not a valid AllSignatures.plist file content'));
					return;
				}
				// Prepare a nice data structure to read mappings from the accounts file
				const signature2Accounts = Object.keys(accountsMap).reduce((acc, key) => {
					let assignment = accountsMap[key];
					assignment.Signatures.reduce((acc, signatureUniqueId) => {
						if (!acc[signatureUniqueId]) {
							acc[signatureUniqueId] = [];
						}
						acc[signatureUniqueId].push(decodeURIComponent(assignment.AccountURL));
						return acc;
					}, acc);
					return acc;
				}, {});
				asyncMap(allSignatures, (allSignaturesEntry: AllSignaturesEntry, mapCb) => {
					if (!allSignaturesEntry.SignatureUniqueId || !allSignaturesEntry.SignatureName || allSignaturesEntry.SignatureIsRich === undefined) {
						mapCb(new Error('Illegal argument, not a valid AllSignatures.plist file content'));
					}

					const signatureFilePath = resolve(process.env.HOME, signaturesLocation.path, allSignaturesEntry.SignatureUniqueId + '.mailsignature');

					// Test whether we can write the file (the uchg flag is not set)
					access(signatureFilePath, constants.W_OK, (accessErr) => {
						readFile(signatureFilePath, 'utf8', (err, sigFileContent) => {
							if (err) {
								logger.error('Error reading file ' + signatureFilePath + ' skipping it (' + err + ')');
								cb(null, null);
								return;
							}

							try {
								let signature = new Signature(signaturesLocation, allSignaturesEntry, accessErr !== null, signature2Accounts[allSignaturesEntry.SignatureUniqueId], sigFileContent);
								mapCb(null, signature);
							} catch (ex) {
								logger.warn('Unable to parse ' + signatureFilePath + ': ' + ex);
								// We can't parse that signature file, so skip it. We later remove all "null" entries from the array
								mapCb(null, null);
							}
						});
					})
				}, (err, result: Signature[]) => {
					if (err) {
						cb(err);
						return;
					}
					// Send an array with all non-null values to the callback
					cb(null, result.filter((item) => item !== null));
				});
			}
		);
	}
}
