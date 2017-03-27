'use babel';

import { Range } from 'atom';

export default function balance(evt, env) {
	return evt.type.includes('-inward')
		? balanceInwardHTML(evt, env)
		: balanceOutwardHTML(evt, env);
}

/**
 * Selects containing HTML node for current selection
 * @param  {Event} evt
 * @param  {EmmetEnv} env
 */
function balanceOutwardHTML(evt, env) {
	const editor = evt.currentTarget.getModel();
	const selection = editor.getSelectedBufferRange();
	const model = env.documentModel.getModel(editor);
	const node = model && model.nodeForPoint(selection.start, true);

	if (!node) {
		return;
	}

	// Create inner and outer tag ranges and pick best
	const newSelection = selectionRangesForNode(node)
	.reverse()
	.find(range => range.containsRange(selection, true));

	if (newSelection) {
		editor.setSelectedBufferRange(newSelection);
	}
}

/**
 * Selectes inner HTML node for current selection
 * @param  {Event} evt
 * @param  {EmmetEnv} env
 */
function balanceInwardHTML(evt, env) {
	const editor = evt.currentTarget.getModel();
	const selection = editor.getSelectedBufferRange();

	// if (selection.isEmpty()) {
	// 	return balanceOutwardHTML(evt, env);
	// }

	const model = env.documentModel.getModel(editor);
	const node = model && model.nodeForPoint(selection.start);

	if (!node) {
		return;
	}

	let ranges = selectionRangesForNode(node);
	if (node.firstChild) {
		const innerRanges = selectionRangesForNode(node.firstChild);
		// It’s possible that outer range on the inner tag is the same as
		// inner range of outer tag (example: '<a><b></b></a>')
		ranges = ranges.concat(innerRanges[0].isEqual(last(ranges))
			? innerRanges.slice(1)
			: innerRanges);
	}

	// Find a new selection: it will be the next range right after the one that
	// matches current selection
	let newSelection = ranges[0];
	for (let i = 0; i < ranges.length; i++) {
		if (ranges[i].isEqual(selection)) {
			newSelection = ranges[i + 1];
			break;
		}
	}

	if (newSelection) {
		editor.setSelectedBufferRange(newSelection);
	}
}

/**
 * Get HTML node from current context
 * @param  {TextEditor} editor
 * @param  {EmmetEnv} env
 * @return {Node}
 */
function nodeForPoint(editor, env) {
	const model = env.documentModel.getModel(editor);
	return model && model.nodeForPoint(editor.getCursorBufferPosition());
}

/**
 * Returns possible selection ranges for given HTML node, from outer to inner
 * @param  {Node} node
 * @return {Range[]}
 */
function selectionRangesForNode(node) {
	const ranges = [new Range(node.start, node.end)];
	if (node.close) {
		ranges.push(new Range(node.open.end, node.close.start));
	}

	return ranges;
}

function last(arr) {
	return arr[arr.length - 1];
}
