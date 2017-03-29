'use strict';

const { Range } = require('atom');
const path = require('path');
const pkg = require('../package.json');

describe('Select Item Action', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/select-item.html');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);
	const getSelection = () => editor.getSelectedBufferRange();

	beforeEach(() => {
		waitsForPromise(() => atom.packages.activatePackage(pkg.name));
		waitsForPromise(() => atom.packages.activatePackage('language-html'));
		waitsForPromise(() => atom.workspace.open(filePath).then(ed => editor = ed));
	});

	it('next item', () => {
		const run = () => runCommand('emmet:select-next-item');

		// Go to initial position
		editor.setCursorBufferPosition([0, 0]);

		run(); // Select name of <ul> tag
		expect(getSelection()).toEqual(new Range([1, 1], [1, 3]));

		run(); // Select name of <li> tag (1)
		expect(getSelection()).toEqual(new Range([2, 2], [2, 4]));

		run(); // Select full `title` attribute of <li> tag (1)
		expect(getSelection()).toEqual(new Range([2, 5], [2, 13]));

		run(); // Select value of `title` attribute of <li> tag (1)
		expect(getSelection()).toEqual(new Range([2, 12], [2, 12]));

		run(); // Select name of <li> tag (2)
		expect(getSelection()).toEqual(new Range([3, 2], [3, 4]));

		run(); // Select full `class` attribute of <li> tag (2)
		expect(getSelection()).toEqual(new Range([3, 5], [3, 23]));

		run(); // Select `class` attribute value of <li> tag (2)
		expect(getSelection()).toEqual(new Range([3, 12], [3, 22]));

		run(); // Select first class items of <li> tag (2)
		expect(getSelection()).toEqual(new Range([3, 13], [3, 16]));

		run(); // Select second class items of <li> tag (2)
		expect(getSelection()).toEqual(new Range([3, 18], [3, 21]));

		run(); // Select name of <a> tag
		expect(getSelection()).toEqual(new Range([3, 25], [3, 26]));

		run(); // Select full `href` attribute of <a> tag
		expect(getSelection()).toEqual(new Range([3, 27], [3, 34]));

		run(); // Select value of `href` attribute of <a> tag
		expect(getSelection()).toEqual(new Range([3, 33], [3, 33]));

		run(); // Select name of <li> tag (3)
		expect(getSelection()).toEqual(new Range([4, 2], [4, 4]));

		run(); // Select name of <div> tag
		expect(getSelection()).toEqual(new Range([7, 1], [7, 4]));

		run(); // Select full `title` attribute of <div> tag
		expect(getSelection()).toEqual(new Range([7, 5], [7, 19]));

		run(); // Select value of `title` attribute of <div> tag
		expect(getSelection()).toEqual(new Range([7, 12], [7, 18]));

		run(); // No next item, keep selection
		expect(getSelection()).toEqual(new Range([7, 12], [7, 18]));
	});

	it('previous item', () => {
		const run = () => runCommand('emmet:select-previous-item');

		// Go to initial position
		editor.setCursorBufferPosition([8, 0]);

		run(); // Select value of `title` attribute of <div> tag
		expect(getSelection()).toEqual(new Range([7, 12], [7, 18]));

		run(); // Select full `title` attribute of <div> tag
		expect(getSelection()).toEqual(new Range([7, 5], [7, 19]));

		run(); // Select name of <div> tag
		expect(getSelection()).toEqual(new Range([7, 1], [7, 4]));

		run(); // Select name of <li> tag (3)
		expect(getSelection()).toEqual(new Range([4, 2], [4, 4]));

		run(); // Select value of `href` attribute of <a> tag
		expect(getSelection()).toEqual(new Range([3, 33], [3, 33]));

		run(); // Select full `href` attribute of <a> tag
		expect(getSelection()).toEqual(new Range([3, 27], [3, 34]));

		run(); // Select name of <a> tag
		expect(getSelection()).toEqual(new Range([3, 25], [3, 26]));

		run(); // Select second class items of <li> tag (2)
		expect(getSelection()).toEqual(new Range([3, 18], [3, 21]));

		run(); // Select first class items of <li> tag (2)
		expect(getSelection()).toEqual(new Range([3, 13], [3, 16]));

		run(); // Select `class` attribute value of <li> tag (2)
		expect(getSelection()).toEqual(new Range([3, 12], [3, 22]));

		run(); // Select full `class` attribute of <li> tag (2)
		expect(getSelection()).toEqual(new Range([3, 5], [3, 23]));

		run(); // Select name of <li> tag (2)
		expect(getSelection()).toEqual(new Range([3, 2], [3, 4]));

		run(); // Select value of `title` attribute of <li> tag (1)
		expect(getSelection()).toEqual(new Range([2, 12], [2, 12]));

		run(); // Select full `title` attribute of <li> tag (1)
		expect(getSelection()).toEqual(new Range([2, 5], [2, 13]));

		run(); // Select name of <li> tag (1)
		expect(getSelection()).toEqual(new Range([2, 2], [2, 4]));

		run(); // Select name of <ul> tag
		expect(getSelection()).toEqual(new Range([1, 1], [1, 3]));

		run(); // No previous item, keep selection
		expect(getSelection()).toEqual(new Range([1, 1], [1, 3]));
	});
});
