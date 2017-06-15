const CMZ_NAME = 'cmz'

const root = process.cwd()

function isRule (raw) {
  return raw.indexOf(':') > 0
}

function renderSrc (scopedName, value) {
  const isWrapped = value.indexOf('{') > -1
  if (isWrapped) {
    return value.replace(/&/g, '.' + scopedName)
  }

  return `
.${scopedName} {
  ${value}
}
`
}

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
      Program: {
        enter: function (path, state) {
          state.cmzSrc = ''
        },
        exit: function (path, state) {
          if (!state.opts.extract || !state.cmzSrc) { return }
          //path.addComment('trailing', 'cmz|' + state.cmzSrc + '|cmz')
        }
      },
      CallExpression: function (path, state) {
        const node = path.node
        const callee = node.callee
        if (callee.name !== CMZ_NAME) { return }

        // get the filename and line number
        const filename = state.file.opts.filename
        const line = callee.loc.start.line
        const scopedName = generateScopedName(relFilename(filename), line)

        // name unnamed atoms
        if (node.arguments.length < 2) {
          node.arguments.unshift(t.stringLiteral(scopedName))
        }

        // extract styles
        if (!state.opts.extract) { return }

        path.get('arguments').forEach(function (argPath, i) {
          // first argument is the name
          if (i === 0) { return }

          const arg = argPath.node
          switch (arg.type) {
          case 'StringLiteral':
            var value = arg.value
            if (isRule(value)) {
              // remove it
              argPath.addComment('leading', 'cmz|')
              argPath.addComment('trailing', '|cmz')
              state.cmzSrc += renderSrc(scopedName, value)
            }
            break

          case 'TemplateLiteral':
            // ignore templates with expressions
            if (arg.expressions.length) { return }

            var value = arg.quasis.map(q => q.value.cooked).join('')
            if (isRule(value)) {
              // remove it
              argPath.addComment('leading', 'cmz|')
              argPath.addComment('trailing', '|cmz')

              state.cmzSrc += renderSrc(scopedName, value)
            }
            break

          case 'ArrayExpression':
            argPath.get('elements').forEach(function (elPath, i) {
              const el = elPath.node
              switch (el.type) {
              case 'StringLiteral':
                var value = el.value
                if (isRule(value)) {
                  // remove it
                  elPath.addComment('leading', 'cmz|')
                  elPath.addComment('trailing', '|cmz')

                  state.cmzSrc += renderSrc(scopedName, value)
                }
                break

              case 'TemplateLiteral':
                // ignore templates with expressions
                if (el.expressions.length) { return }

                var value = el.quasis.map(q => q.value.cooked).join('')
                if (isRule(value)) {
                  // remove it
                  elPath.addComment('leading', 'cmz|')
                  elPath.addComment('trailing', '|cmz')

                  state.cmzSrc += renderSrc(scopedName, value)
                }
                break
              }
            })
          }
        })
      }
    }
  }
}
