'use babel';

import { Range } from 'atom';
import { isSpace } from '@emmetio/stream-reader-utils';
import BufferStreamReader from '../buffer-stream';

const html = {
	before: '<!--',
	after:  '-->'
};

/**
 * Toggles block comment on given editor
 * @param  {TextEditor}    editor
 * @param  {DocumentModel} documentModel
 */
export default function(editor, { documentModel }) {
	const model = documentModel.getModel(editor);
	if (!model) {
		return;
	}

	editor.transact(() => {
		editor.getCursorsOrderedByBufferPosition().reverse()
		.forEach(cursor => {
			const pos = cursor.getBufferPosition();
			const node = model.nodeForPoint(pos);
			if (!node) {
				return;
			}

			if (node.type === 'comment') {
				uncomment(editor, node);
			} else {
				comment(editor, node);
			}
		});
	});
}

/**
 * Comments given node in text editor
 * @param  {TextEditor} editor
 * @param  {Node} node
 */
function comment(editor, node) {
	editor.setTextInBufferRange(new Range(node.end, node.end), ` ${html.after}`);
	editor.setTextInBufferRange(new Range(node.start, node.start), `${html.before} `);
}

/**
 * Un-comments given comment node in text editor
 * @param  {TextEditor} editor
 * @param  {Node} node
 */
function uncomment(editor, node) {
	const range = new Range(node.start, node.end);
	const stream = new BufferStreamReader(editor.getBuffer(), node.start, range);

	// narrow down comment range till meanful content
	stream.pos = node.start.translate([0, html.before.length]);
	stream.eatWhile(isSpace);
	stream.start = stream.pos;

	// Make sure comment ends with proper token
	stream.pos = node.end.translate([0, -html.after.length]);
	if (editor.getTextInBufferRange([stream.pos, node.end]) === html.after) {
		while (!stream.sof()) {
			if (!isSpace(stream.backUp(1))) {
				stream.next();
				break;
			}
		}
	} else {
		stream.pos = node.end;
	}

	editor.setTextInBufferRange(new Range(stream.pos, node.end), '');
	editor.setTextInBufferRange(new Range(node.start, stream.start), '');
}
