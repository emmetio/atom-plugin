'use babel';

import { Range } from 'atom';
import locateFile from '../locate-file';
import getImageSize from '../image-size';

/**
 * Updates size of context image in given editor
 * @param  {TextEditor} editor
 * @param  {DocumentModel} documentModel
 */
export default function updateImageSize(editor, { documentModel }) {
	const src = getImageSrc( getImageNode(editor, documentModel) );

	if (!src) {
		return;
	}

	locateFile(editor, src)
	.then(getImageSize)
	.then(size => {
		// since this action is asynchronous, we have to ensure that editor wasn’t
		// changed and user didn’t moved caret outside <img> node
		const img = getImageNode(editor, documentModel);
		if (getImageSrc(img) === src) {
			updateHTMLImageSize(editor, img, size.width, size.height);
		}
	})
	.catch(err => console.warn('Error while updating image size:', err));
}

/**
 * Returns <img> node under caret in given editor or `null` if such node cannot
 * be found
 * @param  {TextEditor} editor
 * @param  {DocumentModel} documentModel
 * @return {Node}
 */
function getImageNode(editor, documentModel) {
	const model = documentModel.getModel(editor);
	const node = model && nodeForPoint(editor.getCursorBufferPosition());

	return node && node.name.toLowerCase() === 'img' ? node : null;
}

/**
 * Returns attribute object with `attrName` name from given HTML node
 * @param  {Node} node
 * @param  {String} attrName
 * @return {Object}
 */
function getAttribute(node, attrName) {
	attrName = attrName.toLowerCase();
	return node && node.open.attributes.find(attr => attr.name.value.toLowerCase() === attrName);
}

/**
 * Returns image source from given <img> node
 * @param  {Node} node
 * @return {String}
 */
function getImageSrc(node) {
	const srcAttr = getAttribute(node, 'src');
	if (!srcAttr) {
		console.warn('No "src" attribute in', node.open);
		return;
	}

	return srcAttr.value.value;
}

/**
 * Updates size of given HTML node
 * @param  {TextEditor} editor
 * @param  {Node}       node
 * @param  {Number}     width
 * @param  {Number}     height
 */
function updateHTMLImageSize(editor, node, width, height) {
	const srcAttr = getAttribute(node, 'src');
	const widthAttr = getAttribute(node, 'width');
	const heightAttr = getAttribute(node, 'height');

	editor.transact(() => {
		// apply changes from right to left, first for height, then for width
		const quote = getAttributeQuote(editor, widthAttr || heightAttr || srcAttr);

		if (!heightAttr) {
			// no `height` attribute, add it right after `width` or `src`
			const point = widthAttr ? widthAttr.end : srcAttr.end;
			editor.setTextInBufferRange([point, point], ` height=${quote}${height}${quote}`);
		} else {
			editor.setTextInBufferRange(getRange(heightAttr.value), height);
		}

		if (!widthAttr) {
			// no `width` attribute, add it right before `height` or after `src`
			const point = heightAttr ? heightAttr.start : srcAttr.end;
			editor.setTextInBufferRange([point, point], ` width=${quote}${width}${quote}`);
		} else {
			editor.setTextInBufferRange(getRange(widthAttr.value), width);
		}
	});
}

/**
 * Returns quote character, used for value of given attribute. May return empty
 * string if attribute wasn’t quoted
 * @param  {TextEditor} editor
 * @param  {Object} attr
 * @return {String}
 */
function getAttributeQuote(editor, attr) {
	const range = new Range(attr.value ? attr.value.end : attr.end, attr.end);
	return range.isEmpty() ? '' : editor.getTextInBufferRange(range);
}

function getRange(token) {
	return new Range(token.start, token.end);
}
