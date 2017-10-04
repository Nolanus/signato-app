import { decode } from 'quoted-printable';
import { Signature } from "./allSignatures";

export default class MailSignatureContent {

    public static parse(contents: string, base: Signature): Signature {
        if (!base) {
            throw new Error('Illegal value for base signature');
        }
        const trimmed = contents.trim();
        let encoding = trimmed.match(/^Content-Transfer-Encoding: (.+)$/im);
        let messageId = trimmed.match(/^Message-Id: <([0-9A-F\-]+)>$/im);
        let mimeVersion = trimmed.match(/Mime-Version: (.*)+/im);
        let content = trimmed.match(/^$([\s\S]*)/im);

        if (encoding === null || messageId === null || mimeVersion === null || content === null) {
            throw new Error('Illegal argument, not a valid mailsignature file content');
        }

        return {
            signatureUniqueId: base.signatureUniqueId,
            signatureIsRich: base.signatureIsRich,
            signatureName: base.signatureName,
            fileLocked: base.fileLocked,
            messageId: messageId[1],
            encoding: encoding[1],
            mimeVersion: mimeVersion[1],
            content: encoding[1] === 'quoted-printable' ? decode(content[0]).trim() : content[0].trim()
        };

    }

    public static write(signature: Signature): string {
        return `Content-Transfer-Encoding: 7bit` +
            `Content-Type: text/html;` +
            `	charset=utf8` +
            `Message-Id: <${signature.signatureUniqueId}>` +
            `Mime-Version: ${signature.mimeVersion}` +
            `` +
            `${signature.content}`;
    }

}
