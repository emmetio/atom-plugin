'use strict';

import extract from '@emmetio/extract-abbreviation';
import { CompositeDisposable } from 'atom';

const markerId = 'emmet-abbreviation';

/**
 * As user types in current text editor, marks Emmet abbreviation under caret in
 * text buffer. This abbreviation mark can be used for further analysis and
 * to provide autocomplete suggestions.
 */
export default class AbbreviationMarker {
	constructor() {
		console.log('create marker');
		this.editor = null;
		this.subscriptions = new CompositeDisposable();
		this.markAbbreviation = this.markAbbreviation.bind(this);
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
		this.buffer = this.editor.getBuffer();
		this.editorSubscriptions = new CompositeDisposable();

		if (typeof this.buffer.onDidChangeText === 'function') {
			this.editorSubscriptions.add(this.buffer.onDidChangeText(this.markAbbreviation));
		} else {
			// TODO: Remove this after `TextBuffer.prototype.onDidChangeText` lands on Atom stable.
			this.editorSubscriptions.add(this.buffer.onDidChange(this.markAbbreviation));
		}
	}

	/**
	 * Marks Emmet abbreviation under caret of current editor
	 */
	markAbbreviation() {
		if (!this.editor) {
			return;
		}

		const markers = findMarkers(this.editor);
		let markerUnderCaret = findMarkerUnderCaret(this.editor, markers);
		let toRemove;

		if (markerUnderCaret) {
			// Invalidate marker if it spans across multiple lines
			const range = markerUnderCaret.getBufferRange();
			if (range.start.row !== range.end.row) {
				markerUnderCaret = null;
			}
		}

		if (markerUnderCaret) {
			// there’s active marker: simply remove all other markers and let
			// Atom to update marker ranges
			toRemove = markers.filter(marker => marker !== markerUnderCaret);
		} else {
			// no active marker: create it and remove all others
			const caret = this.editor.getCursorBufferPosition();
			const abbr = extractAbbreviation(this.editor, caret);
			if (abbr) {
				const markerRange = [[caret.row, abbr.location], [caret.row, abbr.location + abbr.abbreviation.length]];
				const marker = this.editor.markBufferRange(markerRange, {markerId});
				this.editor.decorateMarker(marker, {
					'type': 'highlight',
					'class': markerId
				});
			}

			toRemove = markers;
		}

		toRemove.forEach(marker => marker.destroy());
	}

	/**
	 * Check if given editor should receive Emmet abbreviation markers
	 */
	isSupportedEditor(editor) {
		const grammar = editor.getGrammar();
		return grammar && grammar.name === 'HTML';
	}

	_disposeEditor() {
		if (this.editorSubscriptions) {
			this.editorSubscriptions.dispose();
		}

		this.editor = this.buffer = this.editorSubscriptions = null;
	}

	dispose() {
		this.subscriptions.dispose();
		this._disposeCurrentEditor();
		this.subscriptions = null;
	}
}

/**
 * Returns list of Emmet abbreviation markers in given editor
 * @param  {TextEditor} editor
 * @return {DisplayMarker[]}
 */
export function findMarkers(editor) {
	return editor.findMarkers({markerId});
}

/**
 * Returns Emmet abbreviation marker (if any) under caret in given editor
 * @param  {TextEditor} editor
 * @param  {DisplayMarker[]} [markers]
 * @return {DisplayMarker}
 */
export function findMarkerUnderCaret(editor, markers) {
	markers = markers || findMarkers(editor);
	const caret = editor.getCursorBufferPosition();
	return markers.find(marker => marker.getBufferRange().containsPoint(caret));
}

/**
 * Extracts abbreviation from given position of editor
 * @param  {TextEditor} editor
 * @param  {Point}      [point]
 * @return {Object}     Object with `{abbreviation, location}` properties or `null`
 */
export function extractAbbreviation(editor, point) {
	point = point || editor.getCursorBufferPosition();
	const line = editor.lineTextForBufferRow(point.row);
	return extract(line, point.column);
}
