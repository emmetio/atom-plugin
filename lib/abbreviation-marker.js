'use strict';

import expandAbbreviation, { extractAbbreviation, parseAbbreviation } from './expand-abbreviation';

const markerId = 'emmet-abbreviation';

/**
 * Returns *valid* Emmet abbreviation marker (if any) for given position of editor
 * @param  {TextEditor}    editor
 * @param  {Point}         pos
 * @return {DisplayMarker}
 */
export function findMarker(editor, pos) {
	const marker = getAllMarkers(editor).find(marker => marker.getBufferRange().containsPoint(pos));
	return validateMarker(marker, editor);
}

/**
 * Marks Emmet abbreviation for given editor position, if possible
 * @param  {TextEditor} editor
 * @param  {Point}      pos
 * @return {DisplayMarker} Returns `undefined` if no valid abbreviation under caret
 */
export function markAbbreviation(editor, pos) {
	const marker = findMarker(editor, pos);
	if (marker) {
		// there’s active marker with valid abbreviation
		return marker;
	}

	// No active marker: remove previous markers and create new one, if possible
	getAllMarkers(editor).forEach(destroyMarker);

	const extractedAbbr = extractAbbreviation(editor, pos);
	const abbreviation = extractedAbbr && parsedAbbreviationData(extractedAbbr.abbreviation, editor);

	if (abbreviation) {
		const markerRange = [
			[pos.row, extractedAbbr.location],
			[pos.row, extractedAbbr.location + extractedAbbr.abbreviation.length]
		];
		const marker = editor.markBufferRange(markerRange, {
			markerId,
			abbreviation,
			invalidate: 'never'
		});

		editor.decorateMarker(marker, {
			'type': 'highlight',
			'class': markerId
		});

		return marker;
	}
}

/**
 * Returns list of Emmet abbreviation markers in given editor
 * @param  {TextEditor} editor
 * @return {DisplayMarker[]}
 */
function getAllMarkers(editor) {
	return editor.findMarkers({markerId});
}

/**
 * Ensures that given marker contains valid Emmet abbreviation. Returns updated
 * marker if it’s valid or `null` otherwise
 * @param  {DisplayMarker}  marker
 * @param  {TextEditor}  editor
 * @return {DisplayMarker}
 */
function validateMarker(marker, editor) {
	if (!marker) {
		return null;
	}

	// Invalidate marker if it spans across multiple lines
	const range = marker.getBufferRange();
	if (range.start.row !== range.end.row) {
		return false;
	}

	// Invalidate marker if it contains invalid abbreviation
	const text = editor.getTextInBufferRange(range);
	if (!text || /^\s|\s$/g.test(text)) {
		return null;
	}

	let abbrData = marker.getProperties().abbreviation;
	if (abbrData && abbrData.text !== text) {
		// marker contents was updated, re-parse abbreviation
		abbrData = parsedAbbreviationData(text, editor);
	}

	if (!abbrData) {
		return null;
	}

	marker.setProperties({ abbreviation: abbrData });
	return marker;
}

/**
 * Returns parsed abbreviation data: object with `ast` and `snippet` properties
 * that contains parsed and expanded abbreviation respectively
 * @param  {String} abbr
 * @param  {TextEditor} editor
 * @return {Object} Returns `null` if abbreviation cannot be parsed
 */
function parsedAbbreviationData(abbr, editor) {
	try {
		const ast = parseAbbreviation(abbr, editor);
		return {
			text: abbr,
			ast,
			snippet: expandAbbreviation(ast, editor)
		};
	} catch (err) {
		return null;
	}
}

function destroyMarker(marker) {
	marker.destroy();
}
