'use babel';

import { Range, Point } from 'atom';

/**
 * A syntax-specific model container, used to get unified access to underlying
 * parsed document
 */
export default class SyntaxModel {
	/**
	 * [constructor description]
	 * @param  {Object} dom      Parsed document tree
	 * @param  {String} type     Type of document (html, stylesheet, etc.)
	 * @param  {String} [syntax] Optional document syntax like html, xhtml or xml
	 */
	constructor(dom, type, syntax) {
		this.dom = dom;
		this.type = type;
		this.syntax = syntax;
	}

	/**
	 * Returns best matching node for given point
	 * @param  {Point}   point
	 * @param  {Boolean} [exclude] Exclude node’s start and end positions from
	 *                             search
	 * @return {Node}
	 */
	nodeForPoint(point, exclude) {
		point = Point.fromObject(point);
		let ctx = this.dom.firstChild;
		let found = null;

		while (ctx) {
			if (Range.fromObject([ctx.start, ctx.end]).containsPoint(point, exclude)) {
				// Found matching tag. Try to find deeper, more accurate match
				found = ctx;
				ctx = ctx.firstChild;
			} else {
				ctx = ctx.nextSibling;
			}
		}

		return found;
	}
}
