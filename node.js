var Heaven = require("heaven/sync")
var SqliteHeaven = require("./prototype")
var Sql = require("sqlate").Sql
var sql = require("sqlate")
var insert = require("./lib/sql").insert
var insertAll = require("./lib/sql").insertAll
var insertAllWithMaxVariables = require("./lib/sql").insertAllWithMaxVariables
var update = require("./lib/sql").update
var MAX_VARIABLE_NUMBER = 32766
exports = module.exports = NodeSqliteHeaven
exports.insert = insert
exports.insertAll = insertAll
exports.insertAllWithMaxVariables = insertAllWithMaxVariables
exports.update = update

function NodeSqliteHeaven(model, sqlite, table) {
	Heaven.call(this, model)
	this.sqlite = sqlite
	this.table = table
}

NodeSqliteHeaven.prototype = Object.create(Heaven.prototype, {
	constructor: {value: NodeSqliteHeaven, configurable: true, writeable: true}
})

NodeSqliteHeaven.prototype.idColumn = SqliteHeaven.idColumn
NodeSqliteHeaven.prototype.with = SqliteHeaven.with
NodeSqliteHeaven.prototype._search = SqliteHeaven._search
NodeSqliteHeaven.prototype._read = SqliteHeaven._read
NodeSqliteHeaven.prototype.create_ = SqliteHeaven.create_
NodeSqliteHeaven.prototype.typeof = SqliteHeaven.typeof

// NOTE: Node.js SQLite returned rows are not inheriting from Object.prototype.
NodeSqliteHeaven.prototype._create = function(attrs) {
	// Node v22.5 launched with SQLite v3.46.
	return insertAllWithMaxVariables(
		MAX_VARIABLE_NUMBER,
		this.table,
		attrs
	).flatMap((q) => this.select(sql`${q} RETURNING *`))
}

NodeSqliteHeaven.prototype._create_ = function(attrs) {
	insertAllWithMaxVariables(
		MAX_VARIABLE_NUMBER,
		this.table,
		attrs
	).forEach(this.execute, this)
}

NodeSqliteHeaven.prototype._update = function(query, attrs) {
	SqliteHeaven._update.call(this, query, attrs)
}

NodeSqliteHeaven.prototype._delete = function(query, attrs) {
	SqliteHeaven._delete.call(this, query, attrs)
}

NodeSqliteHeaven.prototype.select = function(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)
	var statement = this.sqlite.prepare(String(sql))
	return statement.all.apply(statement, sql.parameters)
}

NodeSqliteHeaven.prototype.select1 = function(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)
	var statement = this.sqlite.prepare(String(sql))
	return statement.get.apply(statement, sql.parameters)
}

NodeSqliteHeaven.prototype.execute = function(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)
	var statement = this.sqlite.prepare(String(sql))
	return statement.run.apply(statement, sql.parameters)
}

NodeSqliteHeaven.prototype.return = function(value) { return value }
