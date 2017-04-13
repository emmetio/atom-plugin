'use babel';

import evaluate from '@emmetio/math-expression';
import BufferStreamReader from '../buffer-stream';

const pkg = require('../../package.json');
let enabled = true;

atom.config.observe(`${pkg.name}.enableMathCompletions`, value => {
	enabled = value;
});

/**
 * Autocomplete+ provider factory that suggests evaluated math expression
 */
export default function(selector) {
	return {
		selector,
		getSuggestions({editor, bufferPosition}) {
			if (!enabled) {
				return null;
			}

			const stream = new BufferStreamReader(editor.getBuffer(), bufferPosition);

			try {
				const text = String(evaluate(stream, true));
				const range = [stream.pos, bufferPosition];
				const prefix = editor.getTextInBufferRange(range);

				if (prefix !== text) {
					// in case if expression is a single number, don’t provide completion
					return [{
						text,
						replacementPrefix: prefix,
						displayText: `Evaluate to ${text}`,
						type: 'value'
					}];
				}
			} catch(err) {
				return null;
			}
		}
	};
}
