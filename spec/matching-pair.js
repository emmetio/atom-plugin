'use strict';

const { Point } = require('atom');
const path = require('path');
const pkg = require('../package.json');

describe('Go to Matching Pair Action', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/sample.html');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);
	const getCursorPos = () => editor.getCursorBufferPosition();

	beforeEach(() => {
		waitsForPromise(() => atom.packages.activatePackage(pkg.name));
		waitsForPromise(() => atom.packages.activatePackage('language-html'));
		waitsForPromise(() => atom.workspace.open(filePath).then(ed => editor = ed));
	});

	it('should move between tag pairs', () => {
		const run = () => runCommand('emmet:go-to-matching-pair');

		// Go to initial position
		editor.setCursorBufferPosition([10, 5]);

		run(); // Go to </ul>
		expect(getCursorPos()).toEqual(new Point(13, 0));

		run(); // Go to <ul>
		expect(getCursorPos()).toEqual(new Point(9, 0));

		run(); // Go to </ul> again
		expect(getCursorPos()).toEqual(new Point(13, 0));

		run(); // Go to <ul> again
		expect(getCursorPos()).toEqual(new Point(9, 0));
	});
});
