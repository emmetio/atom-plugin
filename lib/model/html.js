'use babel';

import { Range, Point } from 'atom';
import parseHTML from '@emmetio/html-matcher';
import BufferStreamReader from '../buffer-stream';

/**
 * Creates DOM-like model for given text editor
 * @param  {TextEditor} editor
 * @param  {String}     syntax
 * @return {Node}
 */
export default function create(editor, syntax = getSyntax(editor)) {
	if (syntax) {
		const stream = new BufferStreamReader(editor.getBuffer());
		const options = { xml: syntax === 'xml' };
		try {
			return new HTMLDocumentModel(syntax, parseHTML(stream, options));
		} catch (err) {
			console.warn(err);
		}
	}
}

/**
 * Returns parser-supported syntax of given editor (either 'html' or 'xml').
 * Returns `null` if editor’s syntax is unsupported
 * @param  {TextEditor} editor
 * @return {String}
 */
export function getSyntax(editor) {
	const scopeDescriptor = editor.getRootScopeDescriptor();
	const m = scopeDescriptor.scopes[0].match(/text\.(html|xml)\b/);
	return m ? m[1] : null;
}

class HTMLDocumentModel {
	constructor(syntax, dom) {
		this.syntax = syntax;
		this.type = 'html';
		this.dom = dom;
	}

	/**
	 * Returns best matching node for given point
	 * @param  {Point}   point
	 * @param  {Boolean} [exclude] Exclude node’s start and end positions from
	 *                             search
	 * @return {Node}
	 */
	nodeForPoint(point, exclude) {
		point = Point.fromObject(point);
		let ctx = this.dom.firstChild;
		let found = null;

		while (ctx) {
			if (Range.fromObject([ctx.start, ctx.end]).containsPoint(point, exclude)) {
				// Found matching tag. Try to find deeper, more accurate match
				found = ctx;
				ctx = ctx.firstChild;
			} else {
				ctx = ctx.nextSibling;
			}
		}

		return found;
	}
}
