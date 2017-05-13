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
