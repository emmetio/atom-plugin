'use babel';

/**
 * Removes Emmet abbreviation markers
 * @param  {Event} evt
 * @param  {Object} env Emmet environment
 */
export function removeMarkers(editor, { markerManager }, evt) {
	markerManager.clearMarkers();
	evt.abortKeyBinding();
}

/**
 * Supresses autocomplete popup activation on cursor movement inside abbreviation
 * marker
 * @param  {TextEditor} editor
 * @param  {MarkerManager} markerManager
 * @param  {Event} evt
 */
export function supressAutoPopup(editor, { markerManager }, evt) {
	editor.getCursors().forEach(cursor => {
		const marker = markerManager.findMarker(editor, cursor.getBufferPosition());
		if (marker) {
			marker.supressAutoPopup = true;
		}
	});

	evt.abortKeyBinding();
}
