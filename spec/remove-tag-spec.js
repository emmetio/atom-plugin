'use strict';

const { Point } = require('atom');
const path = require('path');
const pkg = require('../package.json');

describe('Remove Tag Action', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/remove-tag.html');
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

	it('should remove tag under cursor', () => {
		const run = () => runCommand('emmet:remove-tag');

		// Go to initial position
		editor.setCursorBufferPosition([1, 4]);

		run(); // Remove unary tag
		expect(editor.lineTextForBufferRow(1)).toBe('\t');
		expect(editor.getCursorBufferPosition()).toEqual(new Point(1, 1));

		editor.setCursorBufferPosition([2, 4]);
		run(); // Remove tag and adjust indentation
		expect(editor.getCursorBufferPosition()).toEqual(new Point(2, 1));
		expect(editor.lineTextForBufferRow(2)).toBe('\t<section>');
		expect(editor.lineTextForBufferRow(3)).toBe('\t\t<ul>');
		expect(editor.lineTextForBufferRow(4)).toBe('\t\t\t<li class="item"></li>');
		expect(editor.lineTextForBufferRow(5)).toBe('\t\t\t<li class="item"></li>');
		expect(editor.lineTextForBufferRow(6)).toBe('\t\t\t<li class="item"></li>');
		expect(editor.lineTextForBufferRow(7)).toBe('\t\t</ul>');
		expect(editor.lineTextForBufferRow(8)).toBe('\t</section>');
	});

	it('should remove inner tag', () => {
		// Go to initial position
		editor.setCursorBufferPosition([11, 8]);

		runCommand('emmet:remove-tag'); // Remove unary tag
		expect(editor.lineTextForBufferRow(11)).toBe('\t<span></span>');
		expect(editor.getCursorBufferPosition()).toEqual(new Point(11, 7));
	});

	it('should not remove tag outside cursor', () => {
		const text = editor.getText();
		editor.setCursorBufferPosition([6, 2]);

		runCommand('emmet:remove-tag');
		expect(editor.getText()).toBe(text);
	});
});
