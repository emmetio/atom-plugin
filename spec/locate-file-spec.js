'use strict';

const path = require('path');
const locate = require('../lib/locate-file');

describe('File locator', () => {
	const resolve = p => path.resolve(__dirname, p);
	const result = resolve('fixtures/images/sample.jpg');

	it('should find relative file', () => {

		waitsForPromise(() =>
			locate(resolve('fixtures'), 'images/sample.jpg')
			.then(found => expect(found).toBe(result))
		);

		waitsForPromise(() =>
			locate(resolve('fixtures/www'), '../images/sample.jpg')
			.then(found => expect(found).toBe(result))
		);
	});

	it('should fail if relative file not found', () => {
		waitsForPromise(() =>
			locate(resolve('fixtures/www'), '../images/sample2.jpg')
			.then(file => fail(`File found: ${file}`))
			.catch(err => expect(err.code).toBe('ENOENT'))
		);
	});

	it('should find absolute file', () => {
		waitsForPromise(() =>
			locate(resolve('fixtures'), '/images/sample.jpg')
			.then(found => expect(found).toBe(result))
		);

		waitsForPromise(() =>
			locate(resolve('fixtures/a/b/c/d'), '/images/sample.jpg')
			.then(found => expect(found).toBe(result))
		);
	});

	it('should detect URLs', () => {
		const result = 'http://emmet.io/logo.png';
		waitsForPromise(() =>
			locate(resolve('fixtures'), result)
			.then(found => expect(found).toBe(result))
		);
	});
});
