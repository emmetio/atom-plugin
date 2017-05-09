'use strict';

const { Point } = require('atom');
const path = require('path');
const pkg = require('../package.json');

describe('Update Image Size action (HTML)', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/image-size.html');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);
	const run = () => runCommand('emmet:update-image-size');

	beforeEach(() => {
		jasmine.useRealClock();
		waitsForPromise(() => atom.packages.activatePackage(pkg.name));
		waitsForPromise(() => atom.packages.activatePackage('language-html'));
		waitsForPromise(() => atom.workspace.open(filePath).then(ed => editor = ed));
	});

	afterEach(() => {
		editor.destroy();
		editor = null;
	});

	it('should update HTML tag', () => {
		let flag = false;
		const run = pos => {
			flag = false;
			editor.setCursorBufferPosition(pos);
			runs(() => setTimeout(() => flag = true, 200));
			runCommand('emmet:update-image-size');
			waitsFor(() => flag, "Wait for async action to perform", 500);
		};

		run([0, 5]);
		runs(() => {
			expect(editor.lineTextForBufferRow(0)).toBe('<img src="./images/sample.jpg" width="234" height="234" alt="">');
		});

		run([1, 5]);
		runs(() => {
			expect(editor.lineTextForBufferRow(1)).toBe('<img src="/fixtures/images/sample.jpg" width=234 height=234 alt="">');
		});

		run([2, 5]);
		runs(() => {
			expect(editor.lineTextForBufferRow(2)).toBe('<img src="./images/sample.jpg" width=\'234\' height=\'234\' alt="">');
		});

		run([3, 5]);
		runs(() => {
			expect(editor.lineTextForBufferRow(3)).toBe('<img src="./images/sample@2x.png" width="117" height="117" alt="">');
		});

		run([4, 5]);
		runs(() => {
			expect(editor.lineTextForBufferRow(4))
				.toBe('<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAAAAACoWZBhAAAAD0lEQVQIW2P4DwcMtGcCAGgtY52g8O1xAAAAAElFTkSuQmCC" width="10" height="10" alt="">');
		});
	});

	it('should not alter HTML tags', () => {
		let flag = false;
		const run = pos => {
			editor.setCursorBufferPosition(pos);
			runs(() => setTimeout(() => flag = true, 200));
			runCommand('emmet:update-image-size');
			waitsFor(() => flag, "Wait for async action to perform", 500);
		};

		run([5, 5]);
		runs(() => {
			expect(editor.lineTextForBufferRow(5)).toBe('<img width="" height="" alt="">');
		});

		run([7, 5]);
		runs(() => {
			expect(editor.lineTextForBufferRow(7)).toBe('<div></div>');
		});
	});
});
