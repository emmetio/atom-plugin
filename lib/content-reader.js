'use babel';

/**
 * Content reader for Atom’s text editor. Used for @emmetio/html-matcher
 */
export default class ContentReader {
	constructor(editor, cursor) {
		this.editor = editor;
		this.cursor = cursor != null ? cursor : editor.getCursorBufferPosition().row;
	}

	// Returns a code chunk for given cursor
	charCodeAt(cursor, pos) {
		const buffer = this.editor.getBuffer();
		const line = buffer.lineForRow(cursor);
		const end = buffer.lineEndingForRow(cursor) || '';
		return pos >= line.length
			? end.charCodeAt(pos - line.length)
			: line.charCodeAt(pos);
	}

	length(cursor) {
		const buffer = this.editor.getBuffer();
		const line = buffer.lineForRow(cursor);
		const end = buffer.lineEndingForRow(cursor) || '';

		return line.length + end.length;
	}

	substring(from, to) {
		from = this.toEditorPoint(from);
		to = this.toEditorPoint(to);

		return this.editor.getInBufferRange([from, to]);
	}

	prev(cursor) {
		cursor--;
		return cursor < 0 ? null : cursor;
	}

	next(cursor) {
		cursor++;
		return cursor < this.editor.getLineCount() ? cursor : null;
	}

	toEditorPoint(point) {
		return [point.cursor, point.pos];
	}
}
