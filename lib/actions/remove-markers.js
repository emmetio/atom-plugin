'use babel';

/**
 * Removes Emmet abbreviation markers
 * @param  {Event} evt
 * @param  {Object} env Emmet environment
 */
export default function(evt, { markerManager }) {
	markerManager.clearMarkers();
	evt.abortKeyBinding();
};
