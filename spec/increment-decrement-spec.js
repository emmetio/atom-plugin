const { Range } = require('atom');
const path = require('path');
const pkg = require('../package.json');
const { locate, update } = require('../lib/actions/increment-decrement');

describe('Increment/Decrement Action', () => {
	let editor;
	const filePath = path.resolve(__dirname, './fixtures/numbers.txt');
	const runCommand = name => atom.commands.dispatch(atom.views.getView(editor), name);
	const getText = range => editor.getTextInBufferRange(range);

	beforeEach(() => {
		waitsForPromise(() => atom.packages.activatePackage(pkg.name));
		waitsForPromise(() => atom.packages.activatePackage('language-html'));
		waitsForPromise(() => atom.workspace.open(filePath).then(ed => editor = ed));
	});

	afterEach(() => {
		editor.destroy();
		editor = null;
	});

	it('should locate proper number', () => {
		expect(locate(editor, [0, 0])).toEqual(new Range([0, 0], [0, 1]));
		expect(locate(editor, [0, 1])).toEqual(new Range([0, 0], [0, 1]));

		expect(locate(editor, [1, 0])).toEqual(new Range([1, 0], [1, 2]));
		expect(locate(editor, [1, 1])).toEqual(new Range([1, 0], [1, 2]));
		expect(locate(editor, [1, 2])).toEqual(new Range([1, 0], [1, 2]));

		expect(locate(editor, [2, 0])).toEqual(new Range([2, 0], [2, 5]));
		expect(locate(editor, [2, 3])).toEqual(new Range([2, 0], [2, 5]));
		expect(locate(editor, [2, 5])).toEqual(new Range([2, 0], [2, 5]));

		expect(locate(editor, [3, 0])).toEqual(new Range([3, 0], [3, 6]));
		expect(locate(editor, [3, 5])).toEqual(new Range([3, 0], [3, 6]));

		expect(locate(editor, [5, 0])).toEqual(new Range([5, 0], [5, 8]));
		expect(locate(editor, [5, 1])).toEqual(new Range([5, 0], [5, 8]));
		expect(locate(editor, [5, 4])).toEqual(new Range([5, 0], [5, 8]));

		expect(locate(editor, [6, 0])).toEqual(new Range([6, 0], [6, 4]));
		expect(locate(editor, [6, 2])).toEqual(new Range([6, 0], [6, 4]));
		expect(locate(editor, [6, 4])).toEqual(new Range([6, 0], [6, 4]));

		expect(locate(editor, [7, 0])).toEqual(new Range([7, 0], [7, 4]));
		expect(locate(editor, [7, 2])).toEqual(new Range([7, 0], [7, 4]));
		expect(locate(editor, [7, 4])).toEqual(new Range([7, 0], [7, 4]));
		expect(locate(editor, [7, 5])).toEqual(new Range([7, 1], [7, 8]));
		expect(locate(editor, [7, 8])).toEqual(new Range([7, 1], [7, 8]));

		expect(locate(editor, [10, 0])).toEqual(new Range([10, 0], [10, 4]));
	});

	it('should update number', () => {
		expect(update('1', 1)).toBe('2');
		expect(update('1', 0.1)).toBe('1.1');
		expect(update('1', 0.3)).toBe('1.3');
		expect(update('1', -0.3)).toBe('0.7');
		expect(update('1', 10)).toBe('11');

		expect(update('0.5', 1)).toBe('1.5');
		expect(update('0.5', 0.3)).toBe('0.8');
		expect(update('0.5', -0.6)).toBe('-0.1');

		// trim integer part
		expect(update('.5', 0.1)).toBe('.6');
		expect(update('.5', 1)).toBe('1.5');
		expect(update('-.5', -.1)).toBe('-.6');
		expect(update('-.5', 1)).toBe('.5');

		expect(update('0010', 1)).toBe('0011');
		expect(update('-0010', 1)).toBe('-0009');
		expect(update('0010', 10000)).toBe('10010');
		expect(update('-0010.100', 1.3)).toBe('-0008.800');
	});

	it('should increment numbers at cursors', () => {
		let sel;

		editor.setCursorBufferPosition([0, 1]);
		editor.addCursorAtBufferPosition([1, 1]);
		editor.addCursorAtBufferPosition([3, 1]);
		editor.addCursorAtBufferPosition([5, 3]);
		editor.addCursorAtBufferPosition([6, 3]);
		editor.addCursorAtBufferPosition([7, 7]);
		editor.addCursorAtBufferPosition([10, 2]);

		runCommand('emmet:increment-number-by-1');
		sel = editor.getSelectedBufferRanges();
		expect(getText(sel[0])).toBe('2');
		expect(getText(sel[1])).toBe('11');
		expect(getText(sel[2])).toBe('101.50');
		expect(getText(sel[3])).toBe('-99.567');
		expect(getText(sel[4])).toBe('1.123');
		expect(getText(sel[5])).toBe('124.321');
		expect(getText(sel[6])).toBe('0011');

		runCommand('emmet:increment-number-by-10');
		sel = editor.getSelectedBufferRanges();
		expect(getText(sel[0])).toBe('12');
		expect(getText(sel[1])).toBe('21');
		expect(getText(sel[2])).toBe('111.50');
		expect(getText(sel[3])).toBe('-89.567');
		expect(getText(sel[4])).toBe('11.123');
		expect(getText(sel[5])).toBe('134.321');
		expect(getText(sel[6])).toBe('0021');

		runCommand('emmet:increment-number-by-0_1');
		sel = editor.getSelectedBufferRanges();
		expect(getText(sel[0])).toBe('12.1');
		expect(getText(sel[1])).toBe('21.1');
		expect(getText(sel[2])).toBe('111.60');
		expect(getText(sel[3])).toBe('-89.467');
		expect(getText(sel[4])).toBe('11.223');
		expect(getText(sel[5])).toBe('134.421');
		expect(getText(sel[6])).toBe('0021.1');
	});

	it('should decrement numbers at cursors', () => {
		let sel;

		editor.setCursorBufferPosition([0, 1]);
		editor.addCursorAtBufferPosition([1, 1]);
		editor.addCursorAtBufferPosition([3, 1]);
		editor.addCursorAtBufferPosition([5, 3]);
		editor.addCursorAtBufferPosition([6, 3]);
		editor.addCursorAtBufferPosition([7, 7]);
		editor.addCursorAtBufferPosition([10, 2]);

		runCommand('emmet:decrement-number-by-1');
		sel = editor.getSelectedBufferRanges();
		expect(getText(sel[0])).toBe('0');
		expect(getText(sel[1])).toBe('9');
		expect(getText(sel[2])).toBe('99.50');
		expect(getText(sel[3])).toBe('-101.567');
		expect(getText(sel[4])).toBe('-.877');
		expect(getText(sel[5])).toBe('122.321');
		expect(getText(sel[6])).toBe('0009');

		runCommand('emmet:decrement-number-by-10');
		sel = editor.getSelectedBufferRanges();
		expect(getText(sel[0])).toBe('-10');
		expect(getText(sel[1])).toBe('-1');
		expect(getText(sel[2])).toBe('89.50');
		expect(getText(sel[3])).toBe('-111.567');
		expect(getText(sel[4])).toBe('-10.877');
		expect(getText(sel[5])).toBe('112.321');
		expect(getText(sel[6])).toBe('-0001');

		runCommand('emmet:decrement-number-by-0_1');
		sel = editor.getSelectedBufferRanges();
		expect(getText(sel[0])).toBe('-10.1');
		expect(getText(sel[1])).toBe('-1.1');
		expect(getText(sel[2])).toBe('89.40');
		expect(getText(sel[3])).toBe('-111.667');
		expect(getText(sel[4])).toBe('-10.977');
		expect(getText(sel[5])).toBe('112.221');
		expect(getText(sel[6])).toBe('-0001.1');
	});
});
