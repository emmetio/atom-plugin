'use babel';

import { Range } from 'atom';
import { isSpace } from '@emmetio/stream-reader-utils';
import { getRange, containsPoint } from './utils';
import BufferStreamReader from '../buffer-stream';

/**
 * Gracefully removes tag under cursor
 */
export default function(editor, { documentModel }) {
	const model = documentModel.getModel(editor);

	if (!model) {
		return;
	}

	const cursors = editor.getCursorsOrderedByBufferPosition().reverse();

	editor.transact(() => {
		cursors.forEach(cursor => {
			const pos = cursor.getBufferPosition();
			const node = model.nodeForPoint(pos, true);

			if (!node || node.type !== 'tag') {
				return;
			}

			// Make sure that cursor is inside open or close tag
			if (containsPoint(node.open, pos) || (node.close && containsPoint(node.close, pos))) {
				if (!node.close) {
					// Simply remove unary, self-closed tag
					editor.setTextInBufferRange(getRange(node), '');
				} else {
					// Remove open and close parts and set proper indentation
					const openRange = new Range(node.open.start, findNextNonSpacePoint(editor, node.open.end));
					const closeRange = new Range(findPreviousNonSpacePoint(editor, node.close.start), node.close.end);
					let updateRows = closeRange.start.row - openRange.end.row;
					const indentOffset = editor.indentationForBufferRow(openRange.end.row)
						- editor.indentationForBufferRow(openRange.start.row);

					editor.setTextInBufferRange(closeRange, '');
					editor.setTextInBufferRange(openRange, '');

					if (updateRows) {
						const baseRow = openRange.end.row;
						for (let i = 0, indent, row; i < updateRows; i++) {
							row = baseRow + i;
							indent = editor.indentationForBufferRow(row);
							editor.setIndentationForBufferRow(row, indent - indentOffset);
						}
					}
				}

				cursor.setBufferPosition(node.start);
			}
		});
	});
}

/**
 * Finds position of first non-space character next to given `pos`
 * @param  {TextEditor} editor
 * @param  {Point} pos
 * @return {Point}
 */
function findNextNonSpacePoint(editor, pos) {
	const stream = new BufferStreamReader(editor.getBuffer(), pos);
	stream.eatWhile(isSpace);
	return stream.pos;
}

/**
 * Finds position of first non-space character that precedes given `pos`
 * @param  {TextEditor} editor
 * @param  {Point} pos
 * @return {Point}
 */
function findPreviousNonSpacePoint(editor, pos) {
	const stream = new BufferStreamReader(editor.getBuffer(), pos);
	while (!stream.sof()) {
		if (!isSpace(stream.backUp(1))) {
			stream.next();
			break;
		}
	}

	return stream.pos;
}
