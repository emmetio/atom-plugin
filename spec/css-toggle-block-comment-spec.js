'use strict';

const { Point } = require('atom');
const path = require('path');
const pkg = require('../package.json');

describe('Toggle Block Comment action (CSS)', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/sample.css');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);
	const run = () => runCommand('emmet:toggle-block-comment');

	beforeEach(() => {
		waitsForPromise(() => atom.packages.activatePackage(pkg.name));
		waitsForPromise(() => atom.packages.activatePackage('language-css'));
		waitsForPromise(() => atom.workspace.open(filePath).then(ed => editor = ed));
	});

	afterEach(() => {
		editor.destroy();
		editor = null;
	});

	it('should toggle comment', () => {
		// Go to body’s padding property
		editor.setCursorBufferPosition([1, 5]);

		run(); // comment padding property
		expect(editor.lineTextForBufferRow(1)).toBe('\t/* padding: 10px; */');
		expect(editor.getCursorBufferPosition()).toEqual(new Point(1, 8));

		run(); // un-comment padding property
		expect(editor.lineTextForBufferRow(1)).toBe('\tpadding: 10px;');
		expect(editor.getCursorBufferPosition()).toEqual(new Point(1, 5));

		editor.setCursorBufferPosition([4, 4]);
		run(); // comment `.foo, #bar` rule
		expect(editor.lineTextForBufferRow(4)).toBe('/* .foo,');
		expect(editor.lineTextForBufferRow(9)).toBe('} */');
		expect(editor.getCursorBufferPosition()).toEqual(new Point(4, 7));

		editor.setCursorBufferPosition([6, 1]);
		run(); // property un-comment `.foo, #bar` rule when caret is inside comment
		expect(editor.lineTextForBufferRow(4)).toBe('.foo,');
		expect(editor.lineTextForBufferRow(9)).toBe('}');
		expect(editor.getCursorBufferPosition()).toEqual(new Point(6, 1));

		editor.setCursorBufferPosition([8, 8]);
		run(); // propery comment un-terminated property
		expect(editor.lineTextForBufferRow(8)).toBe('\t/* background: rgba(255, 255, 255, 0.5) */');
		expect(editor.getCursorBufferPosition()).toEqual(new Point(8, 11));
	});

	it('should not work outside rule name/selector', () => {
		editor.setCursorBufferPosition([0, 6]);
		run();

		expect(editor.lineTextForBufferRow(0).trim()).toBe('body {');
		expect(editor.lineTextForBufferRow(2).trim()).toBe('}');
	});
});
