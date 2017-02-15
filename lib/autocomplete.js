'use strict';

import { createSnippetsRegistry, isStylesheet } from '@emmetio/expand-abbreviation';
import { findMarker, markAbbreviation } from './abbreviation-marker';
import expandAbbreviation from './expand-abbreviation';
import detectSyntax, { hasAutoActivateContext } from './detect-syntax';

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
		getSuggestions(event) {
			const {editor, prefix, activatedManually} = event;

			// Remove unused suffix markers created since previous
			// `getSuggestions()` invocation
			disposeMarkers(editor);

			// Add Emmet completions for given prefix. If no prefix,
			// add completions only if activated manually
			if ((prefix && hasAutoActivateContext(editor)) || activatedManually) {
				return [getExpandedAbbreviationCompletion(event)]
				.concat(getSnippetsCompletions(editor, prefix))
				.filter(Boolean);
			}
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
 * Returns completion option for Emmet abbreviation found in given autocomplete
 * invocation options
 * @param {Object}  event Autocomplete invocation event
 * @return {Object} Completion with expanded Emmet abbreviation or `null` if
 * no valid abbreviation found at given context
 */
function getExpandedAbbreviationCompletion({editor, bufferPosition, prefix, activatedManually}) {
	// We should expand marked abbreviation only.
	// If there’s no marked abbreviation, try to mark it but only if
	// user invoked automomplete popup manually
	let marker = findMarker(editor, bufferPosition);
	if (!marker && activatedManually) {
		marker = markAbbreviation(editor, bufferPosition, activatedManually);
	}

	if (marker) {
		const abbreviationData = marker.getProperties().abbreviation;

		// For some syntaxes like Pug, it’s possible that extracted abbreviation
		// matches prefix itself (e.g. `li.class` expands to `li.class` in Pug)
		// In this case skip completion output.
		// NB: use quick and dirty way to remove fields from snippet by RegExp
		if (abbreviationData.snippet.replace(/\$\{\d+(:[^\}])?\}/g, '') === prefix) {
			return null;
		}

		const markerRange = marker.getBufferRange();
		const abbr = editor.getTextInBufferRange(markerRange);
		const abbrPrefix = abbr.slice(0, bufferPosition.column - markerRange.start.column);
		const abbrSuffix = abbr.slice(bufferPosition.column - markerRange.start.column);

		let suffixMarker;
		if (abbrSuffix) {
			// Add marker at the end of extracted abbreviation.
			// If current snippet will be expanded, this marker
			// will be used to remove suffix afterwards
			const suffixRange = [bufferPosition, bufferPosition.traverse([0, abbrSuffix.length])];
			suffixMarker = editor.markBufferRange(suffixRange, { markerId });
		}

		return {
			snippet: abbreviationData.snippet,
			marker,
			type: 'snippet',
			className: `${baseClass} ${getClassModifier(abbreviationData.snippet)}`,
			replacementPrefix: abbrPrefix,
			replacementSuffix: abbrSuffix,
			suffixMarker,

			// Create history checkpoint so suffix removal can be
			// merged with snippet insertion as a single undo step
			checkpoint: editor.createCheckpoint()
		};
	}
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
