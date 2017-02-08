'use string';

import extract from '@emmetio/extract-abbreviation';
import { expand, parse } from '@emmetio/expand-abbreviation';

const editorField = (index, placeholder) =>
	`\${${index}${placeholder ? ':' + placeholder : ''}}`;


/**
 * Expands given abbreviation for given editor.
 * The editor is used to detect abbreviation syntax and provide
 * tag context for markup abbreviations
 * @param  {String|Node} abbr
 * @param  {TextEditor}  editor
 * @return {String}
 * @throws Error if avvreviation is invalid
 */
export default function expandAbbreviation(abbr, editor) {
	return expand(abbr, {
		syntax: getSyntax(editor),
		field: editorField
	});
}

/**
 * Parses abbreviation for given editor
 * @param  {String} abbr
 * @param  {TextEditor} editor
 * @return {Node}
 * @throws Error if avvreviation is invalid
 */
export function parseAbbreviation(abbr, editor) {
	return parse(abbr, { syntax: getSyntax(editor) });
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

function getSyntax(editor) {
	// TODO detect syntax from editor
	return 'html';
}
