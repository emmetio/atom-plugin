'use strict';

import { extractAbbreviation, parseAbbreviation } from './expand-abbreviation';

const markerId = 'emmet-abbreviation';

/**
 * Returns *valid* Emmet abbreviation marker (if any) for given position of editor
 * @param  {TextEditor}    editor
 * @param  {Point}         pos
 * @return {DisplayMarker}
 */
export function findMarker(editor, pos) {
	const marker = getAllMarkers(editor).find(marker => marker.getBufferRange().containsPoint(pos));
	return isValidMarker(marker, editor) ? marker : null;
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

	const abbr = extractAbbreviation(editor, pos);

	if (abbr && isValidAbbreviation(abbr.abbreviation, editor)) {
		const markerRange = [[pos.row, abbr.location], [pos.row, abbr.location + abbr.abbreviation.length]];
		const marker = editor.markBufferRange(markerRange, {
			markerId,
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
 * Check if given abbreviation marker is valid, e.g. contains valid abbreviation
 * @param  {DisplayMarker}  marker
 * @param  {TextEditor}  editor
 * @return {Boolean}
 */
function isValidMarker(marker, editor) {
	if (!marker) {
		return false;
	}

	// Invalidate marker if it spans across multiple lines
	const range = marker.getBufferRange();
	if (range.start.row !== range.end.row) {
		return false;
	}

	// Invalidate marker if it contains invalid abbreviation
	return isValidAbbreviation(editor.getTextInBufferRange(range), editor);
}

/**
 * Check if given abbreviation is valid, e.g. can be successfully expanded
 * @param  {String}      abbr
 * @param  {TextEditor}  editor
 * @return {Boolean}
 */
function isValidAbbreviation(abbr, editor) {
	try {
		return abbr && !/^\s|\s$/g.test(abbr) && !!parseAbbreviation(abbr, editor);
	} catch (err) {
		return false;
	}
}

function destroyMarker(marker) {
	marker.destroy();
}
