function smooshRecursively (array) {
  var smooshed = []
  for (var i = 0; i < array.length; i++) {
    if (array[i] instanceof Array) {
      smooshed.push.apply(smooshed, smooshRecursively(array[i]))
    } else {
      smooshed.push(array[i])
    }
  }
  return smooshed
}

function smooshLeveled (level, array) {
  var smooshed = []
  for (var i = 0; i < level + 1; i++) {
    if (array[i] instanceof Array) {
      for (var j = 0; j < array[i].length; j++) {
        smooshed.push(array[i][j])
      }
    } else {
      smooshed.push(array[i])
    }
  }
  return smooshed
}

function smoosh (array, level) {
  if (typeof level === 'undefined' || level === Infinity) {
    return smooshRecursively(array)
  }
  return smooshLeveled(level, array)
}

module.exports = smoosh
