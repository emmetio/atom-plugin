'use strict';

const { Point } = require('atom');
const path = require('path');
const pkg = require('../package.json');

describe('Toggle Block Comment action (HTML)', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/toggle-comment.html');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);
	const run = () => runCommand('emmet:toggle-block-comment');

	beforeEach(() => {
		waitsForPromise(() => atom.packages.activatePackage(pkg.name));
		waitsForPromise(() => atom.packages.activatePackage('language-html'));
		waitsForPromise(() => atom.workspace.open(filePath).then(ed => editor = ed));
	});

	afterEach(() => {
		editor.destroy();
		editor = null;
	});

	it('should toggle comment', () => {
		// Go to <span> tag (1)
		editor.setCursorBufferPosition([3, 15]);

		run(); // comment <span> tag (1)
		expect(editor.lineTextForBufferRow(3)).toBe('            <!-- <span></span> -->');
		expect(editor.getCursorBufferPosition()).toEqual(new Point(3, 20));

		run(); // un-comment <span> tag (1)
		expect(editor.lineTextForBufferRow(3)).toBe('            <span></span>');
		expect(editor.getCursorBufferPosition()).toEqual(new Point(3, 15));
	});

	it('should remove inner comment', () => {
		// Go to <span> tag (1)
		editor.setCursorBufferPosition([3, 15]);

		run();
		expect(editor.lineTextForBufferRow(3).trim()).toBe('<!-- <span></span> -->');

		// Go to <span> tag (3)
		editor.setCursorBufferPosition([6, 15]);
		run();
		expect(editor.lineTextForBufferRow(6).trim()).toBe('<!-- <span></span> -->');

		// Go to <li> tag (1)
		editor.setCursorBufferPosition([1, 6]);

		run(); // toggle comment on <li>, remove inner comments
		expect(editor.lineTextForBufferRow(1).trim()).toBe('<!-- <li>');
		expect(editor.lineTextForBufferRow(3).trim()).toBe('<span></span>');
		expect(editor.lineTextForBufferRow(8).trim()).toBe('</li> -->');
	});

	it('should not work outside node definition', () => {
		editor.setCursorBufferPosition([2, 4]);
		run();

		expect(editor.lineTextForBufferRow(1).trim()).toBe('<li>');
		expect(editor.lineTextForBufferRow(8).trim()).toBe('</li>');
	});


});
