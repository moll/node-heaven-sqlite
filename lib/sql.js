var _ = require("./")
var sql = require("sqlate")

// https://www.sqlite.org/limits.html
// SQLite v3.32 raised this to 32766, but given we don't yet know how to check
// this at runtime, being conservative with the old 999 value.
// There doesn't seem to be a PRAGMA to query the max variable count either:
// https://www.sqlite.org/pragma.html
var SQLITE_MAX_VARIABLE_NUMBER = 999

exports.insert = function(table, attrs) {
	if (_.isEmpty(attrs))
		return sql`INSERT INTO ${sql.table(table)} DEFAULT VALUES`
	else
		return sql`
			INSERT INTO ${sql.table(table)}
			${sql.tuple(_.keys(attrs).map(sql.column))}
			VALUES ${sql.tuple(_.values(attrs))}
		`
}

exports.insertAllWithMaxVariables = function(maxVariableCount, table, attrs) {
	var columns = new Set
	attrs.forEach((attrs) => { for (var column in attrs) columns.add(column) })

	if (columns.size == 0) return attrs.map((_attrs) => sql`
		INSERT INTO ${sql.table(table)} DEFAULT VALUES
	`)

	let insert = sql`
		INSERT INTO ${sql.table(table)}
		${sql.tuple(Array.from(columns, sql.column))}
	`

	var chunkSize = Math.floor(maxVariableCount / columns.size)
	return _.chunk(chunkSize, attrs).map((chunk) => sql`
		${insert} VALUES ${sql.csv(chunk.map((attrs) => (
			sql.tuple(Array.from(columns, (col) => attrs[col]))
		)))}
	`)
}

exports.insertAll =
	exports.insertAllWithMaxVariables.bind(null, SQLITE_MAX_VARIABLE_NUMBER)

exports.update = function(table, attrs) {
	return sql`
		UPDATE ${sql.table(table)} SET ${sql.csv(_.map(attrs, (val, name) => (
			sql`${sql.column(name)} = ${val}`
		)))}
	`
}
