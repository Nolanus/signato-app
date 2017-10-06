import { constants, access, readFile } from 'fs';
import { resolve } from 'path';
import { exec } from 'child_process';

import { parse as plistParse } from 'fast-plist';
import { decode } from 'quoted-printable';
import { map as asyncMap } from 'async';

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

	constructor(signatureLocation: SignaturesLocation, allSignaturesEntry: AllSignaturesEntry, fileLocked: boolean, signatureFileContents: string) {
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
			throw new Error('Illegal argument, not a valid mailsignature file content');
		}
		this.messageId = messageId[1];
		this.encoding = encoding[1];
		this.mimeVersion = mimeVersion[1];
		this.content = encoding[1] === 'quoted-printable' ? decode(content[0]).trim() : content[0].trim();

	}

	public fileLocked(): boolean {
		return this._fileLocked;
	}

	public filePath(): string {
		return resolve(process.env.HOME, this.path, this.signatureUniqueId + '.mailsignature');
	}

	public changeFileLock(cb: (err: any, file: string, locked: boolean) => void) {
		let file = this.filePath();
		exec('chflags ' + (!this._fileLocked ? '' : 'no') + 'uchg "' + file + '"', (err) => {
			if (!err) {
				this._fileLocked = !this._fileLocked
			}
			cb(err, file, this._fileLocked);
		});
	}

	public static loadAllSignatures(signaturesLocation: SignaturesLocation, cb: (err?: any, signatures?: Signature[]) => void): void {
		readFile(resolve(process.env.HOME, signaturesLocation.path, 'AllSignatures.plist'), 'utf8', (err, contents) => {
				if (err) {
					cb(err);
					return;
				}
				const allSignatures = plistParse(contents);

				if (!Array.isArray(allSignatures)) {
					cb(new Error('Illegal argument, not a valid AllSignatures.plist file content'));
					return;
				}
				asyncMap(allSignatures, (allSignaturesEntry: AllSignaturesEntry, mapCb) => {
					if (!allSignaturesEntry.SignatureUniqueId || !allSignaturesEntry.SignatureName || allSignaturesEntry.SignatureIsRich === undefined) {
						mapCb(new Error('Illegal argument, not a valid AllSignatures.plist file content'));
					}

					const signatureFilePath = resolve(process.env.HOME, signaturesLocation.path, allSignaturesEntry.SignatureUniqueId + '.mailsignature');

					// Test whether we can write the file (the uchg flag is not set)
					access(signatureFilePath, constants.W_OK, (accessErr) => {
						readFile(signatureFilePath, 'utf8', (err, sigFileContent) => {
							if (err) {
								cb(err);
								return;
							}

							try {
								let signature = new Signature(signaturesLocation, allSignaturesEntry, accessErr !== null, sigFileContent);
								mapCb(null, signature);
							} catch (ex) {
								console.warn('Unable to parse ' + signatureFilePath + ': ' + ex);
								mapCb(ex);
							}
						});
					})
				}, (err, result: Signature[]) => {
					if (err) {
						cb(err);
						return;
					}
					cb(null, result);
				});
			}
		);
	}
}
