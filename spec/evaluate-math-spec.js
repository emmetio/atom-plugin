'use strict';

const { Point } = require('atom');
const path = require('path');
const pkg = require('../package.json');

describe('Evaluate Math Expression action', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/math.txt');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);

	beforeEach(() => {
		waitsForPromise(() => atom.packages.activatePackage(pkg.name));
		waitsForPromise(() => atom.workspace.open(filePath).then(ed => editor = ed));
	});

	it('should evaluate expression', () => {
		const run = () => runCommand('emmet:evaluate-math-expression');
		const line = num => editor.lineTextForBufferRow(num);

		editor.setCursorBufferPosition([0, 3]);

		run();
		expect(line(0)).toEqual('3');

		editor.setCursorBufferPosition([1, 9]);
		run();
		expect(line(1)).toEqual('foo 3');

		editor.setCursorBufferPosition([2, 13]);
		run();
		expect(line(2)).toEqual('padding: 5px');
		expect(editor.getCursorBufferPosition()).toEqual(new Point(2, 10));


		editor.setCursorBufferPosition([3, 5]);
		run();
		expect(line(3)).toEqual('test3');
		expect(editor.getCursorBufferPosition()).toEqual(new Point(3, 5));
	});

	it('should not evaluate expression', () => {
		const run = () => runCommand('emmet:evaluate-math-expression');
		const line = num => editor.lineTextForBufferRow(num);

		editor.setCursorBufferPosition([3, 5]);
		run();
		expect(line(3)).toEqual('test3');
		expect(editor.getCursorBufferPosition()).toEqual(new Point(3, 5));

		editor.setCursorBufferPosition([4, 3]);
		run();
		expect(line(4)).toEqual('bar');
		expect(editor.getCursorBufferPosition()).toEqual(new Point(4, 3));
	});
});
