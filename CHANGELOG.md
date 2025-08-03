## 2.1.0 (Aug 3, 2025)
- Refactors SQLite version detection for [Better SQLite3][better-sqlite3] to be per-SQLite connection, permitting parallel use of different versions.  
  This also permits using the Better SQLite3 Heaven adapter with different SQLite modules.

- Adds support for [Node v22.5's experimental SQLite module][node-sqlite3].

  ```js
  var SqliteHeaven = require("heaven-sqlite")
	var Sqlite = require("node:sqlite").DatabaseSync
	var sqlite = new Sqlite(":memory:")
  var heaven = new SqliteHeaven(sqlite, "models")
  heaven.read(42)
  ```

  Note that Node v22.5 itself is buggy due to its [SQLite bindings returning empty rows if no rows were actually returned](https://github.com/nodejs/node/pull/53981). This was [fixed on Jul 23, 2024](https://github.com/nodejs/node/commit/db594d042bbde2cb37a2db11f5c284772a26a8e4) and released as [Node v22.6](https://github.com/nodejs/node/blob/main/doc/changelogs/CHANGELOG_V22.md#2024-08-06-version-2260-current-rafaelgss).

[node-sqlite3]: https://nodejs.org/api/sqlite.html

## 2.0.0 (Jul 19, 2023)
- Adds support for [Mapbox's/Ghost's SQLite3][mapbox-sqlite3] v5.
- Adds support for [Joshua Wise's Better SQLite3][better-sqlite3] v8.

- Uses SQLite v3.35's `INSERT … RETURNING` statement when possible to improve the performance of `Heaven.prototype.create` by permitting batched inserts (a single `INSERT` statement for all rows).  
  Previously `Heaven.prototype.create` inserted rows one by one and used `last_insert_rowid()` to re-read them. This was necessary to get, e.g., the auto-incremented ids for the rows.

  Batched inserts may explicitly set some columns as `NULL`s that triggered the SQL schema's `DEFAULT` value before in situations where the array of attributes has inconsistent keys. That's because batch insert requires all rows to affect the same columns _and_ there's no explicit `DEFAULT` keyword in SQLite for a single value.

  Given this may affect someone depending on individual insertion and the defaulting behavior, bumping the major version.

- Detects the maximum query variable count from SQLite's version.  
  In SQLite v3.32 the default was bumped from 999 to 32766.

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
  var sqlite = new Sqlite3.Database(":memory:")

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
