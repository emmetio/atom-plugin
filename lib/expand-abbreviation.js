'use string';

import extract from '@emmetio/extract-abbreviation';
import { expand, parse } from '@emmetio/expand-abbreviation';
import detectSyntax from './detect-syntax';

const editorField = (index, placeholder) =>
	`\${${index}${placeholder ? ':' + placeholder : ''}}`;


/**
 * Expands given abbreviation for given editor.
 * The editor is used to detect abbreviation syntax and provide
 * tag context for markup abbreviations
 * @param  {String|Node} abbr
 * @param  {TextEditor}  editor
 * @return {String}
 * @throws Error if abbreviation is invalid
 */
export default function expandAbbreviation(abbr, editor, options) {
	return expand(abbr, Object.assign({
		syntax: detectSyntax(editor),
		field: editorField
	}, options));
}

/**
 * Parses abbreviation for given editor
 * @param  {String} abbr
 * @param  {TextEditor} editor
 * @return {Node}
 * @throws Error if abbreviation is invalid
 */
export function parseAbbreviation(abbr, editor) {
	return parse(abbr, { syntax: detectSyntax(editor) });
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
