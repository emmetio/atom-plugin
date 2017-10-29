'use babel';

// A set of commonly used action utils

import { Range } from 'atom';

/**
 * Filters duplicated ranges (ranges with the same start and end points) from
 * given array
 * @param  {Range[]} ranges
 * @return {Range}
 */
export function uniqueRanges(ranges) {
	return ranges.reduce((out, range) => {
		if (!hasRange(out, range)) {
			out.push(range);
		}

		return out;
	}, []);
}

/**
 * Check if given ranges array contains range with the same start and end points
 * @param  {Range[]} ranges
 * @param  {Range}   range
 * @return {Boolean}
 */
export function hasRange(ranges, range) {
	for (let i = 0, il = ranges.length; i < il; i++) {
		if (ranges[i].isEqual(range)) {
			return true;
		}
	}

	return false;
}

/**
 * Returns text editor range from given token
 * @param  {Token} token
 * @return {Range}
 */
export function getRange(token) {
	return token ? new Range(token.start, token.end) : null;
}

/**
 * Check if given token contains given point
 * @param  {Token}   token
 * @param  {Point}   point
 * @param  {Boolean} [exclusive]
 * @return {Boolean}
 */
export function containsPoint(token, point, exclusive) {
	return token && getRange(token).containsPoint(point, exclusive);
}

/**
 * Itereates by each child, as well as nested child’ children, in their order
 * and invokes `fn` for each. If `fn` function returns `false`, iteration stops
 * @param  {Token}    token
 * @param  {Function} fn
 */
export function iterateCSSToken(token, fn) {
	for (let i = 0, il = token.size; i < il; i++) {
		if (fn(token.item(i)) === false || iterateCSSToken(token.item(i), fn) === false) {
			return false;
		}
	}
}

/**
 * Returns list item from given array
 * @param  {Array} arr
 * @return {*}
 */
export function last(arr) {
	return arr[arr.length - 1];
}
