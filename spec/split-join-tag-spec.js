'use strict';

const { Point } = require('atom');
const path = require('path');
const pkg = require('../package.json');

describe('Split/Join Tag action', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/split-join-tag.xml');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);
	const run = () => runCommand('emmet:split-join-tag');

	beforeEach(() => {
		waitsForPromise(() => atom.packages.activatePackage(pkg.name));
		waitsForPromise(() => atom.packages.activatePackage('language-xml'));
		waitsForPromise(() => atom.workspace.open(filePath).then(ed => editor = ed));
	});

	afterEach(() => {
		editor.destroy();
		editor = null;
	});

	it('should split/join tag', () => {
		// Go to <br/> tag
		editor.setCursorBufferPosition([1, 3]);

		run(); // Split <br/> tag
		expect(editor.getTextInBufferRange([[1, 1], [1, 10]])).toBe('<br></br>');
		expect(editor.getCursorBufferPosition()).toEqual(new Point(1, 5));

		run(); // Join <br></br> back
		expect(editor.getTextInBufferRange([[1, 1], [1, 6]])).toBe('<br/>');

		// Go to <img src="" alt="" /> tag
		editor.setCursorBufferPosition([1, 10]);

		run(); // Split <img src="" alt="" /> tag
		expect(editor.getTextInBufferRange([[1, 6], [1, 31]])).toBe('<img src="" alt=""></img>');

		run(); // Join <img src="" alt=""></img> back
		expect(editor.getTextInBufferRange([[1, 6], [1, 26]])).toBe('<img src="" alt=""/>');
	});

	it('should remove tag content on join', () => {
		// Go to <ul> tag
		editor.setCursorBufferPosition([3, 3]);

		run();
		expect(editor.lineTextForBufferRow(3), '\t<ul/>');
		expect(editor.lineTextForBufferRow(4), '</div>');
	});
});
