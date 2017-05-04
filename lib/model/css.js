'use babel';

import parseCSS from '@emmetio/css-parser';
import SyntaxModel from './syntax-model';
import BufferStreamReader from '../buffer-stream';

/**
 * Creates DOM-like model for given text editor
 * @param  {TextEditor} editor
 * @param  {String}     syntax
 * @return {Node}
 */
export default function create(editor, syntax) {
	const stream = new BufferStreamReader(editor.getBuffer());

	try {
		return new SyntaxModel(parseCSS(stream), 'stylesheet', syntax);
	} catch (err) {
		console.warn(err);
	}
}
