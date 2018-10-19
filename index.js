const CMZ_NAME = 'cmz'

const root = slash(process.cwd())

function slash (input) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(input)
  const hasNonAscii = /[^\u0000-\u0080]+/.test(input)

  if (isExtendedLengthPath || hasNonAscii) {
    return input
  }

  return input.replace(/\\/g, '/')
}

function isRule (raw) {
  return raw.indexOf(':') > 0
}

function relFilename (filename) {
  return filename.indexOf(root) === 0
    ? filename.substr(root.length + 1)
    : filename
}

function generateScopedName (filename, line, replace) {
  var name = filename
    .replace(/\.js$/, '')
    .replace(/\W+/g, '_') + '-' + line

  replace.forEach(function (parts) {
    name = name.replace(parts[0], parts[1])
  })

  return name
}

// add comment wrappers to indicate that a css rule is extractable
function wrapExtractable (path) {
  path.addComment('leading', 'cmz|')
  path.addComment('trailing', '|cmz')
}

// visit an argument of a `cmz()` call
// and add comment wrappers if it's an extractable rule
function wrapCmzArg (path) {
  const node = path.node
  switch (node.type) {
    case 'StringLiteral':
      if (isRule(node.value)) {
        wrapExtractable(path)
      }
      break

    case 'TemplateLiteral':
    // ignore templates with expressions
      if (node.expressions.length) { return }

      const value = node.quasis.map(q => q.value.cooked).join('')
      if (isRule(value)) {
        wrapExtractable(path)
      }
      break

    case 'ArrayExpression':
      path.get('elements').forEach(wrapCmzArg)
      break
  }
}

module.exports = function (babel) {
  const t = babel.types

  return {
    visitor: {
      CallExpression: function (path, state) {
        const node = path.node
        const callee = node.callee
        if (callee.name !== CMZ_NAME) { return }

        const opts = state.opts || {}

        // get the filename and line number
        const filename = state.file.opts.filename
        const line = callee.loc.start.line
        const scopedName = generateScopedName(relFilename(filename), line, opts.replace || [])

        // name unnamed atoms

        node.arguments.unshift(t.stringLiteral(scopedName))

        path.get('arguments').forEach(function (argPath, i) {
          // first argument is the name
          if (i === 0) { return }

          wrapCmzArg(argPath)
        })

        // switch to `cmz.named`
        callee.name += '.named'
      }
    }
  }
}
