'use babel';

import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { parse as parseUrl } from 'url';
import { Range } from 'atom';
import locateFile from '../locate-file';

const reIsDataURL = /^data:.+?;base64,/;
const defaultMimeType = 'application/octet-stream';
const mimeTypes = {
	gif : 'image/gif',
	png : 'image/png',
	jpg : 'image/jpeg',
	jpeg: 'image/jpeg',
	svg : 'image/svg+xml',
	webp: 'image/webp',
	html: 'text/html',
	htm : 'text/html'
};

/**
 * Converts image URL under cursor to/from data:URL
 * @param  {TextEditor} editor
 * @param  {DocumentModel} documentModel
 */
export default function(editor, { documentModel }) {
	const pos = editor.getCursorBufferPosition();
	const model = documentModel.getModel(editor);
	const node = model && model.nodeForPoint(pos, true);

	if (node) {
		return model.type === 'stylesheet'
			? convertCSS(editor, node, pos)
			: convertHTML(editor, node, pos);
	} else {
		return Promise.reject('Unsupported context for data:URL convertion');
	}
}

/**
 * Converts to/from data:URL contents of `src` attribute of given HTML node
 * @param  {TextEditor} editor
 * @param  {Node}       node
 * @param  {Point}      pos
 * @return {Promise}
 */
function convertHTML(editor, node, pos) {
	if (!getRange(node.open).containsPoint(pos)) {
		return Promise.reject(`Unsupported HTML context for data:URL convertion`);
	}

	const srcAttr = getHTMLAttribute(node, 'src');
	if (!srcAttr) {
		return Promise.reject(`No "src" attribute in <${node.name}> tag`);
	}

	const src = srcAttr.value.value;
	const replacementRange = getRange(srcAttr.value);
	const m = src.match(reIsDataURL);

	return m
		? saveAsFile(editor, src.slice(m[0].length), replacementRange)
		: convertToDataUrl(editor, src, replacementRange);
}

/**
 * Converts to/from data:URL contents of `src` attribute of given CSS node
 * @param  {TextEditor} editor
 * @param  {Node}       node
 * @param  {Point}      pos
 * @return {Promise}
 */
function convertCSS(editor, node, pos) {
	if (node.type !== 'property' || !getRange(node.valueToken).containsPoint(pos)) {
		return Promise.reject(`Unsupported CSS context for data:URL convertion`);
	}

	// First, we have to find which part of (possibly) comma-separated value
	// contains given point. Also, `.parsedValue` returns a fully parsed value,
	// unlike `.value`, wich contains only a textual representation of full
	// property value
	const valuePart = node.parsedValue.find(item => getRange(item).containsPoint(pos));
	const urlToken = findTokenForPoint(valuePart, pos, 'url');
	if (urlToken) {
		let urlValue = urlToken.item(0);
		if (urlValue && urlValue.type === 'string') {
			// get unquoted value
			urlValue = urlValue.item(0);
		}

		const src = urlValue ? urlValue.valueOf() : '';
		if (!src) {
			return Promise.reject(`No valid url() token in "${node.name}" property`);
		}

		const replacementRange = getRange(urlValue);
		const m = src.match(reIsDataURL);

		return m
			? saveAsFile(editor, src.slice(m[0].length), replacementRange)
			: convertToDataUrl(editor, src, replacementRange);
	}
}

/**
 * Returns attribute object with `attrName` name from given HTML node
 * @param  {Node}   node
 * @param  {String} attrName
 * @return {Object}
 */
function getHTMLAttribute(node, attrName) {
	attrName = attrName.toLowerCase();
	return node && node.attributes.find(attr => attr.name.value.toLowerCase() === attrName);
}

/**
 * Finds first deeply nested token of given `type` that contains given `point`
 * @param  {Token}  parent Parent CSS token
 * @param  {Point}  point
 * @param  {String} type   Token type to find
 * @return {Token}
 */
function findTokenForPoint(parent, point, type) {
	if (!parent) {
		return null;
	}

	if (parent.type === type) {
		return parent;
	}

	for (let i = 0, il = parent.size, item; i < il; i++) {
		item = parent.item(i);
		if (getRange(item).containsPoint(point)) {
			return findTokenForPoint(item, point, type);
		}
	}
}

/**
 * Saves given base64-encoded string as file on file system
 * @param  {TextEditor} editor
 * @param  {String}     data   Base64-encoded file
 * @param  {Range}      range  Editor’s replacement where saved file URL should
 *                             be written
 * @return {Promise}
 */
function saveAsFile(editor, data, range) {
	return new Promise((resolve, reject) => {
		const fileName = atom.getCurrentWindow().showSaveDialog();
		if (!fileName) {
			return reject(new Error('User cancelled file dialog'));
		}

		fs.writeFile(fileName, Buffer.from(data, 'base64'), err => {
			if (err) {
				return reject(err);
			}

			const editorPath = editor.getPath();
			let displayPath = editorPath
				? path.relative(editorPath, fileName)
				: `file://${fileName}`;

			editor.transact(() => {
				// Convert Windows path separators to Unix
				editor.setTextInBufferRange(range, displayPath.replace(/\\+/g, '/'))
			});

			resolve(fileName);
		});
	});
}

/**
 * Converts file, located by `src` argument, to data:URL string
 * @param  {TextEditor} editor
 * @param  {String}     url    File URL, either absolute or relative to editor’s file
 * @param  {Range}      range  Editor’s replacement where converted data:URL should
 *                             be written
 * @return {Promise}
 */
function convertToDataUrl(editor, url, range) {
	return locateFile(editor, url)
	.then(fileName => {
		return readFile(fileName)
		.then(contents => {
			const ext = path.extname(fileName).slice(1);
			const dataUrl = `data:${mimeTypes[ext] || defaultMimeType};base64,${contents.toString('base64')}`;

			editor.transact(() => editor.setTextInBufferRange(range, dataUrl));

			return dataUrl;
		});
	});
}

/**
 * Reads contents of given file path or URL as buffer
 * @param  {String} fileName File path or URL
 * @return {Promise}
 */
function readFile(fileName) {
	if (/^https?:/.test(fileName)) {
		return readFileFromURL(fileName);
	}

	return new Promise((resolve, reject) => {
		fs.readFile(fileName, (err, content) => err ? reject(err) : resolve(content));
	});
}

function readFileFromURL(url) {
	return new Promise((resolve, reject) => {
		url = parseUrl(url);
		const transport = url.protocol === 'https:' ? https : http;

		transport.get(url, resp => {
			const chunks = [];
			const onData = chunk => chunks.push(chunk);
			const onEnd = () => cleanUp( resolve(Buffer.concat(chunks)) );
			const onError = err => cleanUp( reject(err) );

			const cleanUp = () => {
				resp.removeListener('data', onData);
				resp.removeListener('end', onEnd);
				resp.removeListener('error', onError);
			};

			resp
			.on('data', onData)
			.on('end', onEnd)
			.once('error', onError);
		})
		.once('error', reject);
	})
}

function getRange(token) {
	return new Range(token.start, token.end);
}
