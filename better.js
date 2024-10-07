var _ = require("./lib")
var Heaven = require("heaven/sync")
var SqliteHeaven = require("./prototype")
var Sql = require("sqlate").Sql
var Sqlite = require("./lib/sqlite")
var sql = require("sqlate")
var insert = require("./lib/sql").insert
var insertAll = require("./lib/sql").insertAll
var insertAllWithMaxVariables = require("./lib/sql").insertAllWithMaxVariables
var update = require("./lib/sql").update
var sqliteVersions = new WeakMap
var sqliteHasReturning = new WeakMap
var sqliteMaxVariableNumbers = new WeakMap
exports = module.exports = BetterSqliteHeaven
exports.insert = insert
exports.insertAll = insertAll
exports.insertAllWithMaxVariables = insertAllWithMaxVariables
exports.update = update

function BetterSqliteHeaven(model, sqlite, table) {
	Heaven.call(this, model)
	this.sqlite = sqlite
	this.table = table
}

BetterSqliteHeaven.prototype = Object.create(Heaven.prototype, {
	constructor: {value: BetterSqliteHeaven, configurable: true, writeable: true}
})

BetterSqliteHeaven.prototype.idColumn = SqliteHeaven.idColumn
BetterSqliteHeaven.prototype.with = SqliteHeaven.with
BetterSqliteHeaven.prototype._search = SqliteHeaven._search
BetterSqliteHeaven.prototype._read = SqliteHeaven._read
BetterSqliteHeaven.prototype.create_ = SqliteHeaven.create_
BetterSqliteHeaven.prototype.typeof = SqliteHeaven.typeof

BetterSqliteHeaven.prototype._create = function(attrs) {
	var sqlite = this.sqlite

	if (hasSqliteReturning(sqlite)) return _.flatten(insertAllWithMaxVariables(
		getSqliteMaxVariableNumber(sqlite),
		this.table,
		attrs
	).map((q) => this.select(sql`${q} RETURNING *`)))

	else return attrs.map((attrs) => {
		var created = this.execute(insert(this.table, attrs))

		return this.select1(sql`
			SELECT * FROM ${sql.table(this.table)}
			WHERE _rowid_ = ${created.lastInsertRowid}
		`)
	})
}

BetterSqliteHeaven.prototype._create_ = function(attrs) {
	insertAllWithMaxVariables(
		getSqliteMaxVariableNumber(this.sqlite),
		this.table,
		attrs
	).forEach(this.execute, this)
}

BetterSqliteHeaven.prototype._update = function(query, attrs) {
	SqliteHeaven._update.call(this, query, attrs)
}

BetterSqliteHeaven.prototype._delete = function(query, attrs) {
	SqliteHeaven._delete.call(this, query, attrs)
}

BetterSqliteHeaven.prototype.select = function(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)
	return this.sqlite.prepare(String(sql)).all(sql.parameters)
}

BetterSqliteHeaven.prototype.select1 = function(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)
	return this.sqlite.prepare(String(sql)).get(sql.parameters)
}

BetterSqliteHeaven.prototype.execute = function(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)
	return this.sqlite.prepare(String(sql)).run(sql.parameters)
}

BetterSqliteHeaven.prototype.return = function(value) { return value }

function getSqliteVersion(sqlite) {
	// While Better SQLite3 may eventually expose the compiled version like
	// Mapbox's SQLite3 does, relying on sqlite_version() permits using different
	// versions in parallel.
	// https://github.com/WiseLibs/better-sqlite3/issues/1021
	var version = sqliteVersions.get(sqlite)
	if (version != null) return version

	version = sqlite.prepare("SELECT sqlite_version() AS v").get().v
	sqliteVersions.set(sqlite, version)
	return version
}

function getSqliteMaxVariableNumber(sqlite) {
	var maxVariableNumber = sqliteMaxVariableNumbers.get(sqlite)
	if (maxVariableNumber != null) return maxVariableNumber

	maxVariableNumber = Sqlite.getMaxVariableNumber(getSqliteVersion(sqlite))
	sqliteMaxVariableNumbers.set(sqlite, maxVariableNumber)
	return maxVariableNumber
}

function hasSqliteReturning(sqlite) {
	var hasReturning = sqliteHasReturning.get(sqlite)
	if (hasReturning != null) return hasReturning

	hasReturning = Sqlite.hasReturning(getSqliteVersion(sqlite))
	sqliteHasReturning.set(sqlite, hasReturning)
	return hasReturning
}
