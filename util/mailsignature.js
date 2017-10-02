const quotedPrintable = require('quoted-printable');

module.exports = {
	parse: function (contents) {
		const trimmed = contents.trim();
		const value = {};

		let encoding = trimmed.match(/^Content-Transfer-Encoding: (.+)$/im);
		if (encoding === null) {
			return null;
		}
		value.encoding = encoding[1];

		let messageId = trimmed.match(/^Message-Id: <([0-9A-F\-]+)>$/im);
		if (messageId === null) {
			return null;
		}
		value.messageId = messageId[1];

		let mimeVersion = trimmed.match(/Mime-Version: (.*)+/im);
		if (mimeVersion === null) {
			return null;
		}
		value.mimeVersion = mimeVersion[1];

		let content = trimmed.match(/^$([\s\S]*)/im);
		if (content === null) {
			return null;
		}
		if (value.encoding === 'quoted-printable') {
			value.content = quotedPrintable.decode(content[0]);
		} else {
			value.content = content[0].trim();
		}
		return value;
	},

	write: function (value) {
		return `Content-Transfer-Encoding: 7bit` +
			`Content-Type: text/html;` +
			`	charset=utf8` +
			`Message-Id: <${value.messageId}>` +
			`Mime-Version: ${value.mimeVersion}` +
			`` +
			`${value.content}`;
	}
};
