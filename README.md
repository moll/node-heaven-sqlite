Heaven.js for SQLite
====================
[![NPM version][npm-badge]](https://www.npmjs.com/package/heaven-sqlite)

**Heaven.js for SQLite** is a JavaScript library for Node.js that gives you a [CRUD][crud] API for your SQLite database by implementing a [Table Data Gateway][table-data-gateway]. It's built on [Heaven.js][heaven] for [Mapbox's SQLite3][node-sqlite3], but will work with other compatible SQLite libraries. Along with [Sqlate.js][sqlate]'s tagged template strings, this permits convenient SQL queries that get parsed to your models and equally easy creation and updating.

Until Heaven.js for SQLite reaches v1, its documentation is likely to be lacking. Sorry for that! It is, however, already used in production.

[npm-badge]: https://img.shields.io/npm/v/heaven-sqlite.svg
[table-data-gateway]: https://www.martinfowler.com/eaaCatalog/tableDataGateway.html
[sqlate]: https://github.com/moll/js-sqlate
[node-sqlite3]: https://github.com/mapbox/node-sqlite3
[heaven]: https://github.com/moll/js-heaven
[crud]: https://en.wikipedia.org/wiki/Create,_read,_update_and_delete


Installing
----------
```sh
npm install heaven-sqlite
```

Heaven.js for SQLite follows [semantic versioning](http://semver.org), so feel free to depend on its major version with something like `>= 1.0.0 < 2` (a.k.a `^1.0.0`).


Using
-----
Instantiate `SqliteHeaven` by passing it the constructor for your model, an SQLite connection and a table name:

```javascript
var SqliteHeaven = require("heaven-sqlite")
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
