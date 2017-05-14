'use babel';

/**
 * Check if autocomplete popup is visible for given editor
 * @param  {TextEditor}  editor
 * @return {Boolean}
 */
export function isAutocompleteVisible(editor) {
	const view = atom.views.getView(editor);
	return view && view.classList.contains('autocomplete-active');
}

/**
 * Returns autocomplete manager from `autocomplete-plus` package
 * @return {AutocompleteManager}
 */
export function getAutocompleteManager() {
	const pkg = atom.packages.getActivePackage('autocomplete-plus');
	return pkg && pkg.mainModule && pkg.mainModule.autocompleteManager;
}

/**
 * Returns prefix from given position in editor that matches given regexp
 * @param  {TextEditor} editor
 * @param  {Point} pos
 * @param  {RegExp} regexp
 * @return {String}
 */
export function getPrefix(editor, pos, regexp) {
	const linePrefix = editor.getTextInBufferRange([[pos.row, 0], pos]);
	const m = linePrefix.match(regexp);
	return m ? m[0] : '';
}

/**
 * Check if given editor has syntax scope `selector` at current cursor position
 * @param  {TextEditor}  editor
 * @param  {String}  selector
 * @return {Boolean}
 */
export function hasScope(editor, selector) {
	return editor.bufferRangeForScopeAtCursor(selector);
}
