var _ = require("./lib")
var Heaven = require("heaven/async")
var SqliteHeaven = require("./prototype")
var Sql = require("sqlate").Sql
var Sqlite = require("./lib/sqlite")
var sql = require("sqlate")
var insert = require("./lib/sql").insert
var insertAll = require("./lib/sql").insertAll
var insertAllWithMaxVariables = require("./lib/sql").insertAllWithMaxVariables
var update = require("./lib/sql").update
var SQLITE_VERSION = require("sqlite3").VERSION
var SQLITE_MAX_VARIABLE_NUMBER = Sqlite.getMaxVariableNumber(SQLITE_VERSION)
var USE_RETURNING = Sqlite.hasReturning(SQLITE_VERSION)
exports = module.exports = MapboxSqliteHeaven
exports.insert = insert
exports.insertAll = insertAll
exports.insertAllWithMaxVariables = insertAllWithMaxVariables
exports.update = update

function MapboxSqliteHeaven(model, sqlite, table) {
	Heaven.call(this, model)
	this.sqlite = sqlite
	this.table = table
}

MapboxSqliteHeaven.prototype = Object.create(Heaven.prototype, {
	constructor: {value: MapboxSqliteHeaven, configurable: true, writeable: true}
})

MapboxSqliteHeaven.prototype.idColumn = SqliteHeaven.idColumn
MapboxSqliteHeaven.prototype.with = SqliteHeaven.with
MapboxSqliteHeaven.prototype._search = SqliteHeaven._search
MapboxSqliteHeaven.prototype._read = SqliteHeaven._read
MapboxSqliteHeaven.prototype.create_ = SqliteHeaven.create_
MapboxSqliteHeaven.prototype._update = SqliteHeaven._update
MapboxSqliteHeaven.prototype._delete = SqliteHeaven._delete
MapboxSqliteHeaven.prototype.typeof = SqliteHeaven.typeof

MapboxSqliteHeaven.prototype._create = function(attrs) {
	if (USE_RETURNING) return Promise.all(insertAllWithMaxVariables(
		SQLITE_MAX_VARIABLE_NUMBER,
		this.table,
		attrs
	).map((query) => this.select(sql`${query} RETURNING *`))).then(_.flatten)

	else return Promise.all(attrs.map((attrs) => {
		var created = this.execute(insert(this.table, attrs))

		// Fire off request to last row immediately as others may be interleaved
		// otherwise.
		var last = this.select1(sql`
			SELECT * FROM ${sql.table(this.table)}
			WHERE _rowid_ = last_insert_rowid()
		`)

		return created.then(() => last)
	}))
}

MapboxSqliteHeaven.prototype._create_ = function(attrs) {
	return Promise.all(insertAllWithMaxVariables(
		SQLITE_MAX_VARIABLE_NUMBER,
		this.table,
		attrs
	).map(this.execute, this)).then(() => undefined)
}

MapboxSqliteHeaven.prototype.select = function(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)
	return promise(this.sqlite.all.bind(this.sqlite, String(sql), sql.parameters))
}

MapboxSqliteHeaven.prototype.select1 = function(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)
	return promise(this.sqlite.get.bind(this.sqlite, String(sql), sql.parameters))
}

MapboxSqliteHeaven.prototype.execute = function(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)
	return promise(this.sqlite.run.bind(this.sqlite, String(sql), sql.parameters))
}

MapboxSqliteHeaven.prototype.return = Promise.resolve.bind(Promise)

function promise(fn) {
	return new Promise((yes, no) => fn((err, val) => err ? no(err) : yes(val)))
}
