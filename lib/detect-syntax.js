'use babel';

import { getPrefix, hasScope } from './utils';

/**
 * Syntaxes known by Emmet. All other syntaxes shoud map to one of these
 * @type {Set}
 */
const knownSyntaxes = new Set([
	'html', 'xml', 'xsl', 'jsx', 'js', 'pug', 'slim', 'haml',
	'css', 'sass', 'scss', 'less', 'sss', 'stylus'
]);
const syntaxAlias = {
	js: 'jsx'
};

/**
 * Syntax-specific checks to decide whether we should provide automatic
 * abbreviation marker for current editor context
 */
const stylesheetActivation = editor =>
	hasScope(editor, 'meta.property-list')
	// Edge case: enable auto-activation for @-prefix
	|| getPrefix(editor, editor.getCursorBufferPosition(), /@[\w@-]*$/);

const autoActivationContext = {
	jsx(editor) {
		return hasScope(editor, 'JSXNested');
	},
	html(editor) {
		// Do not provide automatic abbreviation completion inside HTML tags
		return !hasScope(editor, 'meta.tag') && !hasScope(editor, 'source');
	},
	css: stylesheetActivation,
	scss: stylesheetActivation,
	sass: stylesheetActivation,
	less: stylesheetActivation,
	stylus: stylesheetActivation
};

/**
 * Detect Emmet syntax from given editor’s position.
 * @param {TextEditor} editor
 * @param {Point}      [point]
 * @return {String}    Returns `null` if Emmet syntax can’t be detected
 */
export default function detectSyntax(editor, point) {
	point = point || editor.getCursorBufferPosition();
	const scope = editor.scopeDescriptorForBufferPosition(point);

	return syntaxFromScope(scope);
}

/**
 * Detects syntax from given editor syntax scope descriptor
 * @param  {ScopeDescriptor} scope
 * @return {String}          Returns `null` if syntax cannot be detected
 */
export function syntaxFromScope(scope) {
	return matchSupported(scope, /^source\.(\w+)(?:\.(\w+))?/)
		|| matchSupported(scope, /^text\.(\w+)(?:\.(\w+))?/);
}

/**
 * Check if given syntax is supported by Emmet
 * @param  {String}  syntax
 * @return {Boolean}
 */
export function isSupported(syntax) {
	return knownSyntaxes.has(syntax);
}

/**
 * Check if current editor’s context (syntax, scope) allows automatic Emmet
 * abbreviation activation as user types text. If this function returns `false`,
 * it is recommended to not create any Emmet completions when user types text,
 * but insert them when user activated autocomplete popup manually
 * @param  {TextEditor}  editor
 * @return {Boolean}
 */
export function hasAutoActivateContext(editor) {
	const syntax = detectSyntax(editor);
	return syntax && (!autoActivationContext[syntax] || autoActivationContext[syntax](editor));
}

function matchSupported(scope, regexp) {
	const selectors = scope.getScopesArray();

	// Move from bottom to top until we find supported syntax
	for (let i = selectors.length - 1, m; i >= 0; i--) {
		if (m = selectors[i].match(regexp)) {

			if (isSupported(m[2])) {
				return syntaxAlias[m[2]] || m[2];
			}

			if (isSupported(m[1])) {
				return syntaxAlias[m[1]] || m[1];
			}
		}
	}

	// Unable to find supported syntax
	return null;
}
