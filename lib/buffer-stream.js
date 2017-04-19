'use strict';

// NB using CommonJS module notation since Babel will fail to process
// @emmetio/stream-reader module and ES5 class extend won’t work

const { Point } = require('atom');
const StreamReader = require('@emmetio/stream-reader');

/**
 * A stream reader for Atom’s `TextBuffer`
 */
module.exports = class BufferStreamReader extends StreamReader {
	/**
	 * @param  {TextBuffer} buffer
	 * @param  {Point}      pos
	 * @param  {Range}      [limit]
	 */
	constructor(buffer, pos, limit) {
		super();
		this.buffer = buffer;
		this.start = this.pos = pos ? Point.fromObject(pos) : new Point(0, 0);
		this._eof = limit ? limit.end : this.buffer.getEndPosition();
		this._sof = limit ? limit.start : new Point(0, 0);
	}

	/**
	 * Returns true only if the stream is at the beginning of the file.
	 * @returns {Boolean}
	 */
	sof() {
		return this.pos.isLessThanOrEqual(this._sof);
	}

	/**
	 * Returns true only if the stream is at the end of the file.
	 * @returns {Boolean}
	 */
	eof() {
		return this.pos.isGreaterThanOrEqual(this._eof);
	}

	/**
	 * Creates a new stream instance which is limited to given `start` and `end`
	 * points for underlying buffer
	 * @param  {Point} start
	 * @param  {Point} end
	 * @return {BufferStreamReader}
	 */
	limit(start, end) {
		return new this.constructor(this.buffer, start, {start, end});
	}

	/**
	 * Returns the next character code in the stream without advancing it.
	 * Will return NaN at the end of the file.
	 * @returns {Number}
	 */
	peek() {
		const { row, column } = this.pos;
		const line = this.buffer.lineForRow(row);
		return column < line.length
			? line.charCodeAt(column)
			: (this.buffer.lineEndingForRow(row) || '').charCodeAt(column - line.length);
	}

	/**
	 * Returns the next character in the stream and advances it.
	 * Also returns NaN when no more characters are available.
	 * @returns {Number}
	 */
	next() {
		if (!this.eof()) {
			const code = this.peek();
			const pos = this.pos.translate([0, 1]);
			this.pos = this.pos.traverse(
				this.pos.column < this._lineLength(this.pos.row) - 1 ? [0, 1] : [1, 0]);

			if (this.eof()) {
				// handle edge case where position can move on next line
				// after EOF
				this.pos = this._eof.copy();
			}

			return code;
		}

		return NaN;
	}

	/**
	 * Backs up the stream n characters. Backing it up further than the
	 * start of the current token will cause things to break, so be careful.
	 * @param {Number} n
	 */
	backUp(n) {
		let { row, column } = this.pos;
		column -= (n || 1);

		while (row >= 0 && column < 0) {
			row--;
			column += this._lineLength(row);
		}

		this.pos = row < 0 || column < 0
			? new Point(0, 0)
			: new Point(row, column);

		return this.peek();
	}

	/**
	 * Get the string between the start of the current token and the
	 * current stream position.
	 * @returns {String}
	 */
	current() {
		return this.buffer.getTextInRange([this.start, this.pos]);
	}

	/**
	 * Creates error object with current stream state
	 * @param {String} message
	 * @return {Error}
	 */
	error(message) {
		const err = new Error(`${message} at row ${this.pos}, column ${this.pos.column}`);
		err.originalMessage = message;
		err.pos = this.pos;
		err.string = this.string;
		return err;
	}

	/**
	 * Returns line length of given row, including line ending
	 * @param  {Number} row
	 * @return {Number}
	 */
	_lineLength(row) {
		const lineEnding = this.buffer.lineEndingForRow(row) || '';
		return this.buffer.lineLengthForRow(row) + lineEnding.length;
	}
}
