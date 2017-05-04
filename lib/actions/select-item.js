'use babel';

import { isSpace, isQuote } from '@emmetio/stream-reader-utils';
import { Range } from 'atom';
import { getRange, uniqueRanges } from './utils';

/**
 * Selects useful HTML token (attribute, attribute value, class etc) next
 * to caret position
 * @param  {TextEditor} editor
 * @param  {EmmetEnv}   env
 */
export function selectNextItem(editor, env) {
	const model = env.documentModel.getModel(editor);

	if (model) {
		editor.transact(() => {
			const selections = editor.getSelectedBufferRanges()
			.map(anchor => getNextHTMLItemRange(model, anchor) || anchor);

			editor.setSelectedBufferRanges(selections);
		});
	}
}

/**
 * Selects useful HTML token (attribute, attribute value, class etc) previous
 * to caret position
 * @param  {TextEditor} editor
 * @param  {EmmetEnv}   env
 */
export function selectPreviousItem(editor, env) {
	const model = env.documentModel.getModel(editor);

	if (model) {
		editor.transact(() => {
			const selections = editor.getSelectedBufferRanges()
			.map(anchor => getPreviousHTMLItemRange(model, anchor) || anchor);

			editor.setSelectedBufferRanges(selections);
		});
	}
}

/**
 * Returns selection range of useful HTML token next to given `anchor` range
 * @param  {HTMLModel} model
 * @param  {Range}     anchor
 * @return {Range}
 */
function getNextHTMLItemRange(model, anchor) {
	// Find HTML node for next selection
	let node = model.nodeForPoint(anchor.start)
		// Looks like caret is outside of any top-level node. Find next one
		|| model.dom.children.find(node => node.start.isGreaterThanOrEqual(anchor.end));

	let range;

	// We might need to narrow down node context to find best token match
	while (node && !range) {
		if (node.type === 'tag') {
			range = getNextRange(getRangesFromHTMLNode(node), anchor);
		}
		node = node.firstChild || nextSibling(node);
	}

	return range;
}

/**
 * Returns selection range of useful HTML token that precedes given `anchor` range
 * @param  {HTMLModel} model
 * @param  {Range}     anchor
 * @return {Range}
 */
function getPreviousHTMLItemRange(model, anchor) {
	// Find HTML node for next selection
	let node = model.nodeForPoint(anchor.start);

	if (!node) {
		// Looks like caret is outside of any top-level node. Find deepest child
		// of previous one
		const nodeSet =  model.dom.children.filter(node => node.end.isLessThanOrEqual(anchor.start));
		node = deepestChild(last(nodeSet));
	}

	let range;

	// We might need to narrow down node context to find best token match
	while (node && !range) {
		if (node.type === 'tag') {
			range = getPreviousRange(getRangesFromHTMLNode(node), anchor);
		}

		node = previousSibling(node) || node.parent;
	}

	return range;
}

/**
 * Tries to find range that equals given `anchor` range in `ranges` and returns
 * next one. Otherwise returns next to given `anchor` range
 * @param  {Range[]} ranges
 * @param  {Range}   anchor
 * @return {Range}   May return `undefined` if there’s no valid next range
 */
function getNextRange(ranges, anchor) {
	for (let i = 0, r; i < ranges.length; i++) {
		if (anchor.isEqual(ranges[i])) {
			// NB may return `undefined`, which is totally fine and means that
			// we should move to next element
			return ranges[i + 1];
		}
	}

	// Keep ranges which are not on the left of given selection
	ranges = ranges.filter(r => anchor.end.isLessThanOrEqual(r.start));

	return ranges[0];
}

/**
 * Tries to find range that equals given `anchor` range in `ranges` and returns
 * previous one. Otherwise returns previous to given `anchor` range
 * @param  {Range[]} ranges
 * @param  {Range}   anchor
 * @return {Range}   May return `undefined` if there’s no valid next range
 */
function getPreviousRange(ranges, anchor) {
	for (let i = 0, r; i < ranges.length; i++) {
		if (anchor.isEqual(ranges[i])) {
			// NB may return `undefined`, which is totally fine and means that
			// we should move to next element
			return ranges[i - 1];
		}
	}

	// Keep ranges which are not on the left of given selection
	ranges = ranges.filter(r => r.end.isLessThanOrEqual(anchor.start));

	return last(ranges);
}

/**
 * Returns possible selection ranges for given HTML model node
 * @param  {Node} node
 * @return {Range[]}
 */
function getRangesFromHTMLNode(node) {
	let ranges = [ getRange(node.open.name) ];

	if (node.attributes) {
		node.attributes.forEach(attr => {
			ranges.push(getRange(attr));
			if (!attr.boolean) {
				// add attribute value (unquoted) range for non-boolean attributes
				ranges.push(getRange(attr.value));

				if (attr.name.value.toLowerCase() === 'class') {
					// In case of `class` attribute, add each class item
					// as selection range, but only if this value is not
					// an expression (for example, React expression like
					// `class={items.join(' ')}`)
					ranges = ranges.concat(attributeValueTokens(attr.value));
				}
			}
		});
	}

	return uniqueRanges(ranges);
}

/**
 * Returns list of ranges of space-separated words in given attribute’s value
 * @param  {Token} value  Attribute value token
 * @return {Range[]}
 */
function attributeValueTokens(value) {
	const ranges = [];
	const stream = value.stream;
	const start = stream.pos;
	stream.pos = value.start;

	if (!stream.eat(isExpressionStart)) {
		// not an expression, can parse tokens
		let tokenStart;
		while (stream.pos.isLessThan(value.end)) {
			stream.eatWhile(isSpace);
			tokenStart = stream.pos;
			if (stream.eatWhile(isAttributeToken)) {
				ranges.push(new Range(tokenStart, stream.pos));
			}
		}
	}

	return ranges;
}

/**
 * Returns next sibling element for given node. If no direct sibling found, tries
 * to find it from its parent and so on
 * @param  {node} node
 * @return {Node}
 */
function nextSibling(node) {
	while (node) {
		if (node.nextSibling) {
			return node.nextSibling;
		}
		node = node.parent;
	}
}

/**
 * Returns previous sibling element for given node. When direct sibling found,
 * finds its latest and deepest child
 * @param  {node} node
 * @return {Node}
 */
function previousSibling(node) {
	return deepestChild(node.previousSibling);
}

function deepestChild(node) {
	while (node && node.children.length) {
		node = last(node.children);
	}

	return node;
}

function isAttributeToken(code) {
	return !isNaN(code) && !isSpace(code) && !isQuote(code);
}

function isExpressionStart(code) {
	return code === 123 /* { */
		|| code === 91  /* [ */
		|| code === 40; /* ( */
}

function last(arr) {
	return arr[arr.length - 1];
}
