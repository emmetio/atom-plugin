'use strict';

const { Point } = require('atom');
const path = require('path');
const pkg = require('../package.json');

describe('Update Image Size action (CSS)', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/image-size.css');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);

	beforeEach(() => {
		jasmine.useRealClock();
		waitsForPromise(() => atom.packages.activatePackage(pkg.name));
		waitsForPromise(() => atom.packages.activatePackage('language-css'));
		waitsForPromise(() => atom.workspace.open(filePath).then(ed => editor = ed));
	});

	afterEach(() => {
		editor.destroy();
		editor = null;
	});

	const run = pos => {
		let flag = false;
		editor.setCursorBufferPosition(pos);
		runCommand('emmet:update-image-size');
		setTimeout(() => flag = true, 200)
		waitsFor(() => flag, "Wait for async action to perform", 500);
	};

	it('should update rule without width and height', () => {
		run([1, 18]);
		runs(() => {
			expect(editor.lineTextForBufferRow(2)).toBe('\twidth: 234px;');
			expect(editor.lineTextForBufferRow(3)).toBe('\theight: 234px;');
		});
	});

	it('should update rule with width property', () => {
		run([5, 22]);
		runs(() => {
			expect(editor.lineTextForBufferRow(6)).toBe('\twidth: 234px;');
			expect(editor.lineTextForBufferRow(7)).toBe('\theight: 234px;');
		});
	});

	it('should update rule with height property', () => {
		run([9, 33]);
		runs(() => {
			expect(editor.lineTextForBufferRow(9)).toBe('c {background:url(./images/sample.jpg);width:234px;height:234px;}');
		});
	});

	it('should update rule with 2x source', () => {
		run([12, 26]);
		runs(() => {
			expect(editor.lineTextForBufferRow(13)).toBe('\twidth:117px;');
			expect(editor.lineTextForBufferRow(14)).toBe('\theight:117px;');
		});
	});

	it('should not update CSS rule from proprerty without url()', () => {
		run([16, 6]);
		runs(() => {
			expect(editor.lineTextForBufferRow(17)).toBe('}');
		});
	});
});
