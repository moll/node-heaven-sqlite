var Heaven = require("heaven/async")
var SqliteHeaven = require("./prototype")
var Sql = require("sqlate").Sql
var sql = require("sqlate")
var insert = require("./lib/sql").insert
var update = require("./lib/sql").update
exports = module.exports = MapboxSqliteHeaven
exports.insert = insert
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
MapboxSqliteHeaven.prototype._update = SqliteHeaven._update
MapboxSqliteHeaven.prototype._delete = SqliteHeaven._delete
MapboxSqliteHeaven.prototype.typeof = SqliteHeaven.typeof

MapboxSqliteHeaven.prototype._create = function(attrs) {
	// Fire off request to last row immediately as others may be interleaved
	// otherwise.
	return Promise.all(attrs.map((attrs) => {
		var created = this.execute(insert(this.table, attrs))
		var last = this.select1(getLastInsert(this.table))
		return created.then(() => last)
	}))
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

function getLastInsert(table) {
	return sql`SELECT * FROM ${sql.table(table)} WHERE oid = last_insert_rowid()`
}

function promise(fn) {
	return new Promise((yes, no) => fn((err, val) => err ? no(err) : yes(val)))
}
