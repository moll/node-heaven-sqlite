## Unreleased
- Adds support for [Mapbox's/Ghost's SQLite3][mapbox-sqlite3] v5.  
  This really just expanded the peer-dependency version bounds.

- Uses SQLite3 v3.35's `INSERT … RETURNING` statement when possible to improve the performance of `Heaven.prototype.create` by permitting batched inserts (a single `INSERT` statement for all rows).  
  Previously `Heaven.prototype.create` inserted rows one by one and used `last_insert_rowid()` to re-read them. This was necessary to get, e.g., the auto-incremented ids for the rows.

  Batched inserts may explicitly set some columns as `NULL`s that triggered the SQL schema's `DEFAULT` value before in situations where the array of attributes has inconsistent keys. That's because batch insert requires all rows to affect the same columns _and_ there's no explicit `DEFAULT` keyword in SQLite for a single value.

  Given this may affect someone depending on individual insertion and the defaulting behavior, bumping the major version.

## 1.1.0 (Aug 21, 2022)
- Adds support for [Joshua Wise's Better SQLite3][better-sqlite3] v7.  
  This really just raised the peer-dependency version bounds.

## 1.0.0 (Oct 20, 2021)
- Permits overwriting the `sqlite` and `table` properties by calling `SqliteHeaven.prototype.with`:

  ```javascript
  var heaven = new SqliteHeaven(Model, sqlite, "models")
  var newHeaven = heaven.with({sqlite: otherSqlite, table: "other_models"})
  ```

  This could be handy if you pool Sqlite connections and want to overwrite the default connection of a Heaven instance with one that has a transaction open, for example.

- Adds `SqliteHeaven.prototype.create_` for when you're not interested in the id of the created model(s). This both permits batch creating (a single `INSERT` statement) and improves performance by skipping parsing the returned attributes.

- Returns `undefined` from `SqliteHeaven.prototype.update` and `SqliteHeaven.prototype.delete` instead of the Sqlite implementation's regular result.  
  Trying to always return the implementation's result (which was the number of rows updated with Better SQLite3) interferes with batching updates.

## 0.3.0 (Sep 17, 2021)
- Adds support for [Joshua Wise's Better SQLite3][better-sqlite3].  
  Better SQLite3 is also synchronous, so all of the CRUD methods of `BetterSqliteHeaven` are also synchronous. The [Mapbox's SQLite3][mapbox-sqlite3] version continues to be asynchronous and promised-based.

  You can get the data mapper for Better SQLite3 from `heaven-sqlite/better`:

  ```javascript
  var SqliteHeaven = require("heaven-sqlite/better")
  var Sqlite3 = require("better-sqlite3")
  var sqlite = new Sqlite3.Database(":memory:", {memory: true})

  function Model(attrs) { Object.assign(this, attrs)}
  var modelsDb = new SqliteHeaven(Model, sqlite, "models")
  ```

- HeavenSqlite.js's tests use the `async` feature of JavaScript and therefore require Node v7.6 or newer. HeavenSqlite.js itself should run well even in Node v4.

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
