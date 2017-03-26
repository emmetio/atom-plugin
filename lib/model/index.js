'use babel';

import { CompositeDisposable, Disposable } from 'atom';
import parseHTML from './html';

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
			this._models.set(editor, parseHTML(editor));
		}

		return this._models.get(editor);
	}

	dispose() {
		this._disposables.dispose();
	}
}
