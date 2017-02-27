'use babel';

import autocomplete from './lib/autocomplete';
import MarkerManager from './lib/marker-manager';

// Available actions
import insertLineBreak from './lib/actions/insert-line-break';

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

	atom.commands.add('atom-text-editor', 'emmet:insert-formatted-line-break', insertLineBreak);
}

export function deactivate() {
	if (markerManager) {
		markerManager.dispose();
		markerManager = null;
	}
}
