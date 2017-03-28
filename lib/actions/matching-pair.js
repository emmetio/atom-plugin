'use babel';

import { Range } from 'atom';

/**
 * Goes to matching HTML tag pair (open or close tag)
 * @param  {TextEditor} editor
 * @param  {EmmetEnv} env
 */
export default function(editor, env) {
	const model = env.documentModel.getModel(editor);

	if (!model) {
		return;
	}

	const cursors = editor.getCursorsOrderedByBufferPosition().reverse();

	editor.transact(() => {
		cursors.forEach(cursor => {
			const pos = cursor.getBufferPosition();
			const node = model.nodeForPoint(pos);

			if (node && node.open && node.close) {
				// we should move caret to matching pair only if it’s
				// explicitly inside either open or close part
				if (contains(node.open, pos)) {
					editor.setBufferPosition(node.close.start);
				} else if (contains(node.close, pos)) {
					editor.setBufferPosition(node.open.start);
				}
			}
		});
	});
}

function contains(token, point) {
	return new Range(token.start, token.end).containsPoint(point);
}
