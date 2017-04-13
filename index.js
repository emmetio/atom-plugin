'use babel';

import { CompositeDisposable } from 'atom';
import autocompleteProviders from './lib/autocomplete';
import MarkerManager from './lib/marker-manager';
import DocumentModel from './lib/model';

// Available actions
import insertLineBreak from './lib/actions/insert-line-break';
import removeMarkers from './lib/actions/remove-markers';
import matchingPair from './lib/actions/matching-pair';
import increment from './lib/actions/increment-decrement';
import removeTag from './lib/actions/remove-tag';
import splitJoinTag from './lib/actions/split-join-tag';
import toggleBlockComment from './lib/actions/toggle-block-comment';
import updateImageSize from './lib/actions/update-image-size';
import convertDataUrl from './lib/actions/convert-data-url';
import evaluateMath from './lib/actions/evaluate-math-expression';
import { balanceInward, balanceOutward } from './lib/actions/balance';
import { nextEditPoint, previousEditPoint } from './lib/actions/edit-point';
import { selectNextItem, selectPreviousItem } from './lib/actions/select-item';

const config = {
	enableMathCompletions: {
		type: 'boolean',
		default: true,
		title: 'Enable evaluated math expression completions',
		description: 'Displays auto-complete popup with evaluated result when you type simple math expression'
	}
};

const incrementFactory = delta =>
	(editor, env, evt) => increment(editor, delta, env, evt);

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
	'select-previous-item': selectPreviousItem,
	'remove-tag': removeTag,
	'split-join-tag': splitJoinTag,
	'toggle-block-comment': toggleBlockComment,
	'update-image-size': updateImageSize,
	'convert-data-url': convertDataUrl,
	'evaluate-math-expression': evaluateMath,
	'increment-number-by-1':   incrementFactory(1),
	'increment-number-by-10':  incrementFactory(10),
	'increment-number-by-0_1': incrementFactory(0.1),
	'decrement-number-by-1':   incrementFactory(-1),
	'decrement-number-by-10':  incrementFactory(-10),
	'decrement-number-by-0_1': incrementFactory(-0.1)
};

export function getAutocomplete() {
	return autocompleteProviders();
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

export { config };
