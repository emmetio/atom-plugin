# Emmet plugin for [Atom](https://atom.io)

> This is experimental alpha version of new Emmet plugin and UX concept. Currently, plugin only expands abbreviations and doesn’t contain any additional actions like [Balance](http://docs.emmet.io/actions/match-pair/) or [Update Image Size](http://docs.emmet.io/actions/update-image-size/), they will be added later.

Unlike current [Emmet plugin](https://atom.io/packages/emmet), new one doesn’t hijacks tab key handler. Instead, it installs itself as [autocomplete+](https://github.com/atom/autocomplete-plus) provider and provides expanded abbreviation and Emmet snippets as autocomplete options:

![Emmet Atom](http://download.emmet.io/emmet-atom.gif)

An abbreviation being expanded is automatically highlighted with subtle rounded border.

## Auto-activation vs. manual activation

Since almost every word in your text editor can be abbreviation, Emmet limits automatic (e.g. “as-you-type”) abbreviation activation for limited syntax scopes only. But you can force abbreviation activation simply by manually invoking autocomplete popup with <kbd>Ctrl+Space</kbd> shortcut in any file. It’s an alternative to <kbd>Ctrl-E</kbd> shortcut in previous Emmet plugin.

## Installation

Because of heavy development stage, this plugin can be installed via `apm` only. In Terminal, run the following command:

```shell
apm install emmetio/atom-plugin
```
