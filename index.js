const CMZ_NAME = 'cmz'

const root = process.cwd()

function relFilename (filename) {
  return filename.indexOf(root) === 0
    ? filename.substr(root.length + 1)
    : filename
}

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
        const scopedName = generateScopedName(relFilename(filename), line)

        // ignore if the atom has already been named
        if (node.arguments.length > 1) { return }

        // insert a better name
        node.arguments.unshift(t.stringLiteral(scopedName))
      }
    }
  }
}
