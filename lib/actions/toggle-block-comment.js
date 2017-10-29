'use babel';

import { Range } from 'atom';
import { isSpace } from '@emmetio/stream-reader-utils';
import { getRange, containsPoint } from './utils';
import BufferStreamReader from '../buffer-stream';

const modelComments = {
	html: {
		before: '<!--',
		after:  '-->'
	},
	stylesheet: {
		before: '/*',
		after:  '*/'
	}
};

/**
 * Toggles block comment on given editor
 * @param  {TextEditor}    editor
 * @param  {DocumentModel} documentModel
 */
export default function toggleBlockComment(editor, { documentModel }, evt) {
	let handled = false;
	const model = documentModel.getModel(editor);

	if (model) {
		editor.transact(() => {
			editor.getCursorsOrderedByBufferPosition().reverse()
			.forEach(cursor => {
				const pos = cursor.getBufferPosition();
				const commentRange = commentRangeAtPos(model, pos);

				if (commentRange) {
					handled = true;
					uncomment(editor, commentRange, model.type);
					return;
				}

				const node = model.nodeForPoint(pos);
				if (node && isInValidRangeForComment(model.type, node, pos)) {
					handled = true;
					// should remove inner comments first
					const range = getRange(node);
					commentsInRange(model, range).reverse().forEach(token => {
						const tokenRange = getRange(token);
						const delta = uncomment(editor, tokenRange, model.type);

						if (tokenRange.end.row === range.end.row) {
							range.end.column -= delta.end;
						}
					});

					comment(editor, range, model.type);
				}
			});
		});
	}

	if (!handled) {
		// Pass event to (possibly) default comment handler
		return evt.abortKeyBinding();
	}
}

/**
 * Comments given node in text editor
 * @param  {TextEditor} editor
 * @param  {Range}      range
 * @param  {String}     modelType
 */
function comment(editor, range, modelType) {
	const commentParts = modelComments[modelType];
	editor.setTextInBufferRange(new Range(range.end, range.end), ` ${commentParts.after}`);
	editor.setTextInBufferRange(new Range(range.start, range.start), `${commentParts.before} `);
}

/**
 * Un-comments given range in text editor
 * @param  {TextEditor} editor
 * @param  {Range}      range
 * @param  {String}     modelType
 * @return {Object}     Returns delta of removed characters from
 */
function uncomment(editor, range, modelType) {
	const commentParts = modelComments[modelType];
	const stream = new BufferStreamReader(editor.getBuffer(), range.start, range);

	// narrow down comment range till meanful content
	stream.pos = range.start.translate([0, commentParts.before.length]);
	stream.eatWhile(isSpace);
	stream.start = stream.pos;

	// Make sure comment ends with proper token
	stream.pos = range.end.translate([0, -commentParts.after.length]);
	if (editor.getTextInBufferRange([stream.pos, range.end]) === commentParts.after) {
		while (!stream.sof()) {
			if (!isSpace(stream.backUp(1))) {
				stream.next();
				break;
			}
		}
	} else {
		stream.pos = range.end;
	}

	const start = new Range(range.start, stream.start);
	const end = new Range(stream.pos, range.end);
	const delta = {
		start: editor.getTextInBufferRange(start).length,
		end: editor.getTextInBufferRange(end).length
	};

	editor.setTextInBufferRange(end, '');
	editor.setTextInBufferRange(start, '');

	return delta;
}

/**
 * Iterates on each child node and its decendants and calls `test` function on them.
 * If function returns `true`, node will be added to result
 * NB: don’t use recursion here to avoid possible callstack size exceeding
 * @param  {Node}     node
 * @param  {Function} test
 * @return {Node[]}
 */
function iterate(node, test) {
	const result = [];
	let stack = node.children.slice().reverse(), ctx;

	while (stack.length) {
		ctx = stack.pop();
		test(ctx) && result.push(ctx);
		stack = stack.concat( ctx.children.slice().reverse() );
	}

	return result;
}

/**
 * Finds all comment ranges that matches given range
 * @param  {SyntaxModel} model
 * @param  {Range}       range
 * @return {Range[]}
 */
function commentsInRange(model, range) {
	const intersects = token => getRange(token).intersectsWith(range, true);

	if (model.type === 'html') {
		// in html model, comments are nodes in model
		return iterate(model.dom, node => node.type === 'comment' && intersects(node));
	}

	if (model.type === 'stylesheet') {
		// in stylesheet model, comments are stored as separate tokens, they
		// can’t be a part of model since they might be a part of selector or
		// property value
		return model.dom.comments.filter(intersects);
	}

	return [];
}

function commentRangeAtPos(model, pos) {
	const comments = commentsInRange(model, new Range(pos, pos));
	return comments.length ? getRange(comments[0]) : null;
}

function isInValidRangeForComment(modelType, node, pos) {
	if (modelType === 'html') {
		return node.type === 'tag' && ( containsPoint(node.open, pos) || containsPoint(node.close, pos) );
	}

	if (modelType === 'stylesheet') {
		// when commenting stylesheet, make sure it’s either inside name/selector
		// of rule or simply inside property
		if (node.type === 'rule') {
			return containsPoint(node.selectorToken, pos);
		} else if (node.type === 'at-rule') {
			const endToken = node.expressionToken || node.nameToken;
			return new Range(node.nameToken.start, endToken.end).containsPoint(pos);
		} else if (node.type === 'property') {
			return containsPoint(node, pos, true);
		}
	}

	return false;
}
