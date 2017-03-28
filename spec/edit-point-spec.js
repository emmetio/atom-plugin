'use strict';

const { Point } = require('atom');
const path = require('path');
const pkg = require('../package.json');

describe('HTML Edit Point Action', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/edit-point.html');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);
	const getCursorPos = () => editor.getCursorBufferPosition();

	beforeEach(() => {
		waitsForPromise(() => atom.packages.activatePackage(pkg.name));
		waitsForPromise(() => atom.packages.activatePackage('language-html'));
		waitsForPromise(() => atom.workspace.open(filePath).then(ed => editor = ed));
	});

	afterEach(() => {
		editor.destroy();
		editor = null;
	});

	it('should go to next edit point', () => {
		const run = () => runCommand('emmet:go-to-next-edit-point');

		// Go to initial position
		editor.setCursorBufferPosition([1, 3]);

		run(); // Go to empty `title` attribute
		expect(getCursorPos()).toEqual(new Point(1, 12));

		run(); // Go to point between <li> and <a>
		expect(getCursorPos()).toEqual(new Point(1, 14));

		run(); // Go to point inside <a></a>
		expect(getCursorPos()).toEqual(new Point(1, 30));

		run(); // Go to point between </a> and </li>
		expect(getCursorPos()).toEqual(new Point(1, 34));

		run(); // Go to first empty line (with spaces)
		expect(getCursorPos()).toEqual(new Point(2, 2));

		run(); // Go to second empty line (no spaces)
		expect(getCursorPos()).toEqual(new Point(3, 0));

		run(); // Go to point between <li> and <a> (2)
		expect(getCursorPos()).toEqual(new Point(4, 17));

		run(); // Go to empty `href` attribute
		expect(getCursorPos()).toEqual(new Point(4, 26));

		run(); // Go to point inside <a></a>
		expect(getCursorPos()).toEqual(new Point(4, 28));

		run(); // Go to point between </a> and </li>
		expect(getCursorPos()).toEqual(new Point(4, 32));

		run(); // No more edit points
		expect(getCursorPos()).toEqual(new Point(4, 32));
	});

	it('should go to previous edit point', () => {
		const run = () => runCommand('emmet:go-to-previous-edit-point');

		// Go to initial position
		editor.setCursorBufferPosition([4, 28]);

		run(); // Go to empty `href` attribute
		expect(getCursorPos()).toEqual(new Point(4, 26));

		run(); // Go to point between <li> and <a> (2)
		expect(getCursorPos()).toEqual(new Point(4, 17));

		run(); // Go to second empty line (no spaces)
		expect(getCursorPos()).toEqual(new Point(3, 0));

		run(); // Go to first empty line (with spaces)
		expect(getCursorPos()).toEqual(new Point(2, 2));

		run(); // Go to point between </a> and </li>
		expect(getCursorPos()).toEqual(new Point(1, 34));

		run(); // Go to point inside <a></a>
		expect(getCursorPos()).toEqual(new Point(1, 30));

		run(); // Go to point between <li> and <a>
		expect(getCursorPos()).toEqual(new Point(1, 14));

		run(); // Go to empty `title` attribute
		expect(getCursorPos()).toEqual(new Point(1, 12));

		run(); // No more edit points
		expect(getCursorPos()).toEqual(new Point(1, 12));
	});
});
