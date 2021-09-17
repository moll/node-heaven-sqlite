exports.map = function(obj, fn) {
  var array = []
  for (var key in obj) array.push(fn(obj[key], key))
  return array
}

exports.keys = function(obj) {
  var keys = []
  for (var key in obj) keys.push(key)
  return keys
}

exports.values = function(obj) {
  var values = []
  for (var key in obj) values.push(obj[key])
  return values
}

exports.isEmpty = function(obj) { for (obj in obj) return false; return true }
