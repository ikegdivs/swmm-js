# js-to-html


Create HTML text from JS object


![extending](https://img.shields.io/badge/stability-extending-orange.svg)
[![npm-version](https://img.shields.io/npm/v/js-to-html.svg)](https://npmjs.org/package/js-to-html)
[![downloads](https://img.shields.io/npm/dm/js-to-html.svg)](https://npmjs.org/package/js-to-html)
[![build](https://img.shields.io/travis/codenautas/js-to-html/master.svg)](https://travis-ci.org/codenautas/js-to-html)
[![coverage](https://img.shields.io/coveralls/codenautas/js-to-html/master.svg)](https://coveralls.io/r/codenautas/js-to-html)
[![climate](https://img.shields.io/codeclimate/github/codenautas/js-to-html.svg)](https://codeclimate.com/github/codenautas/js-to-html)
[![dependencies](https://img.shields.io/david/codenautas/js-to-html.svg)](https://david-dm.org/codenautas/js-to-html)
[![qa-control](http://codenautas.com/github/codenautas/js-to-html.svg)](http://codenautas.com/github/codenautas/js-to-html)


language: ![English](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-en.png)
also available in:
[![Spanish](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-es.png)](LEEME.md)

## Install


```sh
$ npm install js-to-html
```

## API

### html.TAGNAME([attributes, ]content)
Returns an Html object with TAGNAME, attributes and content.


**content** could be
 * a string expression
 * an array of children. Each child could be
   * a string expression
   * an Html object


**attributes** must be a plain object. Each property of the object will be an html attribute (example: `{colspan:3, id:"abc"}`).
Some attributes names are reserved words, you can use them with the same name (example: `{class:'examples'}`).
Some attributes (like **class**) could contain lists (example: `{class:['examples', 'lists']}`).

### Html.toHtmlText(opts)

Returns an Html Text

opt    |value
-------|-------
pretty | returns a pretty and indented text

## Example

```js
var html = require('js-to-html').html;

console.log(
    html.div(
        {'class':'the_class', id:'47'},
        [
            html.p('First paragraph'),
            html.p('Second paragraph'),
        ]
    ).toHtmlText({pretty:true})
)

/* logs:
<div class=the_class id=47>
  <p>First paragraph</p>
  <p>Second paragraph</p>
</div>
*/
```

### Html.toHtmlDoc(opts)

Same as `Html.toHtmlText(opts)` but returns `doctype` in the first line and completes with con HTML, HEAD, BODY and TITLE elements:


```html
var html = require("js-to-html").html;

console.log(
    html.img({src:'photo.png'}).toHtmlDoc({title:"my photo", pretty:true})
)

/*
<!doctype html>
<html>
  <head>
    <title>my photo</title>
  </head>
  <body>
    <img src=photo.png>
  </body>
</html>
*/
```

opt        |value
-----------|-------
pretty     | returns a pretty and indented text
incomplete | do not complete with  html, head y body tags
title      | text title

## Using with DOM in client-side

All html objects have a `create` method that build a DOM Element ready to append to a existing one.
`create` builds the element and inside elements too.

```js
var html = jsToHtml.html;

document.body.appendChild(
    html.div([
        html.h1('Log in'),
        html.div([
            html.input({name: 'user', placeholder:'user'}),
            html.input({name: 'pass', type: 'password'})
        ])
    ]).create()
);

```

## Special behavior

type      |name           |use
----------|---------------|--------------
function  | html._text    | simple text (like `createTextNode`)
function  | html._comment | html comment (like `< !-- ... -- >`)
attribute | classList     | for a class name list (this module rejects class with spaces like {"class": "una otra separada por espacio"} )

## Insecure mode


```js
html.insecureModeEnabled = true;
console.log(html.div({id:'this'}, html.includeHtml('<svg xml:....> </svg>')));
```

## Notes
 * In the future it will be smart to handle **style** attribute like `{style:{color: "blue", background: "none"}}`

## Tests with real devices


NPM version |Device                 |OS             |nav                      |obs
------------|-----------------------|---------------|-------------------------|----
0.9.1       | Samsung Galaxy Note 4 | Android 6.0.1 | Chrome Mobile 44.0.2403 |
0.9.1       | Blue Vivo Air LTE     | Android 5.0.2 | Chrome Mobile 50.0.2661 |
0.9.1       | Samsung Galaxy S3     | Android 4.3.0 | Android 4.3.0           |
0.9.1       | HTC Desire            | Android 2.2.2 | Android 2.2.2           | polyfill:classList
0.9.1       | iPad mini Retina      | iOS 8.4.0     | Mobile Safari 8.0.0     |
0.9.1       | VMWare                | WinXP         | IE 8.0.0                | polyfill:many

## License


[MIT](LICENSE)
