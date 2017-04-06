'use strict';

const { Point } = require('atom');
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

describe('Convert Data:URL action', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/convert-data-url.html');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);

	beforeEach(() => {
		jasmine.useRealClock();
		waitsForPromise(() => atom.packages.activatePackage(pkg.name));
		waitsForPromise(() => atom.packages.activatePackage('language-html'));
		waitsForPromise(() => atom.workspace.open(filePath).then(ed => editor = ed));
	});

	afterEach(() => {
		editor.destroy();
		editor = null;
	});

	it('should convert file to data:URL', () => {
		let flag = false;
		const run = pos => {
			flag = false;
			editor.setCursorBufferPosition(pos);
			runs(() => setTimeout(() => flag = true, 100));
			runCommand('emmet:convert-data-url');
			waitsFor(() => flag, "Wait for async action to perform", 500);
		};

		run([0, 1]);
		runs(() => {
			expect(editor.lineTextForBufferRow(0)).toBe(editor.lineTextForBufferRow(1));
		});
	});

	it('should save data:URL to file', () => {
		let flag = false;
		const run = pos => {
			flag = false;
			editor.setCursorBufferPosition(pos);
			runs(() => setTimeout(() => flag = true, 100));
			runCommand('emmet:convert-data-url');
			waitsFor(() => flag, "Wait for async action to perform", 500);
		};

		const dest = path.resolve(__dirname, './fixtures/images/temp.png');
		const origin = path.resolve(__dirname, './fixtures/images/small.png');
		const showSaveDialog = spyOn(atom.getCurrentWindow(), 'showSaveDialog');
		showSaveDialog.andReturn(dest);

		run([1, 1]);
		runs(() => {
			expect(editor.lineTextForBufferRow(1)).toBe('<img src="../images/temp.png" alt="">');
			expect(fs.readFileSync(dest)).toEqual(fs.readFileSync(origin));
			fs.unlinkSync(dest);
		});
	});
});
