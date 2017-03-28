'use strict';

const { Range } = require('atom');
const path = require('path');
const pkg = require('../package.json');

describe('HTML Balance Action', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/sample.html');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);
	const getSelection = () => editor.getSelectedBufferRange();

	beforeEach(() => {
		waitsForPromise(() => atom.packages.activatePackage(pkg.name));
		waitsForPromise(() => atom.packages.activatePackage('language-html'));
		waitsForPromise(() => atom.workspace.open(filePath).then(ed => editor = ed));
	});

	afterEach(() => {
		editor.destroy();
		editor = null;
	});

	it('should balance outward', () => {
		const run = () => runCommand('emmet:balance-outward');

		// Go to initial position
		editor.setCursorBufferPosition([4, 9]);

		run(); // should match <meta> tag
		expect(getSelection()).toEqual(new Range([4, 1], [4, 71]));

		run(); // should match inner contents of <head> tag
		expect(getSelection()).toEqual(new Range([2, 6], [7, 0]));

		run(); // should match <head> tag
		expect(getSelection()).toEqual(new Range([2, 0], [7, 7]));

		run(); // should match inner contents of <html> tag
		expect(getSelection()).toEqual(new Range([1, 16], [15, 0]));

		run(); // should match <html> tag
		expect(getSelection()).toEqual(new Range([1, 0], [15, 7]));

		run(); // keep previous selection
		expect(getSelection()).toEqual(new Range([1, 0], [15, 7]));
	});

	it('should balance inward', () => {
		const run = () => runCommand('emmet:balance-inward');

		// Go to initial position
		editor.setCursorBufferPosition([1, 4]);

		run(); // should match outward first
		expect(getSelection()).toEqual(new Range([1, 0], [15, 7]));

		run(); // should match inner contents of <html> tag
		expect(getSelection()).toEqual(new Range([1, 16], [15, 0]));

		run(); // should match <head> tag
		expect(getSelection()).toEqual(new Range([2, 0], [7, 7]));

		run(); // should match inner contents of <head> tag
		expect(getSelection()).toEqual(new Range([2, 6], [7, 0]));

		run(); // should match first <meta> tag
		expect(getSelection()).toEqual(new Range([3, 1], [3, 23]));

		run(); // should keep selection
		expect(getSelection()).toEqual(new Range([3, 1], [3, 23]));
	});
});
