'use strict';

const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

describe('Convert Data:URL action', () => {
	let editor;
	const htmlFile = path.resolve(__dirname, './fixtures/convert-data-url.html');
	const cssFile = path.resolve(__dirname, './fixtures/convert-data-url.css');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);
	const openFile = file => atom.workspace.open(file).then(ed => editor = ed);
	const waitForAsyncAction = () => {
		let flag = false;
		setTimeout(() => flag = true, 100);
		waitsFor(() => flag, 'Wait for async action to perform', 500);
	};


	beforeEach(() => {
		jasmine.useRealClock();
		waitsForPromise(() => atom.packages.activatePackage(pkg.name));
		waitsForPromise(() => atom.packages.activatePackage('language-html'));
		waitsForPromise(() => atom.packages.activatePackage('language-css'));
	});

	afterEach(() => {
		editor.destroy();
		editor = null;
	});

	it('should convert file to data:URL in HTML', () => {
		waitsForPromise(() => openFile(htmlFile));
		runs(() => {
			editor.setCursorBufferPosition([0, 1]);
			runCommand('emmet:convert-data-url');
			waitForAsyncAction();
		});
		runs(() => {
			expect(editor.lineTextForBufferRow(0)).toBe(editor.lineTextForBufferRow(1));
		});
	});

	it('should save data:URL to file HTML', () => {
		const dest = path.resolve(__dirname, './fixtures/images/temp.png');
		const origin = path.resolve(__dirname, './fixtures/images/small.png');
		const showSaveDialog = spyOn(atom.getCurrentWindow(), 'showSaveDialog');
		showSaveDialog.andReturn(dest);

		waitsForPromise(() => openFile(htmlFile));
		runs(() => {
			editor.setCursorBufferPosition([1, 1]);
			runCommand('emmet:convert-data-url');
			waitForAsyncAction();
		});
		runs(() => {
			expect(editor.lineTextForBufferRow(1)).toBe('<img src="../images/temp.png" alt="">');
			expect(fs.readFileSync(dest)).toEqual(fs.readFileSync(origin));
			fs.unlinkSync(dest);
		});
	});

	it('should convert file to data:URL in CSS', () => {
		waitsForPromise(() => openFile(cssFile));
		runs(() => {
			editor.setCursorBufferPosition([1, 20]);
			runCommand('emmet:convert-data-url');
			waitForAsyncAction();
		});
		runs(() => {
			expect(editor.lineTextForBufferRow(1)).toBe('\tbackground: url(\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAAAAACoWZBhAAAAD0lEQVQIW2P4DwcMtGcCAGgtY52g8O1xAAAAAElFTkSuQmCC\');');
		});
	});

	it('should save data:URL to file CSS', () => {
		const dest = path.resolve(__dirname, './fixtures/images/temp.png');
		const origin = path.resolve(__dirname, './fixtures/images/small.png');
		const showSaveDialog = spyOn(atom.getCurrentWindow(), 'showSaveDialog');
		showSaveDialog.andReturn(dest);

		waitsForPromise(() => openFile(cssFile));
		runs(() => {
			editor.setCursorBufferPosition([5, 55]);
			runCommand('emmet:convert-data-url');
			waitForAsyncAction();
		});
		runs(() => {
			expect(editor.lineTextForBufferRow(5)).toBe('\tbackground-image: some( nested(url(../images/temp.png)) );');
			expect(fs.readFileSync(dest)).toEqual(fs.readFileSync(origin));
			fs.unlinkSync(dest);
		});
	});
});
