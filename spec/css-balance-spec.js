'use strict';

const { Range } = require('atom');
const path = require('path');
const pkg = require('../package.json');

describe('CSS Balance Action', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/sample.css');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);
	const getSelection = () => editor.getSelectedBufferRange();

	beforeEach(() => {
		waitsForPromise(() => atom.packages.activatePackage(pkg.name));
		waitsForPromise(() => atom.packages.activatePackage('language-css'));
		waitsForPromise(() => atom.workspace.open(filePath).then(ed => editor = ed));
	});

	afterEach(() => {
		editor.destroy();
		editor = null;
	});

	it('should balance outward', () => {
		const run = () => runCommand('emmet:balance-outward');

		// Go to initial position
		editor.setCursorBufferPosition([8, 20]);

		run(); // should match `background` property value
		expect(getSelection()).toEqual(new Range([8, 13], [8, 37]));

		run(); // should match full `background` property
		expect(getSelection()).toEqual(new Range([8, 1], [8, 37]));

		run(); // should match contents of second rule
		expect(getSelection()).toEqual(new Range([5, 6], [9, 0]));

		run(); // should match full second rule
		expect(getSelection()).toEqual(new Range([4, 0], [9, 1]));

		run(); // keep previous selection
		expect(getSelection()).toEqual(new Range([4, 0], [9, 1]));
	});

	it('should balance inward', () => {
		const run = () => runCommand('emmet:balance-inward');

		// Go to initial position
		editor.setCursorBufferPosition([4, 4]);

		run(); // should match outward first
		expect(getSelection()).toEqual(new Range([4, 0], [9, 1]));

		run(); // should match contents of second rule
		expect(getSelection()).toEqual(new Range([5, 6], [9, 0]));

		run(); // should match first rule’s property
		expect(getSelection()).toEqual(new Range([6, 1], [6, 15]));

		run(); // should match first rule’s property value
		expect(getSelection()).toEqual(new Range([6, 9], [6, 14]));

		run(); // should keep selection
		expect(getSelection()).toEqual(new Range([6, 9], [6, 14]));
	});
});
