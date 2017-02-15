'use strict';

import autocomplete from './lib/autocomplete';
import MarkerManager from './lib/marker-manager';

let markerManager;

export function getAutocomplete() {
	return autocomplete('*');
}

export function activate() {
	markerManager = new MarkerManager();
}

export function deactivate() {
	if (markerManager) {
		markerManager.dispose();
		markerManager = null;
	}
}
