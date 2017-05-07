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
 * @param  {Token} token
 * @param  {point} point
 * @return {Boolean}
 */
export function containsPoint(token, point) {
	return token && getRange(token).containsPoint(point);
}

/**
 * Returns list item from given array
 * @param  {Array} arr
 * @return {*}
 */
export function last(arr) {
	return arr[arr.length - 1];
}
