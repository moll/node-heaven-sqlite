var Heaven = require("heaven")
var Sql = require("sqlate").Sql
var sql = require("sqlate")
var EMPTY_OBJ_PROMISE = Promise.resolve({})
exports = module.exports = SqliteHeaven
exports.insert = insert
exports.update = update

function SqliteHeaven(model, sqlite, table) {
	Heaven.call(this, model)
	this.sqlite = sqlite
	this.table = table
}

SqliteHeaven.prototype = Object.create(Heaven.prototype, {
	constructor: {value: SqliteHeaven, configurable: true, writeable: true}
})

SqliteHeaven.prototype.idColumn = "id"

SqliteHeaven.prototype.with = function(props) {
	var heaven = Heaven.prototype.with.call(this, props)
	if ("idColumn" in props) heaven.idColumn = props.idColumn
	return heaven
}

SqliteHeaven.prototype._search = function(query) {
	switch (this.typeof(query)) {
		case "model":
			query = this.identify(query)
			// Fall through.

		case "number":
		case "string":
			query = sql`
				SELECT * FROM ${sql.table(this.table)}
				WHERE ${sql.column(this.idColumn)} = ${query}
			`
			break

		case "array":
			if (query.length === 0) return Promise.resolve([])

			var type = this.typeof(query[0])
			var homogeneous = query.every((q) => type === this.typeof(q))
			if (!homogeneous) throw new TypeError("Mixed Query in Array")

			switch (type) {
				case "model":
					query = query.map(this.identify, this)
					// Fall through.

				case "number":
				case "string":
					query = sql`
						SELECT * FROM ${sql.table(this.table)}
						WHERE ${sql.column(this.idColumn)} IN ${sql.tuple(query)}
					`
					break

				default: throw new TypeError("Bad Query in Array: " + query[0])
			}
			break

		case "sql": break
		default: throw new TypeError("Bad Query: " + query)
	}

	return this.select(query)
}

SqliteHeaven.prototype._read = function(query) {
	switch (this.typeof(query)) {
		case "model":
			query = this.identify(query)
			// Fall through.

		case "number":
		case "string":
			query = sql`
				SELECT * FROM ${sql.table(this.table)}
				WHERE ${sql.column(this.idColumn)} = ${query}
				LIMIT 1
			`

		// Fall through.
		case "sql": return this.select1(query)
		default: throw new TypeError("Bad Query: " + query)
	}
}

SqliteHeaven.prototype._create = function(attrs) {
	var self = this

	// Fire off request to last row immediately as others may be interleaved
	// otherwise.
	return Promise.all(attrs.map(function(attrs) {
		var created = self.execute(insert(self.table, attrs))
		var last = self.select1(getLastInsert(self.table))
		return created.then(() => last)
	}))
}

SqliteHeaven.prototype._update = function(query, attrs) {
	switch (this.typeof(query)) {
		case "model":
			query = this.identify(query)
			// Fall through.

		case "number":
		case "string":
			if (isEmpty(attrs)) return EMPTY_OBJ_PROMISE

			return this.execute(sql`
				${update(this.table, attrs)}
				WHERE ${sql.column(this.idColumn)} = ${query}`
			)

		default: throw new TypeError("Bad Query: " + query)
	}
}

SqliteHeaven.prototype._delete = function(query) {
	switch (this.typeof(query)) {
		case "model":
			query = this.identify(query)
			// Fallthrough.

		case "number":
		case "string":
			return this.execute(sql`
				DELETE FROM ${sql.table(this.table)}
				WHERE ${sql.column(this.idColumn)} = ${query}`
			)

		default: throw new TypeError("Bad Query: " + query)
	}
}

SqliteHeaven.prototype.typeof = function(value) {
	if (value instanceof Sql) return "sql"
	return Heaven.prototype.typeof.call(this, value)
}

SqliteHeaven.prototype.select = function(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)
	return promise(this.sqlite.all.bind(this.sqlite, String(sql), sql.parameters))
}

SqliteHeaven.prototype.select1 = function(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)
	return promise(this.sqlite.get.bind(this.sqlite, String(sql), sql.parameters))
}

SqliteHeaven.prototype.execute = function(sql) {
	if (!(sql instanceof Sql)) throw new TypeError("Not Sql: " + sql)
	return promise(this.sqlite.run.bind(this.sqlite, String(sql), sql.parameters))
}

function insert(table, attrs) {
	if (isEmpty(attrs))
		return sql`INSERT INTO ${sql.table(table)} DEFAULT VALUES`
	else
		return sql`
			INSERT INTO ${sql.table(table)} ${sql.tuple(keys(attrs).map(sql.column))}
			VALUES ${sql.tuple(values(attrs))}
		`
}

function update(table, attrs) {
	return sql`
		UPDATE ${sql.table(table)}
		SET ${sql.csv(map(attrs, (val, name) => sql`${sql.column(name)} = ${val}`))}
	`
}

function map(obj, fn) {
  var array = []
  for (var key in obj) array.push(fn(obj[key], key))
  return array
}

function keys(obj) {
  var keys = []
  for (var key in obj) keys.push(key)
  return keys
}

function values(obj) {
  var values = []
  for (var key in obj) values.push(obj[key])
  return values
}

function getLastInsert(table) {
	return sql`SELECT * FROM ${sql.table(table)} WHERE oid = last_insert_rowid()`
}

function promise(fn) {
	return new Promise((yes, no) => fn((err, val) => err ? no(err) : yes(val)))
}

function isEmpty(obj) { for (obj in obj) return false; return true }
