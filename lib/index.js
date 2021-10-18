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

exports.chunk = function(chunkLength, array) {
  if (array.length == 0) return []
  if (array.length <= chunkLength) return [array]

	var chunkCount = Math.ceil(array.length / chunkLength)
  var chunks = new Array(chunkCount)

  for (var chunkIndex = 0, i = 0; chunkIndex < chunkCount; ++chunkIndex)
		chunks[chunkIndex] = array.slice(i, i += chunkLength)

  return chunks
}

exports.isEmpty = function(obj) { for (obj in obj) return false; return true }
