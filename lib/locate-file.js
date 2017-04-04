'use babel';

import path from 'path';
import fs from 'fs';

const reAbsolute = /^\/+/;

/**
 * Locates given `filePath` on user’s file system and returns absolute path to it.
 * This method expects either URL, or relative/absolute path to resource
 * @param  {TextEditor|String} base     Base path source: text editor with opened
 *                                      file or base path itself
 * @param  {String}            filePath File to locate
 * @return {Promise}
 */
export default function(base, filePath) {
	if (/^\w+:/.test(filePath)) {
		// path with protocol, already absolute
		return Promise.resolve(filePath);
	}

	filePath = path.normalize(filePath);

	return reAbsolute.test(filePath)
		? resolveAbsolute(base, filePath)
		: resolveRelative(base, filePath);
}

/**
 * Resolves relative file path
 * @param  {TextEditor|String} base
 * @param  {String}            filePath
 * @return {Promise}
 */
function resolveRelative(base, filePath) {
	return getBasePath(base)
	.then(basePath => tryFile(path.resolve(basePath, filePath)));
}

/**
 * Resolves absolute file path agaist given editor: tries to find file in every
 * parent of editor’s file
 * @param  {TextEditor|String} base
 * @param  {String}            filePath
 * @return {Promise}
 */
function resolveAbsolute(base, filePath) {
	return getBasePath(base)
	.then(basePath => new Promise((resolve, reject) => {
		filePath = filePath.replace(reAbsolute, '');

		const next = ctx => {
			tryFile(path.resolve(ctx, filePath))
			.then(resolve, err => {
				const dir = path.dirname(ctx);
				if (!dir || dir === ctx) {
					return reject(`Unable to locate absolute file ${filePath}`);
				}

				next(dir);
			});
		};

		next(basePath);
	}));
}

/**
 * Returns base path from file, opened in given editor
 * @param  {TextEditor|String} base
 * @return {Promise}
 */
function getBasePath(base) {
	return new Promise((resolve, reject) => {
		if (base && typeof base.getPath === 'function') {
			const editorFile = base.getPath();
			if (!editorFile) {
				return reject(new Error(`Unable to get base path: editor contains unsaved file`));
			}

			base = path.dirname(editorFile);
		}

		if (!base || typeof base !== 'string') {
			reject(new Error(`Unable to get base path from ${base}`));
		} else {
			resolve(base);
		}
	});
}

/**
 * Check if given file exists and it’s a file, not directory
 * @param  {String} file
 * @return {Promise}
 */
function tryFile(file) {
	return new Promise((resolve, reject) => {
		fs.stat(file, (err, stat) => {
			if (err) {
				return reject(err);
			}

			if (!stat.isFile()) {
				return reject(new Error(`${file} is not a file`));
			}

			resolve(file);
		});
	});
}
