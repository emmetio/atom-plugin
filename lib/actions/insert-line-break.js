'use babel';

/**
 * Inserts formatted line break between tag pairs in HTML
 * @param {CustomEvent} evt
 */
export default function(evt) {
	// Check if we are able to handle action for current editor state.
	// If not, gracefully abort keybinding and allow other plugins to hanle event
	const editor = evt.currentTarget.getModel();
	const cursors = editor.getCursors();

	if (!cursors.some(isInAllowedContext)) {
		return evt.abortKeyBinding();
	}

	// Apply all transformations as a single undo transation
	editor.transact(() => {
		cursors.forEach(cursor => {
			if (isInAllowedContext(cursor)) {
				insertFormattedLineBreak(cursor);
			} else {
				insertLineBreak(cursor);
			}
		});
	});
}

/**
 * Check if given cursor is inside action’s allowed context
 * @param  {TextEditor}  editor
 * @param  {Cursor}  cursor
 * @return {Boolean}
 */
function isInAllowedContext(cursor) {
	return hasScope(cursor.getScopeDescriptor(), '.between-tag-pair.html');
}

/**
 * Check if given scope descriptor contains given scope
 * @param  {ScopeDescriptor}  descriptor
 * @param  {String}  scope
 * @return {Boolean}
 */
function hasScope(descriptor, scope) {
	for (let i = 0; i < descriptor.scopes.length; i++) {
		if (descriptor.scopes[i].includes(scope)) {
			return true;
		}
	}

	return false;
}

/**
 * Inserts simple line break for given cursor
 * @param  {Cursor} cursor
 */
function insertLineBreak(cursor) {
	cursor.selection.insertText(`\n${getLineIndent(cursor)}`, { autoIndent: false });
}

/**
 * Inserts formated line break for given cursor
 * @param  {Cursor} cursor
 */
function insertFormattedLineBreak(cursor) {
	const indent = cursor.editor.getTabText();
	const lineIndent = getLineIndent(cursor);

	cursor.selection.insertText(`\n${lineIndent}${indent}\n${lineIndent}`, { autoIndent: false });

	// Put caret at the end of indented newline
	cursor.moveUp();
	cursor.moveToEndOfLine();
}

function getLineIndent(cursor) {
	const startPos = cursor.selection.getBufferRange().start;
	return cursor.editor.lineTextForBufferRow(startPos.row).match(/^\s*/)[0];
}
