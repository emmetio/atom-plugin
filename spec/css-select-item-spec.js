'use strict';

const { Range } = require('atom');
const path = require('path');
const pkg = require('../package.json');

describe('Select Item Action (CSS)', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/select-item.scss');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);
	const getSelection = () => editor.getSelectedBufferRange();

	beforeEach(() => {
		waitsForPromise(() => atom.packages.activatePackage(pkg.name));
		waitsForPromise(() => atom.packages.activatePackage('language-sass'));
		waitsForPromise(() => atom.workspace.open(filePath).then(ed => editor = ed));
	});

	it('should select next item', () => {
		const run = () => runCommand('emmet:select-next-item');

		// Go to initial position
		editor.setCursorBufferPosition([0, 0]);

		run(); // Select name of `body` rule
		expect(getSelection()).toEqual(new Range([0, 0], [0, 4]));

		run(); // Select full `color` property
		expect(getSelection()).toEqual(new Range([1, 1], [1, 16]));

		run(); // Select name of `color` property
		expect(getSelection()).toEqual(new Range([1, 1], [1, 6]));

		run(); // Select value of `color` property
		expect(getSelection()).toEqual(new Range([1, 8], [1, 15]));

		run(); // Select name of `.nav, .bar` rule
		expect(getSelection()).toEqual(new Range([4, 0], [4, 10]));

		run(); // Select first selector of `.nav, .bar` rule
		expect(getSelection()).toEqual(new Range([4, 0], [4, 4]));

		run(); // Select second selector of `.nav, .bar` rule
		expect(getSelection()).toEqual(new Range([4, 6], [4, 10]));

		run(); // Select full `animation` property
		expect(getSelection()).toEqual(new Range([5, 1], [5, 49]));

		run(); // Select name of `animation` property
		expect(getSelection()).toEqual(new Range([5, 1], [5, 10]));

		run(); // Select full value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 12], [5, 48]));

		run(); // Select first value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 12], [5, 31]));

		run(); // Select token 1 of first value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 12], [5, 17]));

		run(); // Select token 2 of first value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 18], [5, 22]));

		run(); // Select token 3 of first value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 23], [5, 31]));

		run(); // Select second value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 33], [5, 48]));

		run(); // Select token 1 of second value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 33], [5, 38]));

		run(); // Select token 2 of second value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 39], [5, 41]));

		run(); // Select token 2 of second value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 42], [5, 48]));

		run(); // Select full `background` property
		expect(getSelection()).toEqual(new Range([6, 1], [6, 48]));

		run(); // Select name of `background` property
		expect(getSelection()).toEqual(new Range([6, 1], [6, 11]));

		run(); // Select value of `background` property
		expect(getSelection()).toEqual(new Range([6, 13], [6, 47]));

		run(); // Select url token of `background` property
		expect(getSelection()).toEqual(new Range([6, 13], [6, 28]));

		run(); // Select argument of url token of `background` property
		expect(getSelection()).toEqual(new Range([6, 17], [6, 27]));

		run(); // Select function (1) of `background` property
		expect(getSelection()).toEqual(new Range([6, 29], [6, 47]));

		run(); // Select function (1) argument of `background` property
		expect(getSelection()).toEqual(new Range([6, 33], [6, 46]));

		run(); // Select function (2) argument (1) of `background` property
		expect(getSelection()).toEqual(new Range([6, 37], [6, 40]));

		run(); // Select function (2) argument (1) of `background` property
		expect(getSelection()).toEqual(new Range([6, 42], [6, 45]));

		run(); // Select full name of at-rule section
		expect(getSelection()).toEqual(new Range([9, 0], [9, 25]));

		run(); // Select name of at-rule section
		expect(getSelection()).toEqual(new Range([9, 0], [9, 6]));

		run(); // Select expression of at-rule section
		expect(getSelection()).toEqual(new Range([9, 7], [9, 25]));

		run(); // Select expression argument of at-rule section
		expect(getSelection()).toEqual(new Range([9, 8], [9, 24]));

		run(); // Select nested rule name
		expect(getSelection()).toEqual(new Range([10, 1], [10, 5]));

		run(); // Select full `padding` property
		expect(getSelection()).toEqual(new Range([11, 2], [11, 32]));

		run(); // Select name of `padding` property
		expect(getSelection()).toEqual(new Range([11, 2], [11, 9]));

		run(); // Select value of `padding` property
		expect(getSelection()).toEqual(new Range([11, 11], [11, 31]));

		run(); // Select token (1) of value of `padding` property
		expect(getSelection()).toEqual(new Range([11, 11], [11, 16]));

		run(); // Select token (2) of value of `padding` property
		expect(getSelection()).toEqual(new Range([11, 27], [11, 31]));

		run(); // Nothing to select, keep current selection
		expect(getSelection()).toEqual(new Range([11, 27], [11, 31]));
	});

	it('should select previous item', () => {
		const run = () => runCommand('emmet:select-previous-item');

		// Go to initial position
		editor.setCursorBufferPosition([14, 0]);

		run(); // Select token (2) of value of `padding` property
		expect(getSelection()).toEqual(new Range([11, 27], [11, 31]));

		run(); // Select token (1) of value of `padding` property
		expect(getSelection()).toEqual(new Range([11, 11], [11, 16]));

		run(); // Select value of `padding` property
		expect(getSelection()).toEqual(new Range([11, 11], [11, 31]));

		run(); // Select name of `padding` property
		expect(getSelection()).toEqual(new Range([11, 2], [11, 9]));

		run(); // Select full `padding` property
		expect(getSelection()).toEqual(new Range([11, 2], [11, 32]));

		run(); // Select nested rule name
		expect(getSelection()).toEqual(new Range([10, 1], [10, 5]));

		run(); // Select expression argument of at-rule section
		expect(getSelection()).toEqual(new Range([9, 8], [9, 24]));

		run(); // Select expression of at-rule section
		expect(getSelection()).toEqual(new Range([9, 7], [9, 25]));

		run(); // Select name of at-rule section
		expect(getSelection()).toEqual(new Range([9, 0], [9, 6]));

		run(); // Select full name of at-rule section
		expect(getSelection()).toEqual(new Range([9, 0], [9, 25]));

		run(); // Select function (2) argument (1) of `background` property
		expect(getSelection()).toEqual(new Range([6, 42], [6, 45]));

		run(); // Select function (2) argument (1) of `background` property
		expect(getSelection()).toEqual(new Range([6, 37], [6, 40]));

		run(); // Select function (1) argument of `background` property
		expect(getSelection()).toEqual(new Range([6, 33], [6, 46]));

		run(); // Select function (1) of `background` property
		expect(getSelection()).toEqual(new Range([6, 29], [6, 47]));

		run(); // Select argument of url token of `background` property
		expect(getSelection()).toEqual(new Range([6, 17], [6, 27]));

		run(); // Select url token of `background` property
		expect(getSelection()).toEqual(new Range([6, 13], [6, 28]));

		run(); // Select value of `background` property
		expect(getSelection()).toEqual(new Range([6, 13], [6, 47]));

		run(); // Select name of `background` property
		expect(getSelection()).toEqual(new Range([6, 1], [6, 11]));

		run(); // Select full `background` property
		expect(getSelection()).toEqual(new Range([6, 1], [6, 48]));

		run(); // Select token 2 of second value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 42], [5, 48]));

		run(); // Select token 2 of second value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 39], [5, 41]));

		run(); // Select token 1 of second value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 33], [5, 38]));

		run(); // Select second value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 33], [5, 48]));

		run(); // Select token 3 of first value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 23], [5, 31]));

		run(); // Select token 2 of first value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 18], [5, 22]));

		run(); // Select token 1 of first value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 12], [5, 17]));

		run(); // Select first value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 12], [5, 31]));

		run(); // Select full value of `animation` property
		expect(getSelection()).toEqual(new Range([5, 12], [5, 48]));

		run(); // Select name of `animation` property
		expect(getSelection()).toEqual(new Range([5, 1], [5, 10]));

		run(); // Select full `animation` property
		expect(getSelection()).toEqual(new Range([5, 1], [5, 49]));

		run(); // Select second selector of `.nav, .bar` rule
		expect(getSelection()).toEqual(new Range([4, 6], [4, 10]));

		run(); // Select first selector of `.nav, .bar` rule
		expect(getSelection()).toEqual(new Range([4, 0], [4, 4]));

		run(); // Select name of `.nav, .bar` rule
		expect(getSelection()).toEqual(new Range([4, 0], [4, 10]));

		run(); // Select value of `color` property
		expect(getSelection()).toEqual(new Range([1, 8], [1, 15]));

		run(); // Select name of `color` property
		expect(getSelection()).toEqual(new Range([1, 1], [1, 6]));

		run(); // Select full `color` property
		expect(getSelection()).toEqual(new Range([1, 1], [1, 16]));

		run(); // Select name of `body` rule
		expect(getSelection()).toEqual(new Range([0, 0], [0, 4]));

		run(); // Nothing to select, keep current selection
		expect(getSelection()).toEqual(new Range([0, 0], [0, 4]));
	});
});
