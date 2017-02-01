'use strict';

import { expand } from '@emmetio/expand-abbreviation';

const field = (index, placeholder) =>
	`\${${index}${placeholder ? ':' + placeholder : ''}}`;

/**
 * Autocomplete provider for Atom’s autocomplete+ package.
 * All Emmet abbreviations are expanded as a part of autocomplete suggestion.
 */
export default {
	selector: '.text.html',
	getSuggestions(ctx) {
		const syntax = 'html';

		try {
			const suggestion = {
				snippet: expand(ctx.prefix, { syntax, field }),
				type: 'snippet',
				displayText: 'Expand abbr',
				suggestionPriority: 10
			};
			console.log(suggestion);
			return suggestion.snippet ? [suggestion] : null;
		} catch(err) {
			console.warn(err);
			return err;
		}
	}
};
