'use strict';

import { CompositeDisposable } from 'atom';
import { markAbbreviation } from './abbreviation-marker';
import detectSyntax from './detect-syntax';

/**
 * As user types in current text editor, marks Emmet abbreviation under caret in
 * text buffer. This abbreviation mark can be used for further analysis and
 * to provide autocomplete suggestions.
 */
export default class MarkerManager {
	constructor() {
		this.editor = null;
		this.subscriptions = new CompositeDisposable();
		this.markAbbreviation = this.markAbbreviation.bind(this);
		this.markAbbreviationForKnownSyntax = this.markAbbreviationForKnownSyntax.bind(this);
		this.subscriptions.add(atom.textEditors.observe(editor => {
			const view = atom.views.getView(editor);

			// attach to initially focused editor
			if (view === document.activeElement.closest('atom-text-editor')) {
				this.setCurrentEditor(editor);
			}

			view.addEventListener('focus', () => this.setCurrentEditor(editor));
		}));
	}

	setCurrentEditor(editor) {
		if (!editor || editor === this.editor) {
			return;
		}

		this._disposeEditor();

		if (!this.isSupportedEditor(editor)) {
			return;
		}

		this.editor = editor;
		this.editorSubscriptions = new CompositeDisposable();
		const buffer = this.editor.getBuffer();

		if (typeof buffer.onDidChangeText === 'function') {
			this.editorSubscriptions.add(buffer.onDidChangeText(this.markAbbreviationForKnownSyntax));
		} else {
			// TODO: Remove this after `TextBuffer.prototype.onDidChangeText` lands on Atom stable.
			this.editorSubscriptions.add(buffer.onDidChange(this.markAbbreviationForKnownSyntax));
		}
	}

	/**
	 * Marks Emmet abbreviation under caret of current editor
	 * @return {DisplayMarker}
	 */
	markAbbreviation() {
		// NB: do not check for `hasExpansions()` here because user have to decide
		// wether he wants to expand abbreviation or move to next tabstop
		if (this.editor) {
			return markAbbreviation(this.editor, this.editor.getCursorBufferPosition());
		}
	}

	/**
	 * Marks Emmet abbreviation under caret only if editor has supported syntax
	 * @return {DisplayMarker}
	 */
	markAbbreviationForKnownSyntax() {
		if (this.editor && detectSyntax(this.editor)) {
			return this.markAbbreviation();
		}
	}

	/**
	 * Check if given editor should receive Emmet abbreviation markers
	 */
	isSupportedEditor(editor) {
		// NB install abbreviation marker for every editor but auto-insert it
		// for known syntaxes only
		return true;
	}

	_disposeEditor() {
		if (this.editorSubscriptions) {
			this.editorSubscriptions.dispose();
		}

		this.editor = this.editorSubscriptions = null;
	}

	dispose() {
		this.subscriptions.dispose();
		this._disposeCurrentEditor();
		this.subscriptions = null;
	}
}

/**
 * Check if given editor contains snippet expansions, e.g. active snippet tabstops
 * @param  {TextEditor}  editor
 * @return {Boolean}
 */
function hasExpansions(editor) {
	const snippetsPkg = atom.packages.getLoadedPackage('snippets');
	if (snippetsPkg && snippetsPkg.mainModule) {
		return snippetsPkg.mainModule.getExpansions(editor)[0];
	}
}
