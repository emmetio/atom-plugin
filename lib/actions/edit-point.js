'use babel';

import { isQuote } from '@emmetio/stream-reader-utils';
import BufferStreamReader from '../buffer-stream';

const reEmptyLine = /^\s*$/;

/**
 * Moves cursors to next edit points
 * @param  {TextEditor} editor
 */
export function nextEditPoint(editor) {
	const stream = new BufferStreamReader(editor.getBuffer());
	const cursors = editor.getCursorsOrderedByBufferPosition().reverse();

	editor.transact(() => {
		cursors.forEach(cursor => {
			stream.pos = cursor.getBufferPosition();
			while (!stream.eof()) {
				stream.next();
				if (isAtCodePoint(stream)) {
					cursor.setBufferPosition(stream.pos);
					break;
				}
			}
		});
	});
}

/**
 * Moves cursors to previous edit points
 * @param  {TextEditor} editor
 */
export function previousEditPoint(editor) {
	const stream = new BufferStreamReader(editor.getBuffer());
	const cursors = editor.getCursorsOrderedByBufferPosition();

	editor.transact(() => {
		cursors.forEach(cursor => {
			stream.pos = cursor.getBufferPosition();
			while (!stream.sof()) {
				stream.backUp(1);
				if (isAtCodePoint(stream)) {
					cursor.setBufferPosition(stream.pos);
					break;
				}
			}
		});
	});
}

/**
 * Check if stream is currently at edit code point
 * @param  {BufferStreamReader}  stream
 * @return {Boolean}
 */
function isAtCodePoint(stream) {
	const code = stream.peek();

	// between quotes, looks like an empty attribute value
	return (isQuote(code) && getPrevCode(stream) === code)
		// between tags, e.g. > and <
		|| (code === 60 /* < */ && getPrevCode(stream) === 62 /* > */)
		// on empty line
		|| (isLineBreak(code) && reEmptyLine.test(stream.buffer.lineForRow(stream.pos.row)));
}

/**
 * Returns precediong character code for current position
 * @param {BufferStreamReader} stream
 * @return {Number}
 */
function getPrevCode(stream) {
	if (!stream.sof()) {
		const code = stream.backUp(1);
		stream.next();
		return code;
	}
}

function isLineBreak(code) {
	return code === 10 /* \n */ || code === 13 /* \r */;
}
