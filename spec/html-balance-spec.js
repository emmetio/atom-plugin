'use strict';

const { Range } = require('atom');
const path = require('path');
const pkg = require('../package.json');

describe('HTML Balance Action', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/sample.html');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);

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
		// Go to initial position
		editor.setCursorBufferPosition([4, 9]);

		// should match <meta> tag
		runCommand('emmet:balance-outward');
		expect(editor.getSelectedBufferRange()).toEqual(new Range([4, 1], [4, 71]));

		// should match inner contents of <head> tag
		runCommand('emmet:balance-outward');
		expect(editor.getSelectedBufferRange()).toEqual(new Range([2, 6], [7, 0]));

		// should match <head> tag
		runCommand('emmet:balance-outward');
		expect(editor.getSelectedBufferRange()).toEqual(new Range([2, 0], [7, 7]));

		// should match inner contents of <html> tag
		runCommand('emmet:balance-outward');
		expect(editor.getSelectedBufferRange()).toEqual(new Range([1, 16], [15, 0]));

		// should match <html> tag
		runCommand('emmet:balance-outward');
		expect(editor.getSelectedBufferRange()).toEqual(new Range([1, 0], [15, 7]));

		// keep previous selection
		runCommand('emmet:balance-outward');
		expect(editor.getSelectedBufferRange()).toEqual(new Range([1, 0], [15, 7]));
	});

	it('should balance inward', () => {
		// Go to initial position
		editor.setCursorBufferPosition([1, 4]);

		// should match outward first
		runCommand('emmet:balance-inward');
		expect(editor.getSelectedBufferRange()).toEqual(new Range([1, 0], [15, 7]));

		// should match inner contents of <html> tag
		runCommand('emmet:balance-inward');
		expect(editor.getSelectedBufferRange()).toEqual(new Range([1, 16], [15, 0]));

		// should match <head> tag
		runCommand('emmet:balance-inward');
		expect(editor.getSelectedBufferRange()).toEqual(new Range([2, 0], [7, 7]));

		// should match inner contents of <head> tag
		runCommand('emmet:balance-inward');
		expect(editor.getSelectedBufferRange()).toEqual(new Range([2, 6], [7, 0]));

		// should match first <meta> tag
		runCommand('emmet:balance-inward');
		expect(editor.getSelectedBufferRange()).toEqual(new Range([3, 1], [3, 23]));

		// should keep selection
		runCommand('emmet:balance-inward');
		expect(editor.getSelectedBufferRange()).toEqual(new Range([3, 1], [3, 23]));
	});
});
