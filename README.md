# babel-plugin-cmz-names

Babel plugin to give [`cmz`](https://github.com/joshwnj/cmz) nice readable classnames.

To activate, first install in your project:

```
npm install --save-dev babel-plugin-cmz-names
```

And then this to your `.babelrc`:

```json
{
  "plugins": ["cmz-names"]
}
```

## Customising the name

By default, classnames are generated using the path to the module, and the line number. This makes it easy to find exactly where a style was declared.

For example, if you see `src_components_MyComponent-15` you will look on line 15 of `src/components/MyComponent.js`.

Sometimes you want a bit more control over this naming, like if you're building a style library for distribution.

An easy way to do this is by configuring the plugin with 1 or more string-replacements. In `.babelrc` it looks like this:

```json
{
  "plugins": ["cmz-names", {
    replace: [
      ["src_components", "MyLib"]
    ]
  }]
}
```

This means the classname from before will be rendered as `MyLib_MyComponent-15`.
