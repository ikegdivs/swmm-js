<!-- multilang from README.md




NO MODIFIQUE ESTE ARCHIVO. FUE GENERADO AUTOMÁTICAMENTE POR multilang.js




-->
# tabulator
Inserta datos en tablas

![designing](https://img.shields.io/badge/stability-desgining-red.svg)
[![version](https://img.shields.io/npm/v/tabulator.svg)](https://npmjs.org/package/tabulator)
[![downloads](https://img.shields.io/npm/dm/tabulator.svg)](https://npmjs.org/package/tabulator)
[![build](https://img.shields.io/travis/codenautas/tabulator/master.svg)](https://travis-ci.org/codenautas/tabulator)
[![coverage](https://img.shields.io/coveralls/codenautas/tabulator/master.svg)](https://coveralls.io/r/codenautas/tabulator)
[![climate](https://img.shields.io/codeclimate/github/codenautas/tabulator.svg)](https://codeclimate.com/github/codenautas/tabulator)
[![dependencies](https://img.shields.io/david/codenautas/tabulator.svg)](https://david-dm.org/codenautas/tabulator)

<!--multilang buttons-->

idioma: ![castellano](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-es.png)
también disponible en:
[![inglés](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-en.png)](README.md)

## Instalación


```sh
$ npm install tabulator
```


## Ejemplo


```js
var Tabulator = require('tabulator').Tabulator;
var tabulator = new Tabulator();

var data=sql.query('SELECT * FROM data');

var matrix=tabulator.toMatrix(data);

res.send(tabulator.toHtmlTable(matrix));
```


## Licencias

[MIT](LICENSE)

