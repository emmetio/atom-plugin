'use babel';

import { Range } from 'atom';
import { isSpace } from '@emmetio/stream-reader-utils';
import { getRange, containsPoint } from './utils';
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
export default function(editor, { documentModel }, evt) {
	let handled = false;
	const model = documentModel.getModel(editor);

	if (model) {
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
					handled = true;
				} else if (node.type === 'tag' && ( containsPoint(node.open, pos) || containsPoint(node.close, pos) )) {
					// should comment only if caret is inside either open or close tag
					comment(editor, node);
					handled = true;
				}
			});
		});
	}

	if (!handled) {
		// Pass event to (possibly) default comment handler
		return evt.abortKeyBinding();
	}
}

/**
 * Comments given node in text editor
 * @param  {TextEditor} editor
 * @param  {Node} node
 */
function comment(editor, node) {
	// Should un-comment all child nodes since first.
	// Otherwise it breaks new comment
	iterate(node, n => n.type === 'comment')
	.reverse()
	.forEach(comment => uncomment(editor, comment));

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

/**
 * Iterates on each child node and its decendants and calls `test` function on them.
 * If function returns `true`, node will be added to result
 * NB: don’t use recursion here to avoid possible callstack size exceeding
 * @param  {Node}     node
 * @param  {Function} test
 * @return {Node[]}
 */
function iterate(node, test) {
	const result = []
	let stack = node.children.slice().reverse(), ctx;

	while (stack.length) {
		ctx = stack.pop();
		test(ctx) && result.push(ctx);
		stack = stack.concat( ctx.children.slice().reverse() );
	}

	return result;
}
