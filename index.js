'use babel';

import autocomplete from './lib/autocomplete';
import MarkerManager from './lib/marker-manager';

let markerManager;

export function getAutocomplete() {
	return autocomplete('*');
}

export function activate() {
	markerManager = new MarkerManager();
	atom.commands.add('atom-text-editor', 'emmet:remove-abbreviation-marker',
		evt => {
			markerManager.clearMarkers();
			evt.abortKeyBinding();
		});

	// Insert formated line break between tags
	atom.commands.add('atom-text-editor', 'emmet:insert-formatted-line-break', function(evt) {
		const editor = this.getModel();

		if (!editor.hasMultipleCursors()) {
			// TODO support multiple cursors
			const scope = editor.scopeDescriptorForBufferPosition(editor.getCursorBufferPosition());
			for (let i = 0; i < scope.scopes.length; i++) {
				if (scope.scopes[i].includes('.between-tag-pair.html')) {
					return insertFormattedLineBreak(editor);
				}
			}
		}

		evt.abortKeyBinding();
	});
}

export function deactivate() {
	if (markerManager) {
		markerManager.dispose();
		markerManager = null;
	}
}

function insertFormattedLineBreak(editor, cursor) {
	cursor = cursor || editor.getLastCursor();
	const startPos = cursor.selection.getBufferRange().start;

	editor.transact(() => {
		cursor.selection.insertText('\n\t\n', { autoIndent: false });
		editor.normalizeTabsInBufferRange(cursor.selection.getBufferRange());

		// Indent inserted text
		const row = startPos.row;
		const indent = editor.lineTextForBufferRow(row).match(/^\s*/)[0];
		editor.buffer.insert([row + 1, 0], indent);
		editor.buffer.insert([row + 2, 0], indent);

		editor.moveUp();
		editor.moveToEndOfLine();
	});
}
