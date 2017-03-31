'use babel';

import { Range, Point } from 'atom';

const reNumber = /[0-9]/;

/**
 * Incerement number under caret of given editor
 * @param  {TextEditor} editor
 * @param  {Number}     delta
 */
export default function(editor, delta) {
	editor.transact(() => {
		const selectionOptions = { select: true };
		editor.getSelections().forEach(selection => {
			if (selection.isEmpty()) {
				const numberRange = locate(editor, selection.getBufferRange().start);
				if (numberRange) {
					selection.setBufferRange(numberRange);
				}
			}

			const text = selection.getText();
			if (isValidNumber(text)) {
				selection.insertText(update(text, delta), selectionOptions);
			}
		})
	});
}

/**
 * Updates given number with `delta` and returs string formatted according
 * to original string format
 * @param  {String} numString
 * @param  {Number} delta
 * @return {String}
 */
export function update(numString, delta) {
	let m;
	let decimals = (m = numString.match(/\.(\d+)$/)) ? m[1].length : 1;
	let output = String((parseFloat(numString) + delta).toFixed(decimals)).replace(/\.0+$/, '');

	if (m = numString.match(/^\-?(0\d+)/)) {
		// padded number: preserve padding
		output = output.replace(/^(\-?)(\d+)/, (str, minus, prefix) =>
			minus + '0'.repeat(Math.max(0, m[1].length - prefix.length)) + prefix);
	}

	if (/^\-?\./.test(numString)) {
		// omit integer part
		output = output.replace(/^(\-?)0+/, '$1');
	}

	return output;
}

/**
 * Locates number from given position in `editor`
 * @param  {TextEditor} editor
 * @param  {Point}      pos
 * @return {Range}      Range of number or `undefined` if not found
 */
export function locate(editor, pos) {
	pos = Point.fromObject(pos);
	const line = editor.lineTextForBufferRow(pos.row);
	let start = pos.column;
	let end = pos.column;
	let hadDot = false, hadMinus = false;
	let ch;

	while (start > 0) {
		ch = line[--start];
		if (ch === '-') {
			hadMinus = true;
			break;
		} else if (ch === '.' && !hadDot) {
			hadDot = true;
		} else if (!reNumber.test(ch)) {
			start++;
			break;
		}
	}

	if (line[end] === '-' && !hadMinus) {
		end++;
	}

	while (end < line.length) {
		ch = line[end++];
		if (ch === '.' && !hadDot && reNumber.test(line[end])) {
			// A dot must be followed by a number. Otherwise stop parsing
			hadDot = true;
		} else if (!reNumber.test(ch)) {
			end--;
			break;
		}
	}

	// ensure that found range contains valid number
	if (start !== end && isValidNumber(line.slice(start, end))) {
		return new Range([pos.row, start], [pos.row, end]);
	}
}

/**
 * Check if given string contains valid number
 * @param  {String}  str
 * @return {Boolean}
 */
function isValidNumber(str) {
	return str && !isNaN(parseFloat(str));
}
