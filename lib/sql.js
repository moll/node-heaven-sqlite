var _ = require("./")
var sql = require("sqlate")

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
			// Node v22.5's embedded SQLite module throws given `undefined`.
			sql.tuple(Array.from(columns, (col) => col in attrs ? attrs[col] : null))
		)))}
	`)
}

// Prior to SQLite v3.32 (2020-05-22), the SQLITE_MAX_VARIABLE_NUMBER was 999.
// Presuming we're running a newer version now.
exports.insertAll = exports.insertAllWithMaxVariables.bind(null, 32766)

exports.update = function(table, attrs) {
	return sql`
		UPDATE ${sql.table(table)} SET ${sql.csv(_.map(attrs, (val, name) => (
			sql`${sql.column(name)} = ${val}`
		)))}
	`
}
