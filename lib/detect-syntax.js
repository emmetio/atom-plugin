'use strict';

/**
 * Syntaxes known by Emmet. All other syntaxed shoud map to one of these
 * @type {Set}
 */
const knownSyntaxes = new Set([
	'html', 'xml', 'xsl', 'jsx', 'pug', 'slim', 'haml',
	'css', 'sass', 'scss', 'less', 'sss', 'stylus'
]);
const reText = /^text\.(\w+)(?:\.(\w+))?/;
const reSource = /^source\.(\w+)(?:\.(\w+))?/;

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
	return matchSupported(scope, reSource) || matchSupported(scope, reText);
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
	if ((syntax === 'js' || syntax === 'jsx') && !editor.bufferRangeForScopeAtCursor('JSXNested')) {
		// auto-insert marker into explicit JSX context only
		return false;
	}

	return true;
}

function matchSupported(scope, regexp) {
	const m = matches(scope.getScopesArray(), regexp);

	if (m) {
		// check for more specific syntax match, e.g. `source.css.scss`
		if (isSupported(m[2])) {
			return m[2];
		} else if (isSupported(m[1])) {
			return m[1];
		}
	}

	// Unable to find supported syntax
	return null;
}

/**
 * Check if any selector (from last to first) of given array of scopes matches
 * given regexp. Returns regexp match object, if available
 * @param  {String[]} selectors
 * @param  {RegExp}   regexp
 * @return {Object}   Regexp match object
 */
function matches(selectors, regexp) {
	for (let i = selectors.length - 1, m; i >= 0; i--) {
		if (m = selectors[i].match(regexp)) {
			return m;
		}
	}
}
