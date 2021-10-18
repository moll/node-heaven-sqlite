var Heaven = require("heaven/sync")
var SqliteHeaven = require("./prototype")
var Sql = require("sqlate").Sql
var sql = require("sqlate")
var insert = require("./lib/sql").insert
var update = require("./lib/sql").update
exports = module.exports = BetterSqliteHeaven
exports.insert = insert
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
BetterSqliteHeaven.prototype.typeof = SqliteHeaven.typeof

BetterSqliteHeaven.prototype._create = function(attrs) {
	return attrs.map((attrs) => {
		var created = this.execute(insert(this.table, attrs))

		return this.select1(sql`
			SELECT * FROM ${sql.table(this.table)}
			WHERE oid = ${created.lastInsertRowid}
		`)
	})
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
