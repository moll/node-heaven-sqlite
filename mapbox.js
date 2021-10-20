var Heaven = require("heaven/async")
var SqliteHeaven = require("./prototype")
var Sql = require("sqlate").Sql
var sql = require("sqlate")
var insert = require("./lib/sql").insert
var insertAll = require("./lib/sql").insertAll
var update = require("./lib/sql").update
exports = module.exports = MapboxSqliteHeaven
exports.insert = insert
exports.insertAll = insertAll
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
	return Promise.all(attrs.map((attrs) => {
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
	return Promise.all(
		insertAll(this.table, attrs).map(this.execute, this)
	).then(() => undefined)
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
