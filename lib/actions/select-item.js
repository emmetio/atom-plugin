'use babel';

import { isSpace, isQuote } from '@emmetio/stream-reader-utils';
import { Range } from 'atom';
import { getRange, uniqueRanges, iterateCSSToken, last } from './utils';

/**
 * Selects useful HTML token (attribute, attribute value, class etc) next
 * to caret position
 * @param  {TextEditor} editor
 * @param  {EmmetEnv}   env
 */
export function selectNextItem(editor, env) {
	const model = env.documentModel.getModel(editor);

	if (model) {
		selectItem(editor, model, model.type === 'stylesheet'
			? getNextCSSItemRange
			: getNextHTMLItemRange);
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
		selectItem(editor, model, model.type === 'stylesheet'
			? getPreviousCSSItemRange
			: getPreviousHTMLItemRange);
	}
}

/**
 * Selects each item, returned by `getItem` method, in given editor
 * @param  {TextEditor}  editor
 * @param  {SyntaxModel} model
 * @param  {Function}    getItemRange
 */
function selectItem(editor, model, getItemRange) {
	editor.transact(() => {
		const selections = editor.getSelectedBufferRanges()
		.map(anchor => getItemRange(model, anchor) || anchor);

		editor.setSelectedBufferRanges(selections);
	});
}

/**
 * Returns selection range of useful HTML token next to given `anchor` range
 * @param  {SyntaxModel} model
 * @param  {Range}       anchor
 * @return {Range}
 */
function getNextHTMLItemRange(model, anchor) {
	return getNextItemRange(model, anchor, getRangesFromHTMLNode);
}

/**
 * Returns selection range of useful HTML token that precedes given `anchor` range
 * @param  {SyntaxModel} model
 * @param  {Range}       anchor
 * @return {Range}
 */
function getPreviousHTMLItemRange(model, anchor) {
	return getPreviousItemRange(model, anchor, getRangesFromHTMLNode);
}

/**
 * Returns selection range of useful CSS token next to given `anchor` range
 * @param  {SyntaxModel} model
 * @param  {Range}       anchor
 * @return {Range}
 */
function getNextCSSItemRange(model, anchor) {
	return getNextItemRange(model, anchor, getRangesFromCSSNode);
}

/**
 * Returns selection range of useful HTML token that precedes given `anchor` range
 * @param  {HTMLModel} model
 * @param  {Range}     anchor
 * @return {Range}
 */
function getPreviousCSSItemRange(model, anchor) {
	return getPreviousItemRange(model, anchor, getRangesFromCSSNode);
}

/**
 * Returns selection range of useful code part of given `model` next to given
 * `anchor` range.
 * @param  {SyntaxModel} model
 * @param  {Range}       anchor
 * @param  {Function}    getItemRanges A function to retreive node ranges
 * @return {Range}
 */
function getNextItemRange(model, anchor, getItemRanges) {
	// Find HTML node for next selection
	let node = nodeForPoint(model, anchor.start, 'next');
	let range;

	// We might need to narrow down node context to find best token match
	while (node && !range) {
		range = getNextRange(getItemRanges(node), anchor);
		node = node.firstChild || nextSibling(node);
	}

	return range;
}

/**
 * Returns selection range of useful code part of given `model` that precedes
 * given `anchor` range.
 * @param  {SyntaxModel} model
 * @param  {Range}       anchor
 * @param  {Function}    getItemRanges A function to retreive node ranges
 * @return {Range}
 */
function getPreviousItemRange(model, anchor, getItemRanges) {
	// Find HTML node for next selection
	let node = nodeForPoint(model, anchor.start, 'previous');
	let range;

	// We might need to narrow down node context to find best token match
	while (node) {
		range = getPreviousRange(getItemRanges(node), anchor);
		if (range) {
			break;
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
	for (let i = 0; i < ranges.length; i++) {
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
	for (let i = 0; i < ranges.length; i++) {
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
	if (node.type !== 'tag') {
		return [];
	}

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

	return uniqueRanges(ranges.filter(Boolean));
}

/**
 * Returns possible selection ranges from given CSS model node
 * @param  {Node} node
 * @return {Range[]}
 */
function getRangesFromCSSNode(node) {
	let ranges;

	if (node.type === 'rule') {
		ranges = [ getRange(node.selectorToken) ].concat(node.parsedSelector.map(getRange));
	} else if (node.type === 'at-rule') {
		const nameEndToken = node.expressionToken || node.nameToken;
		ranges = [
			new Range(node.nameToken.start, nameEndToken.end),
			getRange(node.nameToken),
			getRange(node.expressionToken)
		];
		node.parsedExpression.forEach(token => {
			ranges.push(getRange(token));
			iterateCSSToken(token, t => {
				if (t.type === 'argument') {
					ranges.push(getRange(t));
				}
			});
		});
	} else if (node.type === 'property') {
		ranges = [
			getRange(node),
			getRange(node.nameToken),
			getRange(node.valueToken)
		];
		node.parsedValue.forEach(value => {
			// parsed value contains a comma-separated list of sub-values,
			// each of them, it turn, may contain space-separated parts
			ranges.push(getRange(value));

			for (let i = 0, il = value.size, token; i < il; i++) {
				token = value.item(i);
				if (token.type === 'url') {
					ranges.push(getRange(token), getRange(token.item(0)));
				} else if (token.type !== 'whitespace' && token !== 'comment') {
					ranges.push(getRange(token));

					iterateCSSToken(token, t => {
						if (t.type === 'argument') {
							ranges.push(getRange(t));
						}
					});
				}
			}
		});
	}

	return ranges ? uniqueRanges(ranges.filter(Boolean)) : [];
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
 * Returns best matching node for given position. If on direct position match,
 * tries to find closest one on givrn direction
 * @param  {SyntaxModel} model
 * @param  {Point} point
 * @param  {String} direction 'next' or 'previous'
 * @return {Node}
 */
function nodeForPoint(model, point, direction) {
	const node = model.nodeForPoint(point);

	if (node) {
		return node;
	}

	// Looks like caret is outside of any top-level node.
	const topLevelNodes = model.dom.children;

	if (direction === 'next') {
		// Find next node, which is closest top-level to given position
		return topLevelNodes.find(node => node.start.isGreaterThanOrEqual(point));
	}

	// Find previous node, which is deepest child of closest previous node
	for (let i = topLevelNodes.length - 1; i >= 0; i--) {
		if (topLevelNodes[i].end.isLessThanOrEqual(point)) {
			return deepestChild(topLevelNodes[i]);
		}
	}
}

/**
 * Returns next sibling element for given node. If no direct sibling found, tries
 * to find it from its parent and so on
 * @param  {Node} node
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
