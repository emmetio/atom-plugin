'use strict';

import autocomplete from './lib/autocomplete';
import AbbreviationMarker from './lib/abbreviation-marker';

let marker;

export function getAutocomplete() {
	return autocomplete('.text.html');
}

export function activate() {
	marker = new AbbreviationMarker();
}

export function deactivate() {
	if (marker) {
		marker.dispose();
		marker = null;
	}
}
