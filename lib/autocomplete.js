'use strict';

import { findMarker, markAbbreviation } from './abbreviation-marker';

const markerId = 'emmet-abbreviation-suffix';
const baseClass = 'emmet-expand-completion';
const escapeCodes = {
	'<': '&lt;',
	'>': '&gt;',
	'&': '&amp;'
};

/**
 * Autocomplete provider factory for Atom’s autocomplete+ package.
 * All Emmet abbreviations are expanded as a part of autocomplete suggestion.
 */
export default function(selector) {
	return {
		selector,
		suggestionPriority: 100,
		getSuggestions({editor, bufferPosition, activatedManually}) {
			const result = [];

			// Remove unused look-ahead markers created since previous
			// `getSuggestions()` invocation
			disposeMarkers(editor);

			// We should expand marked abbreviation only.
			// If there’s no marked abbreviation, try to mark it but only if
			// user invoked automomplete popup manually
			let marker = findMarker(editor, bufferPosition);
			if (!marker && activatedManually) {
				marker = markAbbreviation(editor, bufferPosition);
			}

			if (marker) {
				const markerRange = marker.getBufferRange();
				const abbr = editor.getTextInBufferRange(markerRange);
				const prefix = abbr.slice(0, bufferPosition.column - markerRange.start.column);
				const suffix = abbr.slice(bufferPosition.column - markerRange.start.column);

				let suffixMarker;
				if (suffix) {
					// Add marker at the end of extracted abbreviation.
					// If current snippet will be expanded, this marker
					// will be used to remove suffix afterwards
					const markerRange = [bufferPosition, bufferPosition.traverse([0, suffix.length])];
					suffixMarker = editor.markBufferRange(markerRange, { markerId });
				}

				const abbreviationData = marker.getProperties().abbreviation;

				result.push({
					snippet: abbreviationData.snippet,
					marker,
					type: 'snippet',
					className: `${baseClass} ${getClassModifier(abbreviationData.snippet)}`,
					replacementPrefix: prefix,
					replacementSuffix: suffix,
					suffixMarker,

					// Create history checkpoint so suffix removal can be
					// merged with snippet insertion as a single undo step
					checkpoint: editor.createCheckpoint()
				});
			}

			return result;
		},

		onDidInsertSuggestion({editor, suggestion, triggerPosition}) {
			// remove matched abbreviation suffix, if any
			const suffix = suggestion.replacementSuffix;
			if (suffix) {
				editor.transact(() => {
					// make sure that suffix wasn’t changed for some reason
					const range = suggestion.suffixMarker.getBufferRange();
					const suffixRange = [range.end.translate([0, -suffix.length]), range.end];
					if (editor.getTextInBufferRange(suffixRange) === suffix) {
						editor.setTextInBufferRange(range, '');
					}
				});

				// group suffix removal with snippets insertion into a single undo point
				editor.groupChangesSinceCheckpoint(suggestion.checkpoint);
			}

			suggestion.marker.destroy();
			disposeMarkers(editor);
		}
	};
}

/**
 * Returns CSS class with size modifier depending on the size of given snippet
 * @param {String} snippet
 * @return {String}
 */
function getClassModifier(snippet) {
	switch (snippet.split('\n').length) {
		case 1:
			return '';
		case 2:
		case 3:
			return `${baseClass}__medium`;
		default:
			return `${baseClass}__small`;
	}
}

function disposeMarkers(editor) {
	editor.findMarkers({markerId}).forEach(marker => marker.destroy());
}

function escapeHTML(code) {
	return code.replace(/[<>&]/g, ch => escapeCodes[ch]);
}
