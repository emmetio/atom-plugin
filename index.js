'use babel';

import autocomplete from './lib/autocomplete';
import MarkerManager from './lib/marker-manager';

let markerManager;

export function getAutocomplete() {
	return autocomplete('*');
}

export function activate() {
	markerManager = new MarkerManager();
	atom.commands.add('atom-text-editor', 'emmet:remove-abbreviation-marker',
		evt => {
			markerManager.clearMarkers();
			evt.abortKeyBinding();
		});
}

export function deactivate() {
	if (markerManager) {
		markerManager.dispose();
		markerManager = null;
	}
}
