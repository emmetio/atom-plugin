'use babel';

import { Range } from 'atom';

/**
 * Goes to matching HTML tag pair (open or close tag)
 * @param  {TextEditor} editor
 * @param  {EmmetEnv} env
 */
export default function(editor, env) {
	const pos = editor.getCursorBufferPosition();
	const model = env.documentModel.getModel(editor);
	const node = model && model.nodeForPoint(pos);

	if (node && node.open && node.close) {
		// we should move caret to matching pair only if it’s
		// explicitly inside either open or close part
		if (contains(node.open, pos)) {
			editor.setCursorBufferPosition(node.close.start);
		} else if (contains(node.close, pos)) {
			editor.setCursorBufferPosition(node.open.start);
		}
	}
}

function contains(token, point) {
	return new Range(token.start, token.end).containsPoint(point);
}
