'use strict';

import { createSnippetsRegistry, isStylesheet } from '@emmetio/expand-abbreviation';
import { findMarker, markAbbreviation } from './abbreviation-marker';
import expandAbbreviation from './expand-abbreviation';
import detectSyntax from './detect-syntax';

const markerId = 'emmet-abbreviation-suffix';
const baseClass = 'emmet-expand-completion';
const escapeCodes = {
	'<': '&lt;',
	'>': '&gt;',
	'&': '&amp;'
};
const completionsCache = new Map();

/**
 * Autocomplete provider factory for Atom’s autocomplete+ package.
 * All Emmet abbreviations are expanded as a part of autocomplete suggestion.
 */
export default function(selector) {
	return {
		selector,
		suggestionPriority: 100,
		getSuggestions({editor, bufferPosition, prefix, activatedManually}) {
			const result = [];

			// Remove unused suffix markers created since previous
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

			// add Emmet snippets completions
			return result.concat(getSnippetsCompletions(editor, prefix));
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

			if (suggestion.marker) {
				suggestion.marker.destroy();
			}

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

/**
 * Returns snippets completions for given editor
 * @param  {TextEditor} editor
 * @return {String[]}
 */
function getSnippetsCompletions(editor, prefix) {
	const syntax = detectSyntax(editor);

	if (!syntax || isStylesheet(syntax)) {
		return [];
	}

	if (!completionsCache.has(syntax)) {
		// Create cache with Emmet snippets completions
		const registry = createSnippetsRegistry(syntax);
		const field = (index, placeholder) => placeholder || '';
		const completions = registry.all({type: 'string'}).map(snippet => ({
			text: snippet.key,
			type: 'snippet',
			rightLabel: expandAbbreviation(snippet.value, editor, { syntax, field })
		}));

		completionsCache.set(syntax, completions);
	}

	let completions = completionsCache.get(syntax);

	if (prefix) {
		completions = completions.filter(completion => completion.text.indexOf(prefix) === 0);
	}

	return completions.map(completion => Object.assign({ replacementPrefix: prefix }, completion));
}

function disposeMarkers(editor) {
	editor.findMarkers({markerId}).forEach(marker => marker.destroy());
}

function escapeHTML(code) {
	return code.replace(/[<>&]/g, ch => escapeCodes[ch]);
}
