'use babel';

import { Range } from 'atom';

/**
 * Selects useful HTML token (attribute, attribute value, class etc) next
 * to caret position
 * @param  {TextEditor} editor
 * @param  {EmmetEnv}   env
 */
export function selectNextItem(editor, env) {
	const model = env.documentModel.getModel(editor);

	if (!model) {
		return;
	}

	let node = model.nodeForPoint()
}

/**
 * Returns selection range of useful HTML token next to given `cursor`
 * @param  {HTMLModel} model
 * @param  {Cursor} cursor
 * @return {Range}
 */
function getNextHTMLItemRange(model, cursor) {
	// 1. Find HTML node for next selection
	const point = cursor.getBufferPosition();
	let node = model.nodeForPoint(point);
	let range;

	// We might need to narrow down node context to find best token match
	while (node) {
		if (node.type === 'tag') {
			if (getRange(node.open).containsPoint(point)) {

			}
		} else {
			node = node.nextSibling;
		}
	}
}

/**
 * Tries to find range that equals given `range` and picks next one,
 * otherwise finds right right next to given `selection`
 * @param  {Range[]} ranges
 * @param  {Range}   selection
 * @return {Range}
 */
function getNextRange(ranges, selection) {
	// Keep ranges which are not on the left of given selection
	ranges = ranges.filter(r => selection.isLessThanOrEqual(r));

	for (let i = 0, r; i < ranges.length; i++) {
		if (selection.isEqual(ranges[i])) {
			return ranges[i];
		}
	}

	return ranges[0];
}

/**
 * Returns possible selection ranges for given HTML model node
 * @param  {Node} node
 * @return {Range[]}
 */
function getRangesHTML(node) {
	let ranges = [];
	if (node === 'tag') {
		ranges.push(getRange(node.name));

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
}

/**
 * Returns list of uniques ranges from given array
 * @param  {Range[]} ranges
 * @return {Range[]}
 */
function uniqueRanges(ranges) {
	const lookup = new Set();
	return ranges.filter(range => {
		const key = range.toString();
		const exists = lookup.has(key);
		lookup.add(key);
		return !exists;
	})
}

/**
 * Returns `Range` of given parsed token (object with `.start` and `.end` properties)
 * @param  {Object} token
 * @return {Range}
 *
 */
function getRange(token) {
	return new Range(token.start, token.end);
}

function isSpace(code) {
	return code === 9    /* tab */
		|| code === 10   /* \n */
		|| code === 13   /* \r */
		|| code === 32   /* space */
		|| code === 160; /* non-breaking space */
}

function isAttributeToken(code) {
	return !isNaN(code) && !isSpace(code) && !isQuote(code);
}

function isQuote(code) {
	return code === 39 /* ' */ || code === 34 /* " */;
}

function isExpressionStart(code) {
	return code === 123 /* { */
		|| code === 91  /* [ */
		|| code === 40; /* ( */
}
