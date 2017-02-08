export default {
	entry: './index.js',
	external: [
		'@emmetio/expand-abbreviation',
		'@emmetio/extract-abbreviation',
		'atom'
	],
	format: 'cjs',
	dest: 'dist/atom-plugin.js'
};
