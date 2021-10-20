Heaven.js for SQLite
====================
[![NPM version][npm-badge]](https://www.npmjs.com/package/heaven-sqlite)
[![Build status][build-badge]](https://github.com/moll/node-heaven-sqlite/actions/workflows/node.yaml)

**Heaven.js for SQLite** is a JavaScript library for Node.js that gives you a [CRUD][crud] API for your SQLite database by implementing a [Data Mapper][data-mapper] or [Table Data Gateway][table-data-gateway] object. It's built on [Heaven.js][heaven] and comes with adapters for [Mapbox's SQLite3][mapbox-sqlite3] and [Joshua Wise's Better SQLite3][better-sqlite3]. It'll also work with other SQLite libraries that have compatible APIs. Along with [Sqlate.js][sqlate]'s tagged template strings, this permits convenient SQL queries that get parsed to your models and equally easy creation and updating.

[npm-badge]: https://img.shields.io/npm/v/heaven-sqlite.svg
[build-badge]: https://github.com/moll/node-heaven-sqlite/actions/workflows/node.yaml/badge.svg
[data-mapper]: https://www.martinfowler.com/eaaCatalog/dataMapper.html
[table-data-gateway]: https://www.martinfowler.com/eaaCatalog/tableDataGateway.html
[sqlate]: https://github.com/moll/js-sqlate
[mapbox-sqlite3]: https://github.com/mapbox/node-sqlite3
[better-sqlite3]: https://github.com/JoshuaWise/better-sqlite3
[heaven]: https://github.com/moll/js-heaven
[crud]: https://en.wikipedia.org/wiki/Create,_read,_update_and_delete


Installing
----------
```sh
npm install heaven-sqlite
```

Heaven.js for SQLite follows [semantic versioning](http://semver.org), so feel free to depend on its major version with something like `>= 1.0.0 < 2` (a.k.a `^1.0.0`).


Using with Mapbox's SQLite3
---------------------------
Instantiate `SqliteHeaven` by passing it the constructor for your model, an SQLite connection and a table name:

```javascript
var SqliteHeaven = require("heaven-sqlite/mapbox")
var Sqlite3 = require("sqlite3")
var sqlite = new Sqlite3.Database(":memory:")
sqlite.serialize()

function Model(attrs) { Object.assign(this, attrs)}
var modelsDb = new SqliteHeaven(Model, sqlite, "models")
```

Suppose the "models" table looks like this:
```sql
CREATE TABLE "models" (
  "id" INTEGER PRIMARY KEY NOT NULL,
  "name" TEXT DEFAULT '',
  "age" INTEGER DEFAULT 0
)
```

You can then call the five [CRUD][crud] methods like described in [Heaven.js's README][heaven]:

```javascript
var sql = require("sqlate")

var john = await modelsDb.create({name: "John", age: 13})
var mike = await modelsDb.create({name: "Mike", age: 42})

modelsDb.search(sql`SELECT * FROM models WHERE age < 15`)
modelsDb.read(john.id)
modelsDb.update(model, {age: 42})
modelsDb.delete(model)
```


Using with Joshua Wise's Better SQLite3
---------------------------------------
Instantiate `SqliteHeaven` by passing it the constructor for your model, an SQLite connection and a table name:

```javascript
var SqliteHeaven = require("heaven-sqlite/better")
var Sqlite3 = require("better-sqlite3")
var sqlite = new Sqlite3.Database(":memory:", {memory: true})

function Model(attrs) { Object.assign(this, attrs)}
var modelsDb = new SqliteHeaven(Model, sqlite, "models")
```

Suppose the "models" table looks like this:
```sql
CREATE TABLE "models" (
  "id" INTEGER PRIMARY KEY NOT NULL,
  "name" TEXT DEFAULT '',
  "age" INTEGER DEFAULT 0
)
```

You can then call the five [CRUD][crud] methods like described in [Heaven.js's README][heaven], but compared to Mapbox's SQLite3, synchronously:

```javascript
var sql = require("sqlate")

var john = modelsDb.create({name: "John", age: 13})
var mike = modelsDb.create({name: "Mike", age: 42})

modelsDb.search(sql`SELECT * FROM models WHERE age < 15`)
modelsDb.read(john.id)
modelsDb.update(model, {age: 42})
modelsDb.delete(model)
```


License
-------
Heaven.js for SQLite is released under a *Lesser GNU Affero General Public License*, which in summary means:

- You **can** use this program for **no cost**.
- You **can** use this program for **both personal and commercial reasons**.
- You **do not have to share your own program's code** which uses this program.
- You **have to share modifications** (e.g. bug-fixes) you've made to this program.

For more convoluted language, see the `LICENSE` file.


About
-----
**[Andri Möll][moll]** typed this and the code.  
[Monday Calendar][monday] supported the engineering work.

If you find Heaven.js for SQLite needs improving, please don't hesitate to type to me now at [andri@dot.ee][email] or [create an issue online][issues].

[email]: mailto:andri@dot.ee
[issues]: https://github.com/moll/node-heaven-sqlite/issues
[moll]: https://m811.com
[monday]: https://mondayapp.com
