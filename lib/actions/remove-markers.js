'use babel';

/**
 * Removes Emmet abbreviation markers
 * @param  {Event} evt
 * @param  {Object} env Emmet environment
 */
export default function(editor, { markerManager }, evt) {
	markerManager.clearMarkers();
	evt.abortKeyBinding();
};
