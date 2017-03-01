'use babel';

import { Emitter, CompositeDisposable } from 'atom';
import expandAbbreviation, { extractAbbreviation, parseAbbreviation } from './expand-abbreviation';

const markersCache = new WeakMap();

/**
 * Returns *valid* Emmet abbreviation marker (if any) for given position of editor
 * @param  {TextEditor}    editor
 * @param  {Point}         [pos]
 * @return {DisplayMarker}
 */
export function findMarker(editor, pos) {
	const marker = markersCache.get(editor);
	if (marker && (!pos || marker.getRange().containsPoint(pos))) {
		return marker;
	}
}

/**
 * Marks Emmet abbreviation for given editor position, if possible
 * @param  {TextEditor} editor   Editor where abbreviation marker should be created
 * @param  {Point}      pos      Buffer position where abbreviation should be created.
 *                               Abbreviation will be automatically extracted from
 *                               given position
 * @param  {Boolean}    [forced] Indicates that user forcibly requested abbreviation
 *                               marker (e.g. was not activated automatically).
 *                               Affects abbreviation detection policy
 * @return {DisplayMarker} Returns `undefined` if no valid abbreviation under caret
 */
export function markAbbreviation(editor, pos, forced) {
	const marker = findMarker(editor, pos);
	if (marker) {
		// there’s active marker with valid abbreviation
		return marker;
	}

	// No active marker: remove previous markers and create new one, if possible
	clearMarkers(editor);

	const extracted = extractAbbreviation(editor, pos);
	const model = extracted && createAbbreviationModel(extracted.abbreviation, editor);

	if (model && (forced || allowedForAutoActivation(model))) {
		const markerRange = [
			[pos.row, extracted.location],
			[pos.row, extracted.location + extracted.abbreviation.length]
		];

		const marker = new AbbreviationMarker(editor, model, markerRange);
		markersCache.set(editor, marker);
		marker.onDidDestroy(() => markersCache.delete(editor));

		return marker;
	}
}

/**
 * Removes Emmmet abbreviation markers from given editor
 * @param  {TextEditor} editor
 */
export function clearMarkers(editor) {
	const marker = findMarker(editor);
	if (marker) {
		marker.destroy();
	}
}

class AbbreviationMarker {
	constructor(editor, abbrModel, range) {
		this._destroyed = false;
		this._subscriptions = new CompositeDisposable();
		this._emitter = new Emitter();
		this.editor = editor;
		this.model = abbrModel;

		this.editorMarker = editor.markBufferRange(range, { invalidate: 'never' });
		this._subscriptions.add(
			this.editorMarker.onDidChange(({textChanged}) => {
				if (textChanged && !this.validate()) {
					this.destroy();
				}
			})
		);

		this._subscriptions.add(this.editorMarker.onDidDestroy(this.destroy.bind(this)));

		editor.decorateMarker(this.editorMarker, {
			'type': 'highlight',
			'class': 'emmet-abbreviation'
		});

		toggleEditorClass(editor, true);
	}

	get id() {
		return this.editorMarker.id;
	}

	/**
	 * Returns buffer range of current marker
	 * @return {Range}
	 */
	getRange() {
		return this.editorMarker.getBufferRange();
	}

	/**
	 * Ensures that current editor marker text contains valid Emmet abbreviation
	 * and updates abbreviation model if required
	 * @return {Boolean} `true` if marker contains valid abbreviation
	 */
	validate() {
		const range = this.getRange();
		if (range.start.row !== range.end.row) {
			return false;
		}

		// Make sure marker contains valid abbreviation
		const text = this.editor.getTextInBufferRange(range);
		if (!text || /^\s|\s$/g.test(text)) {
			return false;
		}

		if (!this.model || this.model.abbreviation !== text) {
			// marker contents was updated, re-parse abbreviation
			this.model = createAbbreviationModel(text, this.editor);
		}

		return !!(this.model && this.model.snippet);
	}

	onDidDestroy(callback) {
		return this._emitter.on('did-destroy', callback);
	}

	destroy() {
		if (!this._destroyed) {
			this._destroyed = true;
			toggleEditorClass(this.editor, false);
			this._emitter.emit('did-destroy');
			this._emitter.dispose();
			this._subscriptions.dispose();
			this.editorMarker.destroy();

			this._subscriptions = this._emitter = this.editor =
				this.editorMarker = this.model = null;
		}
	}
}

/**
 * Returns abbreviation model: object with `ast` and `snippet` properties
 * that contains parsed and expanded abbreviation respectively
 * @param  {String} abbreviation
 * @param  {TextEditor} editor
 * @return {Object} Returns `null` if abbreviation cannot be parsed
 */
function createAbbreviationModel(abbreviation, editor) {
	try {
		const ast = parseAbbreviation(abbreviation, editor);
		return {
			ast,
			abbreviation,
			snippet: expandAbbreviation(abbreviation, editor)
		};
	} catch (err) {
		return null;
	}
}

/**
 * Toggles HTML class on given editor view indicating whether Emmet abbreviation
 * is available in given editor
 * @param  {TextEditor} editor  [description]
 * @param  {Boolean} enabled
 */
function toggleEditorClass(editor, enabled) {
	const view = atom.views.getView(editor);
	if (view) {
		view.classList.toggle('has-emmet-abbreviation', enabled);
	}
}

/**
 * Check if given abbreviation model is allowed for auti-activated abbreviation
 * marker. Used to reduce falsy activations
 * @param  {Object} model Parsed abbreviation model (see `createAbbreviationModel()`)
 * @return {Boolean}
 */
function allowedForAutoActivation(model) {
	const rootNode = model.ast.children[0];
	// The very first node should start with alpha character
	// Skips falsy activations for something like `$foo` etc.
	return rootNode && /^[a-z]/i.test(rootNode.name);
}
