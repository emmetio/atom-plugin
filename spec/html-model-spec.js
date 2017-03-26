'use babel';

import path from 'path';
import parse from '../lib/model/html';

describe('HTML Model', () => {
	const point = (row, column) => ({ row, column });

	it('should be parsed from HTML document', () => {
		waitsForPromise(() =>
			atom.workspace.open(path.resolve(__dirname, './fixtures/sample.html'))
			.then(editor => {
				const model = parse(editor, 'html');
				expect(model).toBeTruthy();

				const docElem = model.firstChild;
				expect(docElem.name).toBe('html');
				expect(docElem.open.start).toEqual(point(1, 0));
				expect(docElem.open.end).toEqual(point(1, 16));

				expect(docElem.close.start).toEqual(point(15, 0));
				expect(docElem.close.end).toEqual(point(15, 7));

				const head = docElem.firstChild;
				expect(head.name).toBe('head');
				expect(head.open.start).toEqual(point(2, 0));
				expect(head.open.end).toEqual(point(2, 6));
				expect(head.close.start).toEqual(point(7, 0));
				expect(head.close.end).toEqual(point(7, 7));
				expect(head.children.length).toBe(4);

				const meta1 = head.firstChild;
				expect(meta1.name).toBe('meta');
				expect(meta1.open.start).toEqual(point(3, 1));
				expect(meta1.open.end).toEqual(point(3, 23));
				expect(meta1.close).toBeUndefined();
				expect(meta1.attributes.length).toBe(1);
				expect(meta1.attributes[0].name.value).toBe('charset');
				expect(meta1.attributes[0].value.value).toBe('UTF-8');

				const meta2 = meta1.nextSibling;
				expect(meta2.name).toBe('meta');
				expect(meta2.open.start).toEqual(point(4, 1));
				expect(meta2.open.end).toEqual(point(4, 71));
				expect(meta2.close).toBeUndefined();
				expect(meta2.attributes.length).toBe(2);

				const ul = head.nextSibling.firstChild;
				expect(ul.name).toBe('ul');
				expect(ul.open.start).toEqual(point(9, 0));
				expect(ul.open.end).toEqual(point(10, 13));
				expect(ul.attributes.length).toBe(1);
				expect(ul.attributes[0].name.value).toBe('class');
				expect(ul.attributes[0].value.value).toBe('test');
			})
		);
	});
});
