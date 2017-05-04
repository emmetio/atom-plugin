'use babel';

import { Range } from 'atom';
import { uniqueRanges } from './utils';

/**
 * Selects containing HTML node for current selection
 * @param  {TextEditor} editor
 * @param  {EmmetEnv} env
 */
export function balanceOutward(editor, env) {
	const selection = editor.getSelectedBufferRange();
	const model = env.documentModel.getModel(editor);
	const node = model && model.nodeForPoint(selection.start, true);

	if (node) {
		// Create inner and outer tag ranges and pick best
		const newSelection = selectionRangesForNode(node, model.type)
		.reverse()
		.find(range => range.containsRange(selection) && !range.isEqual(selection));

		if (newSelection) {
			editor.setSelectedBufferRange(newSelection);
			return true;
		}
	}

	return false;
}

/**
 * Selects inner HTML node for current selection
 * @param  {TextEditor} editor
 * @param  {EmmetEnv} env
 */
export function balanceInward(editor, env) {
	const selection = editor.getSelectedBufferRange();
	const model = env.documentModel.getModel(editor);
	const node = model && model.nodeForPoint(selection.start);

	if (node) {
		let ranges = selectionRangesForNode(node, model.type);
		if (node.firstChild) {
			const innerRanges = selectionRangesForNode(node.firstChild, model.type);
			ranges = uniqueRanges(ranges.concat(innerRanges));
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
			return true;
		}
	}

	return false;
}

/**
 * Returns possible selection ranges for given node
 * @param  {Node}   node
 * @param  {String} modelType Type of node’s model
 * @return {Range[]}
 */
function selectionRangesForNode(node, modelType) {
	return modelType === 'stylesheet'
		? selectionRangesForCSSNode(node)
		: selectionRangesForHTMLNode(node);
}

/**
 * Returns possible selection ranges for given HTML node, from outer to inner
 * @param  {Node} node
 * @return {Range[]}
 */
function selectionRangesForHTMLNode(node) {
	const ranges = [new Range(node.start, node.end)];
	if (node.close) {
		ranges.push(new Range(node.open.end, node.close.start));
	}

	return ranges;
}

/**
 * Returns possible selection ranges for given CSS node, from outer to inner
 * @param  {Node} node
 * @return {Range[]}
 */
function selectionRangesForCSSNode(node) {
	const ranges = [new Range(node.start, node.end)];

	if (node.type === 'property' && node.valueToken) {
		ranges.push(new Range(node.valueToken.start, node.valueToken.end));
	} else if (node.type === 'rule' || node.type === 'at-rule') {
		ranges.push(new Range(node.contentStartToken.end, node.contentEndToken.start));
	}

	return ranges;
}
