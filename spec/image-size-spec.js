'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const imageSize = require('../lib/image-size');

describe('Image Size module', () => {
	it('should get size of local file', () => {
		const img = path.resolve(__dirname, './fixtures/images/sample.jpg');
		const img2x = path.resolve(__dirname, './fixtures/images/sample@2x.png');

		waitsForPromise(() => imageSize(img)
			.then(size => expect(size).toEqual({
				realWidth: 234,
				realHeight: 234,
				width: 234,
				height: 234
			})
		));

		waitsForPromise(() => imageSize(img2x)
			.then(size => expect(size).toEqual({
				realWidth: 234,
				realHeight: 234,
				width: 117,
				height: 117
			})
		));
	});

	it('should get size of remote file', () => {
		let server, host;
		const img = path.resolve(__dirname, './fixtures/images/sample.jpg');

		const startServer = () => new Promise((resolve, reject) => {
			server = http.createServer((req, res) => {
				const stream = fs.createReadStream(img);
				res.writeHead(200, { 'content-type': 'image/jpeg' });
				stream.pipe(res);
			});
			server.on('error', reject);
			server.listen(0, resolve);
			host = `http://127.0.0.1:${server.address().port}`;
		});

		waitsForPromise(startServer);

		waitsForPromise(() => imageSize(`${host}/image.jpg`)
			.then(size => expect(size).toEqual({
				realWidth: 234,
				realHeight: 234,
				width: 234,
				height: 234
			})
		));

		waitsForPromise(() => imageSize(`${host}/image@2x.jpg`)
			.then(size => expect(size).toEqual({
				realWidth: 234,
				realHeight: 234,
				width: 117,
				height: 117
			})
		));

		waitsForPromise(() => new Promise(resolve => server.close(resolve)));
	});
});
