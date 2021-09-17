var Heaven = require("heaven")
var Sql = require("sqlate").Sql
var sql = require("sqlate")
var isEmpty = require("./lib").isEmpty
var update = require("./lib/sql").update

exports.idColumn = "id"

exports.with = function(props) {
	var heaven = Heaven.prototype.with.call(this, props)
	if ("idColumn" in props) heaven.idColumn = props.idColumn
	return heaven
}

exports._search = function(query) {
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
			if (query.length === 0) return this.return([])

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

exports._read = function(query) {
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

exports._update = function(query, attrs) {
	switch (this.typeof(query)) {
		case "model":
			query = this.identify(query)
			// Fall through.

		case "number":
		case "string":
			if (isEmpty(attrs)) return this.return(undefined)

			return this.execute(sql`
				${update(this.table, attrs)}
				WHERE ${sql.column(this.idColumn)} = ${query}`
			)

		default: throw new TypeError("Bad Query: " + query)
	}
}

exports._delete = function(query) {
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

exports.typeof = function(value) {
	if (value instanceof Sql) return "sql"
	return Heaven.prototype.typeof.call(this, value)
}
