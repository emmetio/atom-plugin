'use babel';

import { containsPoint } from './utils';

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
				if (containsPoint(node.open, pos)) {
					cursor.setBufferPosition(node.close.start);
				} else if (containsPoint(node.close, pos)) {
					cursor.setBufferPosition(node.open.start);
				}
			}
		});
	});
}
