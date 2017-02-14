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
	if (typeof point === 'boolean') {
		force = point;
		point = null;
	}

	point = point || editor.getCursorBufferPosition();
	let line = editor.lineTextForBufferRow(point.row);
	let offset = 0;

	// apply some language-dependent heuristics for better precision.
	const syntax = detectSyntax(editor);
	if (syntax === 'js' || syntax === 'jsx') {
		// Extracting from JS is a bit tricky:
		// 1. Exclude function calls from extractor context
		// 2. When in string, limit extraction context to string contents
		let ctx = editor.bufferRangeForScopeAtCursor('.function-call')
			|| editor.bufferRangeForScopeAtCursor('.method-call');

		if (ctx) {
			const m = editor.getTextInBufferRange(ctx).match(/^.+?\(/);
			if (m) {
				line = m.input.replace(/\)$/, '').slice(m[0].length);
				offset = ctx.start.column + m[0].length;
			}
		} else if (ctx = editor.bufferRangeForScopeAtCursor('.string.quoted')) {
			line = editor.getTextInBufferRange(ctx).slice(1, -1);
			offset = ctx.start.column + 1;
		}
	}

	const extracted = extract(line, point.column - offset);
	if (extracted) {
		extracted.location += offset;
	}

	return extracted;
}
