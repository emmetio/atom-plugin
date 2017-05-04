'use babel';

import { CompositeDisposable, Disposable } from 'atom';
import parseHTML from './html';
import parseCSS from './css';

const markupSyntaxes = new Set(['html', 'xhtml', 'xml']);
const stylesheetSyntaxes = new Set(['css', 'less', 'scss']);

/**
 * Creates document model (either CSS or HTML) on-demand and keeps it in sync
 * with editor changes
 */
export default class DocumentModel {
	constructor() {
		this._models = new WeakMap();
		this._disposables = new CompositeDisposable();

		this._disposables.add(
			atom.workspace.observeTextEditors(editor => {
				const disposable = this.observe(editor);
				disposable.add(new Disposable(() => this._disposables.remove(disposable)));
				this._disposables.add(disposable);
			})
		);
	}

	/**
	 * Observes editor lifecycle and updates model state, when required
	 * @param  {TextEditor} editor
	 * @return {CompositeDisposable}
	 */
	observe(editor) {
		const disposable = new CompositeDisposable();
		disposable.add(
			editor.onDidChange(() => this.invalidate(editor)),
			editor.onDidDestroy(() => {
				this.invalidate(editor);
				disposable.dispose();
			})
		);

		return disposable;
	}

	/**
	 * Invalidates model for given text editor
	 * @param  {TextBuffer} editor
	 */
	invalidate(editor) {
		this._models.delete(editor);
	}

	/**
	 * Returns model for given editor.
	 * @param  {TextEditor} editor
	 * @return {Node}       Returns `null` if no valid model is available for
	 *                      given editor.
	 */
	getModel(editor) {
		if (!this._models.has(editor)) {
			const syntax = getSyntax(editor);
			let model;

			if (markupSyntaxes.has(syntax)) {
				model = parseHTML(editor, syntax);
			} else if (stylesheetSyntaxes.has(syntax)) {
				model = parseCSS(editor, syntax);
			}

			this._models.set(editor, model);
		}

		return this._models.get(editor);
	}

	dispose() {
		this._disposables.dispose();
	}
}

/**
 * Returns parser-supported syntax of given editor (like 'html', 'css' etc.).
 * Returns `null` if editor’s syntax is unsupported
 * @param  {TextEditor} editor
 * @return {String}
 */
function getSyntax(editor) {
	const scope = editor.getRootScopeDescriptor().scopes[0];
	let m;

	// check for HTML-like document
	if (m = scope.match(/text\.(html|xml)\b/)) {
		return m[1];
	}

	// check for stylesheet document
	if (m = scope.match(/source\.css(?:\.(\w+))?\b/)) {
		return m[1] || 'css';
	}

	return null;
}
