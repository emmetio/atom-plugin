'use babel';

import { Range } from 'atom';

const selfClosingStyle = {
	html:  '>',
	xhtml: ' />',
	xml:   '/>'
};

/**
 * Splits (`<img />` -> `<img></img>`) or joins (`<img></img>` -> `<img />`) tag
 * declaration
 * @param {TextEditor} editor
 */
export default function splitJoinTag(editor, { documentModel }) {
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

			if (!node.close) {
				splitTag(editor, node, cursor);
			} else {
				joinTag(editor, node, model.syntax);
			}
		});
	});
}

/**
 * Splits given unary (self-closing) tag into opening and closing tags
 * @param  {TextEditor} editor
 * @param  {Node}       node
 * @param  {Cursor}     cursor
 */
function splitTag(editor, node, cursor) {
	const open = getText(editor, node.open);
	const m = open.match(/(\s*\/)?>$/);
	const start = node.open.end.translate([0, m ? -m[0].length : 0]);
	editor.setTextInBufferRange(new Range(start, node.open.end), `></${node.name}>`);

	if (cursor) {
		cursor.setBufferPosition(start.translate([0, 1]));
	}
}

/**
 * Joins given tag into single, unary tag
 * @param  {TextEditor} editor
 * @param  {Node}       node
 * @param  {String}     syntax Host document syntax, defines how self-closing tag
 *                             should be displayed
 */
function joinTag(editor, node, syntax) {
	// Remove everything between the end of opening tag and the end of closing tag
	const open = getText(editor, node.open);
	const m = open.match(/\s*>$/);
	const start = node.open.end.translate([0, m ? -m[0].length : 0]);
	editor.setTextInBufferRange(new Range(start, node.end),
		selfClosingStyle[syntax] || selfClosingStyle.xhtml);
}

function getRange(token) {
	return new Range(token.start, token.end);
}

function getText(editor, token) {
	return editor.getTextInBufferRange(getRange(token));
}
