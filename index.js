const CMZ_NAME = 'cmz'

function generateScopedName (filename, line) {
  return filename
    .replace(/\.js$/, '')
    .replace(/\W+/g, '_') + '-' + line
}

module.exports = function (babel) {
  const t = babel.types

  return {
    visitor: {
      CallExpression: function (path, state) {
        const node = path.node
        const callee = node.callee
        if (callee.name !== CMZ_NAME) { return }

        // get the filename and line number
        const filename = state.file.opts.filename
        const line = callee.loc.start.line
        const scopedName = generateScopedName(filename, line)

        // ignore if the atom has already been named
        if (node.arguments.length > 1) { return }

        // insert a better name
        node.arguments.unshift(t.stringLiteral(scopedName))
      }
    }
  }
}
