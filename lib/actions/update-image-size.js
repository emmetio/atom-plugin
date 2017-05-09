'use babel';

import { Range } from 'atom';
import locateFile from '../locate-file';
import getImageSize from '../image-size';
import { getRange, containsPoint, iterateCSSToken } from './utils';

/**
 * Updates size of context image in given editor
 * @param  {TextEditor}    editor
 * @param  {DocumentModel} documentModel
 */
export default function updateImageSize(editor, { documentModel }) {
	const model = documentModel.getModel(editor);

	if (model && model.type === 'html') {
		return updateImageSizeHTML(editor, model);
	} else if (model && model.type === 'stylesheet') {
		return updateImageSizeCSS(editor, model);
	}

	return Promise.reject(new Error('No valid syntax model for action'));
}

/**
 * Updates image size of context tag of HTML model
 * @param  {TextEditor}  editor
 * @param  {SyntaxModel} model
 * @return {Promise}
 */
function updateImageSizeHTML(editor, model) {
	const pos = editor.getCursorBufferPosition();
	const src = getImageSrcHTML( getImageHTMLNode(editor, model, pos) );

	if (!src) {
		return Promise.reject(new Error('No valid image source'));
	}

	locateFile(editor, src)
	.then(getImageSize)
	.then(size => {
		// since this action is asynchronous, we have to ensure that editor wasn’t
		// changed and user didn’t moved caret outside <img> node
		const img = getImageHTMLNode(editor, model, pos);
		if (getImageSrcHTML(img) === src) {
			updateHTMLTag(editor, img, size.width, size.height);
		}
	})
	.catch(err => console.warn('Error while updating image size:', err));
}

/**
 * Updates image size of context rule of stylesheet model
 * @param  {TextEditor}  editor
 * @param  {SyntaxModel} model
 * @return {Promise}
 */
function updateImageSizeCSS(editor, model) {
	const pos = editor.getCursorBufferPosition();
	const property = getImageCSSNode(editor, model, pos);
	const urlToken = findUrlToken(property, pos);
	const src = urlToken && getImageSrcCSS(urlToken);

	if (!src) {
		return Promise.reject(new Error('No valid image source'));
	}

	locateFile(editor, src)
	.then(getImageSize)
	.then(size => {
		// since this action is asynchronous, we have to ensure that editor wasn’t
		// changed and user didn’t moved caret outside <img> node
		if (getImageCSSNode(editor, model, pos) === property) {
			updateCSSNode(editor, property, size.width, size.height);
		}
	})
	.catch(err => console.warn('Error while updating image size:', err));
}

/**
 * Returns <img> node under caret in given editor or `null` if such node cannot
 * be found
 * @param  {TextEditor}  editor
 * @param  {SyntaxModel} model
 * @return {Node}
 */
function getImageHTMLNode(editor, model, pos) {
	const node = model.nodeForPoint(pos);
	return node && node.name.toLowerCase() === 'img' ? node : null;
}

function getImageCSSNode(editor, model, pos) {
	const node = model.nodeForPoint(pos);
	return node && node.type === 'property' ? node : null;
}

/**
 * Returns image source from given <img> node
 * @param  {Node} node
 * @return {String}
 */
function getImageSrcHTML(node) {
	const srcAttr = getAttribute(node, 'src');
	if (!srcAttr) {
		console.warn('No "src" attribute in', node && node.open);
		return;
	}

	return srcAttr.value.value;
}

/**
 * Returns image source from given `url()` token
 * @param  {Token} token
 * @return {String}
 */
function getImageSrcCSS(token) {
	// A stylesheet token may contain either quoted ('string') or unquoted URL
	let urlValue = token.item(0);
	if (urlValue && urlValue.type === 'string') {
		urlValue = urlValue.item(0);
	}

	return urlValue && urlValue.valueOf();
}

/**
 * Updates size of given HTML node
 * @param  {TextEditor} editor
 * @param  {Node}       node
 * @param  {Number}     width
 * @param  {Number}     height
 */
