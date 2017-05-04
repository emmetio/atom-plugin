'use babel';

import path from 'path';
import create from '../lib/model/css';

describe('CSS Model', () => {
	const point = (row, column) => ({ row, column });

	beforeEach(() => {
		waitsForPromise(() => atom.packages.activatePackage('language-css'));
	});

	it('should be parsed from CSS document', () => {
		waitsForPromise(() =>
			atom.workspace.open(path.resolve(__dirname, './fixtures/sample.css'))
			.then(editor => {
				const model = create(editor).dom;
				expect(model).toBeTruthy();

				const rule1 = model.firstChild;
				expect(rule1.type).toBe('rule');
				expect(rule1.selector).toBe('body');
				expect(rule1.start).toEqual(point(0, 0));
				expect(rule1.end).toEqual(point(2, 1));
				expect(rule1.selectorToken.start).toEqual(point(0, 0));
				expect(rule1.selectorToken.end).toEqual(point(0, 4));
				expect(rule1.contentStartToken.start).toEqual(point(0, 5));
				expect(rule1.contentEndToken.end).toEqual(point(2, 1));

				const prop1 = rule1.firstChild;
				expect(prop1.type).toBe('property');
				expect(prop1.name).toBe('padding');
				expect(prop1.value).toBe('10px');
				expect(prop1.start).toEqual(point(1, 1));
				expect(prop1.end).toEqual(point(1, 15));
				expect(prop1.nameToken.start).toEqual(point(1, 1));
				expect(prop1.nameToken.end).toEqual(point(1, 8));
				expect(prop1.valueToken.start).toEqual(point(1, 10));
				expect(prop1.valueToken.end).toEqual(point(1, 14));
			})
		);
	});

	it('should get node for point', () => {
		waitsForPromise(() =>
			atom.workspace.open(path.resolve(__dirname, './fixtures/sample.css'))
			.then(editor => {
				const model = create(editor, 'css');
				expect(model).toBeTruthy();
				expect(model.syntax).toBe('css');

				const prop1 = model.nodeForPoint([1, 5]);
				expect(prop1).toBeTruthy();
				expect(prop1.type).toBe('property');
				expect(prop1.name).toBe('padding');
				expect(prop1.start).toEqual(point(1, 1));
				expect(prop1.end).toEqual(point(1, 15));

				// Match from closing brace
				const rule1 = model.nodeForPoint([9, 0]);
				expect(rule1).toBeTruthy();
				expect(rule1.type).toBe('rule');
				expect(rule1.selector).toBe('.foo,\n#bar');
				expect(rule1.start).toEqual(point(4, 0));
				expect(rule1.end).toEqual(point(9, 1));
			})
		);
	});
});
