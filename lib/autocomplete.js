'use strict';

import extract from '@emmetio/extract-abbreviation';
import { expand } from '@emmetio/expand-abbreviation';

const markerId = 'emmet';

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

			// Remove unused look-ahead markers created since previous
			// `getSuggestions()` invocation
			disposeMarkers(editor);

			if (abbr) {
				const snippet = expandAbbreviation(abbr.abbreviation, syntax);
				if (snippet != null) {
					const prefix = abbr.abbreviation.slice(0, bufferPosition.column - abbr.location);
					const suffix = abbr.abbreviation.slice(bufferPosition.column - abbr.location);

					if (suffix) {
						// Add marker at the end of extracted abbreviation.
						// If current snippet will be expanded, this marker
						// will be used to remove suffix afterwards
						const markerRange = [bufferPosition, bufferPosition.traverse([0, suffix.length])];
						editor.markBufferRange(markerRange, {markerId, suffix});
					}

					result.push({
						snippet,
						type: 'snippet',
						displayText: 'Expand abbr',
						replacementPrefix: prefix,
						suggestionPriority: 10,

						// Create history checkpoint so suffix removal can be
						// merged with snippet insertion as a single undo step
						checkpoint: editor.createCheckpoint()
					});
				}
			}

			return result;
		},

		onDidInsertSuggestion({editor, suggestion, triggerPosition}) {
			// remove matched abbreviation suffixes
			const markers = findMarkers(editor);
			if (markers.length) {
				editor.transact(() => {
					markers.forEach(marker => {
						const range = marker.getBufferRange();
						if (editor.getTextInBufferRange(range) === marker.getProperties().suffix) {
							editor.setTextInBufferRange(range, '');
						}
					});
				});

				// group suffix removal with snippets insertion into a single undo point
				editor.groupChangesSinceCheckpoint(suggestion.checkpoint);
			}

			disposeMarkers(editor);
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

function findMarkers(editor) {
	return editor.findMarkers({markerId});
}

function disposeMarkers(editor) {
	findMarkers(editor).forEach(marker => marker.destroy());
}