function updateHTMLTag(editor, node, width, height) {
	const srcAttr = getAttribute(node, 'src');
	const widthAttr = getAttribute(node, 'width');
	const heightAttr = getAttribute(node, 'height');

	editor.transact(() => {
		// apply changes from right to left, first for height, then for width
		let point;
		const quote = getAttributeQuote(editor, widthAttr || heightAttr || srcAttr);

		if (!heightAttr) {
			// no `height` attribute, add it right after `width` or `src`
			point = widthAttr ? widthAttr.end : srcAttr.end;
			editor.setTextInBufferRange([point, point], ` height=${quote}${height}${quote}`);
		} else {
			editor.setTextInBufferRange(getRange(heightAttr.value), String(height));
		}

		if (!widthAttr) {
			// no `width` attribute, add it right before `height` or after `src`
			point = heightAttr ? heightAttr.start : srcAttr.end;
			editor.setTextInBufferRange([point, point], `${!heightAttr ? ' ' : ''}width=${quote}${width}${quote}${heightAttr ? ' ' : ''}`);
		} else {
			editor.setTextInBufferRange(getRange(widthAttr.value), String(width));
		}
	});
}

/**
 * Updates size of given CSS rule
 * @param  {TextEditor} editor
 * @param  {Node}       srcProp
 * @param  {Number}     width
 * @param  {Number}     height
 */
function updateCSSNode(editor, srcProp, width, height) {
	const rule = srcProp.parent;
	const widthProp = getProperty(rule, 'width');
	const heightProp = getProperty(rule, 'height');

	// Detect formatting
	const separator = srcProp.separator || ': ';
	const before = getBefore(editor, srcProp);
	const insertOpt = { autoIndent: false };

	editor.transact(() => {
		// Apply changes from right to left, first for height, then for width

		if (!heightProp) {
			// no `height` property, add it right after `width` or source property
			editor.setCursorBufferPosition(widthProp ? widthProp.end : srcProp.end);
			editor.insertText(`${before}height${separator}${height}px;`, insertOpt);
		} else {
			editor.setTextInBufferRange(getRange(heightProp.valueToken), `${height}px`);
		}

		if (!widthProp) {
			// no `width` attribute, add it right after `height` or source property
			if (heightProp) {
				editor.setCursorBufferPosition(heightProp.previousSibling
					? heightProp.previousSibling.end
					: rule.contentStart.end);
			} else {
				editor.setCursorBufferPosition(srcProp.end);
			}
			editor.insertText(`${before}width${separator}${width}px;`, insertOpt);
		} else {
			editor.setTextInBufferRange(getRange(widthProp.valueToken), `${width}px`);
		}
	});
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

/**
 * Finds 'url' token for given `pos` point in given CSS property `node`
 * @param  {Node}  node
 * @param  {Point} pos
 * @return {Token}
 */
function findUrlToken(node, pos) {
	for (let i = 0, il = node.parsedValue.length, url; i < il; i++) {
		iterateCSSToken(node.parsedValue[i], token => {
			if (token.type === 'url' && containsPoint(token, pos)) {
				url = token;
				return false;
			}
		});

		if (url) {
			return url;
		}
	}
}

/**
 * Returns `name` CSS property from given `rule`
 * @param  {Node} rule
 * @param  {String} name
 * @return {Node}
 */
function getProperty(rule, name) {
	return rule.children.find(node => node.type === 'property' && node.name === name);
}

/**
 * Returns a string that is used to delimit properties in current node’s rule
 * @param  {TextEditor} editor
 * @param  {Node}       node
 * @return {String}
 */
function getBefore(editor, node) {
	let anchor;
	if (anchor = (node.previousSibling || node.parent.contentStartToken)) {
		return editor.getTextInBufferRange(new Range(anchor.end, node.start));
	} else if (anchor = (node.nextSibling || node.parent.contentEndToken)) {
		return editor.getTextInBufferRange(new Range(node.end, anchor.start));
	}

	return '';
}
