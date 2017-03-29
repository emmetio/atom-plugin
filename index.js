'use babel';

import { CompositeDisposable } from 'atom';
import autocomplete from './lib/autocomplete';
import MarkerManager from './lib/marker-manager';
import DocumentModel from './lib/model';

// Available actions
import insertLineBreak from './lib/actions/insert-line-break';
import removeMarkers from './lib/actions/remove-markers';
import matchingPair from './lib/actions/matching-pair';
import { balanceInward, balanceOutward } from './lib/actions/balance';
import { nextEditPoint, previousEditPoint } from './lib/actions/edit-point';
import { selectNextItem, selectPreviousItem } from './lib/actions/select-item';

let disposables;
const actions = {
	'remove-abbreviation-marker': removeMarkers,
	'insert-formatted-line-break': insertLineBreak,
	'balance-outward': balanceOutward,
	'balance-inward': balanceInward,
	'go-to-next-edit-point': nextEditPoint,
	'go-to-previous-edit-point': previousEditPoint,
	'go-to-matching-pair': matchingPair,
	'select-next-item': selectNextItem,
	'select-previous-item': selectPreviousItem
};

export function getAutocomplete() {
	return autocomplete('*');
}

export function activate() {
	disposables = new CompositeDisposable()

	const markerManager = new MarkerManager();
	const documentModel = new DocumentModel();
	const env = { markerManager, documentModel };

	disposables.add(markerManager);
	disposables.add(documentModel);

	Object.keys(actions).forEach(action => {
		const handler = evt =>
			actions[action](evt.currentTarget.getModel(), env, evt);
		disposables.add(atom.commands.add('atom-text-editor', `emmet:${action}`, handler));
	});
}

export function deactivate() {
	if (disposables) {
		disposables.dispose();
		disposables = null;
	}
}
