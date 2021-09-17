## Unreleased
- Adds support for [Joshua Wise's Better SQLite3][better-sqlite3].  
  Better SQLite3 is also synchronous, so all of the CRUD methods of `BetterSqliteHeaven` are also synchronous. The [Mapbox's SQLite3][mapbox-sqlite3] version continues to be asynchronous and promised-based.

  You can get the data mapper for Better SQLite3 from the `heaven-sqlite/better`:

  ```javascript
  var SqliteHeaven = require("heaven-sqlite/better")
  var Sqlite3 = require("better-sqlite3")
  var sqlite = new Sqlite3.Database(":memory:", {memory: true})

  function Model(attrs) { Object.assign(this, attrs)}
  var modelsDb = new SqliteHeaven(Model, sqlite, "models")
  ```

- HeavenSqlite.js's tests use the `async` feature of JavaScript and therefore require Node v7.6 or newer. HeavenSqlite.js itself is fully ECMAScript 5 compatible and should run well even in Node v4.

- Also upgrades [Heaven.js][heaven] to v0.12.  
  That version no longer instantiates models from attributes given to `Heaven.prototype.create`. If you do need models for client-side default attributes, for example, instantiate them before calling `Heaven.prototype.create`:

  ```javascript
  var heaven = new SqliteHeaven(Model, sqlite, "models")

  heaven.create(new Model({name: "John"}))
  ```

[heaven]: https://github.com/moll/js-heaven
[mapbox-sqlite3]: https://github.com/mapbox/node-sqlite3
[better-sqlite3]: https://github.com/JoshuaWise/better-sqlite3

## 0.2.0 (Apr 30, 2019)
- Upgrades [Sqlate.js][sqlate] to v2.  
  See [Sqlate.js's CHANGELOG][sqlate-changelog] for details.

[sqlate]: https://github.com/moll/js-sqlate/
[sqlate-changelog]: https://github.com/moll/js-sqlate/blob/master/CHANGELOG.md

## 0.1.337 (Apr 27, 2019)
- Stairway to SQLite.
