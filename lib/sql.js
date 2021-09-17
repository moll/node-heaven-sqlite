var sql = require("sqlate")
var map = require("./").map
var keys = require("./").keys
var values = require("./").values
var isEmpty = require("./").isEmpty

exports.insert = function(table, attrs) {
	if (isEmpty(attrs))
		return sql`INSERT INTO ${sql.table(table)} DEFAULT VALUES`
	else
		return sql`
			INSERT INTO ${sql.table(table)} ${sql.tuple(keys(attrs).map(sql.column))}
			VALUES ${sql.tuple(values(attrs))}
		`
}

exports.update = function(table, attrs) {
	return sql`
		UPDATE ${sql.table(table)}
		SET ${sql.csv(map(attrs, (val, name) => sql`${sql.column(name)} = ${val}`))}
	`
}
