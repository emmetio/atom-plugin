'use babel';

import evaluate from '@emmetio/math-expression';
import BufferStreamReader from '../buffer-stream';

export default function(editor) {
	const stream = new BufferStreamReader(editor.getBuffer());
	editor.transact(() => {
		editor.getCursorsOrderedByBufferPosition().reverse()
		.forEach(cursor => {
			const pos = cursor.getBufferPosition();
			stream.pos = pos;

			try {
				const result = String(evaluate(stream, true));
				editor.setTextInBufferRange([stream.pos, pos], result);
			} catch (err) {
				// Ignore error since most likely it’s because of non-math expression
				console.warn('Math evaluation error', err);
			}
		});
	});
}
