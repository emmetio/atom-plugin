'use strict';

import extract from '@emmetio/extract-abbreviation';
import { expand } from '@emmetio/expand-abbreviation';

const field = (index, placeholder) =>
	`\${${index}${placeholder ? ':' + placeholder : ''}}`;

/**
 * Autocomplete provider factory for Atom’s autocomplete+ package.
 * All Emmet abbreviations are expanded as a part of autocomplete suggestion.
 */
export default function(selector) {
	return {
		selector,
		getSuggestions({editor, bufferPosition}) {
			const syntax = 'html';
			const result = [];
			const abbr = extractAbbreviation(editor, bufferPosition);
			console.log('abbr', abbr);

			if (abbr) {
				const snippet = expandAbbreviation(abbr.abbreviation, syntax);
				if (snippet != null) {
					console.log('snippet:', snippet);
					result.push({
						snippet,
						type: 'snippet',
						displayText: 'Expand abbr',
						replacementPrefix: abbr.abbreviation.slice(abbr.location, bufferPosition.column),
						replacementSuffix: abbr.abbreviation.slice(bufferPosition.column),
						suggestionPriority: 10
					});
				}
			}

			return result;
		},

		onDidInsertSuggestion({editor, suggestion, triggerPosition}) {
			const suffix = suggestion.replacementSuffix;
			console.log('suffix', suffix);
			if (suffix) {
				// replace abbreviation suffix (in most cases it’s an autocompleted
				// quotes and braces)
				const start = editor.getCursorBufferPosition();
				const end = start.traverse([0, suffix.length]);
				const range = [start, end];

				console.log('compare with', editor.getTextInBufferRange(range), range);

				if (editor.getTextInBufferRange(range) === suffix) {
					console.log('removed suffix', suffix);
					editor.setTextInBufferRange(range, '', {undo: 'skip'});
				}
			}
		}
	};
}

/**
 * Extracts abbreviation from given position of editor
 * @param  {TextEditor} editor
 * @param  {Point} point
 * @return {Object} Object with `{abbreviation, location}` properties or `null`
 */
function extractAbbreviation(editor, point) {
	const line = editor.lineTextForBufferRow(point.row);
	return extract(line, point.column);
}

/**
 * Expands given abbreviation into Atom snippet
 * @param  {String} abbr   Abbreviation to expand
 * @param  {String} syntax Abbreviation syntax
 * @return {String}
 */
function expandAbbreviation(abbr, syntax) {
	try {
		return expand(abbr, { syntax, field });
	} catch(err) {
		console.error(err);
	}
}
