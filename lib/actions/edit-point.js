'use babel';

import BufferStreamReader from '../buffer-stream';

const LF           = 10; // \n
const CR           = 13; // \r
const SINGLE_QUOTE = 39; // '
const DOUBLE_QUOTE = 34; // "
const LANGLE       = 60; // <
const RANGLE       = 62; // >

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
 * Check if stream is currently ad code point
 * @param  {BufferStreamReader}  stream
 * @return {Boolean}
 */
function isAtCodePoint(stream) {
	const code = stream.peek();

	// between quotes, looks like an empty attribute value
	return (isQuote(code) && getPrevCode(stream) === code)
		// between tags, e.g. > and <
		|| (code === LANGLE && getPrevCode(stream) === RANGLE)
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

function isQuote(code) {
	return code === SINGLE_QUOTE || code === DOUBLE_QUOTE;
}

function isLineBreak(code) {
	return code === LF || code === CR;
}
