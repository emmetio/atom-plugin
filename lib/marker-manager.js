'use babel';

import { CompositeDisposable } from 'atom';
import { isStylesheet } from '@emmetio/expand-abbreviation';
import { markAbbreviation, findMarker, clearMarkers } from './abbreviation-marker';
import { extractAbbreviation } from './expand-abbreviation';
import detectSyntax, { hasAutoActivateContext } from './detect-syntax';
import { getAutocompleteManager, hasScope } from './utils';

const pkg = require('../package.json');
let displayPopupOnMove = true;

atom.config.observe(`${pkg.name}.displayPopupOnMove`, value => {
	displayPopupOnMove = value;
});

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
		this.markAbbreviationOnEditorChange = this.markAbbreviationOnEditorChange.bind(this);
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
			this.editorSubscriptions.add(buffer.onDidChangeText(this.markAbbreviationOnEditorChange));
		} else {
			// TODO: Remove this after `TextBuffer.prototype.onDidChangeText` lands on Atom stable.
			this.editorSubscriptions.add(buffer.onDidChange(this.markAbbreviationOnEditorChange));
		}

		// Track cursor position: when cursor enters abbreviation marker and
		// there’s no visible autocomplete popup – display it
		this.editorSubscriptions.add(editor.onDidChangeCursorPosition(({newBufferPosition, oldBufferPosition, textChanged}) => {
			const manager = getAutocompleteManager();

			if (!displayPopupOnMove || textChanged || !manager) {
				return;
			}

			let marker;
			if (marker = findMarker(editor, newBufferPosition)) {
				if (marker.supressAutoPopup) {
					return;
				}

				// Moved into Emmet abbreviation marker: keep autocomplete popup
				// visible so user can see expanded abbreviation
				//
				// Keeping autocomplete popup visible is a bit hacky.
				// `autocomplete-plus` package installs async timer that hides
				// popup on cursor movement. We will forcibly disable this timer
				// when caret is inside Emmet abbreviation marker
				manager.shouldActivate = true;
				manager.cancelHideSuggestionListRequest();

				const view = atom.views.getView(editor);
				atom.commands.dispatch(view, 'autocomplete-plus:activate', { activatedManually: false });
			} else if (marker = findMarker(editor, oldBufferPosition)) {
				// Moved away from Emmet abbreviation: disable our hack
				manager.shouldActivate = false;
				marker.supressAutoPopup = false;
			}
		}));
	}

	/**
	 * Marks Emmet abbreviation under caret of current editor
	 * @return {DisplayMarker}
	 */
	markAbbreviation() {
		// NB: do not check for snippet expansions here because user have to
		// decide wether he wants to expand abbreviation or move to next tabstop
		if (this.editor) {
			return markAbbreviation(this.editor, this.editor.getCursorBufferPosition());
		}
	}

	/**
	 * Returns marker for given editor that matches given position
	 * @param  {TextEditor} [editor]
	 * @param  {Point}      [pos]
	 * @return {AbbreviationMarker}
	 */
	findMarker(editor, pos) {
		return findMarker(editor || this.editor, pos);
	}

	/**
	 * Marks Emmet abbreviation under caret only if editor has supported syntax.
	 * Also, for some syntaxes (like JavaScript) tries to decide if we should
	 * automatically plant marker for current scope
	 * @return {DisplayMarker}
	 */
	markAbbreviationOnEditorChange() {
		if (this.editor && hasAutoActivateContext(this.editor)) {
			if (isStylesheet(detectSyntax(this.editor))) {
				const extracted = extractAbbreviation(this.editor);
				if (!extracted || !extracted.abbreviation) {
					return;
				}

				if (extracted.abbreviation === '.') {
					return null;
				}

				// For property values, mark only color abbreviations
				if (hasScope(this.editor, 'meta.property-value') && !/^#/.test(extracted.abbreviation)) {
					return null;
				}
			}

			return this.markAbbreviation();
		}
	}

	/**
	 * Check if given editor should receive Emmet abbreviation markers
	 * @param {TextEditor} editor
	 */
	isSupportedEditor() {
		// NB install abbreviation marker for every editor but auto-insert it
		// for known syntaxes only
		return true;
	}

	/**
	 * Removes Emmet markers from active editor
	 */
	clearMarkers() {
		if (this.editor) {
			clearMarkers(this.editor);
		}
	}

	_disposeEditor() {
		if (this.editorSubscriptions) {
			this.editorSubscriptions.dispose();
		}

		this.clearMarkers();
		this.editor = this.editorSubscriptions = null;
	}

	dispose() {
		this.subscriptions.dispose();
		this._disposeEditor();
		this.subscriptions = null;
	}
}
