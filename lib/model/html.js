'use babel';

import parseHTML from '@emmetio/html-matcher';
import BufferStreamReader from '../buffer-stream';

/**
 * Parses given editor content into DOM-like structure
 * @param  {TextEditor} editor
 * @param  {String}     syntax
 * @return {Node}
 */
export default function parse(editor, syntax = getSyntax(editor)) {
	if (syntax) {
		const stream = new BufferStreamReader(editor.getBuffer());
		return parseHTML(stream, { xml: syntax === 'xml' });
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
