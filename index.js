'use strict';

import autocomplete from './lib/autocomplete';
import MarkerManager from './lib/marker-manager';

let marker;

export function getAutocomplete() {
	return autocomplete('.text.html');
}

export function activate() {
	marker = new MarkerManager();
}

export function deactivate() {
	if (marker) {
		marker.dispose();
		marker = null;
	}
}
