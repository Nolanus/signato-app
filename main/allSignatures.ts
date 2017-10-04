import { readFile, access, constants } from 'fs';

import { parse as plistParse } from 'fast-plist';
import { map } from 'async';

import MailSignatureContent from './mailsignature';

export interface Signature {
    signatureIsRich: boolean;
    signatureName: string;
    readonly signatureUniqueId: string;
    readonly fileLocked: boolean;
    readonly messageId?: string;
    readonly encoding?: string;
    readonly mimeVersion?: string;
    content?: string;
}

export default class AllSignatures {

    public signatures: Signature[] = [];

    constructor(private folderPath: string) {
    }

    /**
     * Load all the data from the files.
     * @param cb Will be called with an error in case something goes wrong. Afterwards the public signatures property will be populated.
     */
    public load(cb) {
        readFile(this.folderPath + '/AllSignatures.plist', 'utf8', (err, contents) => {
            if (err) {
                cb(err);
                return;
            }
            const allSignatures = plistParse(contents);

            if (!Array.isArray(allSignatures)) {
                throw new Error('Illegal argument, not a valid AllSignatures.plist file content');
            }
            map(allSignatures, (allSignaturesEntry, cb) => {
                if (!allSignaturesEntry.SignatureUniqueId || !allSignaturesEntry.SignatureName || allSignaturesEntry.SignatureIsRich === undefined) {
                    throw new Error('Illegal argument, not a valid AllSignatures.plist file content');
                }

                // Test whether we can write the file (the uchg flag is not set)
                access(this.buildSignatureFilePath(allSignaturesEntry.SignatureUniqueId), constants.W_OK, (err) => {

                    let signature: Signature = {
                        signatureIsRich: allSignaturesEntry.SignatureIsRich,
                        signatureName: allSignaturesEntry.SignatureName,
                        signatureUniqueId: allSignaturesEntry.SignatureUniqueId,
                        fileLocked: err !== null,
                    };

                    readFile(this.getSignatureFilePath(signature), 'utf8', (err, sigFileContent) => {
                        if (err) {
                            cb(err);
                            return;
                        }
                        try {
                            signature = MailSignatureContent.parse(sigFileContent, signature);
                        } catch (ex) {
                            console.warn('Unable to parse ' + this.getSignatureFilePath(signature) + ': ' + ex);
                        }
                        cb(null, signature);
                    });
                })
            }, (err, result: Signature[]) => {
                if (err) {
                    cb(err);
                    return;
                }
                this.signatures = result;
                cb(null);
            });
        });
    }


    private getSignatureFilePath(signature: Signature): string {
        return this.buildSignatureFilePath(signature.signatureUniqueId);
    }

    private buildSignatureFilePath(signatureUniqueId: string): string {
        return this.folderPath + '/' + signatureUniqueId + '.mailsignature';
    }

    // TODO maybe add a write method here
}
