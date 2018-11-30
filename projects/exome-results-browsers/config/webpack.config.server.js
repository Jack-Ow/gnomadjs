const path = require('path')

const pkg = require('../package.json')

if (process.env.BROWSER === undefined) {
  console.error('BROWSER environment variable must be set')
  process.exit(1)
}

const projectDirectory = path.resolve(__dirname, '..')

const isDev = process.env.NODE_ENV === 'development'

const config = {
  devtool: 'source-map',
  entry: {
    server: path.resolve(__dirname, '../src/server/server.js'),
  },
  externals(context, request, callback) {
    // Do not bundle dependencies
    return context.includes(projectDirectory) && request in pkg.dependencies
      ? callback(null, `commonjs ${request}`)
      : callback()
  },
  mode: isDev ? 'development' : 'production',
  node: false, // Do not replace Node builtins
  output: {
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/',
    filename: '[name].js',
  },
  resolve: {
    alias: {
      '@browser': path.resolve(__dirname, '../browsers', process.env.BROWSER, 'src'),
    },
  },
  target: 'node',
}

module.exports = config
