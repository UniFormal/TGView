const path = require('path');
const HTMLPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './entry.ts',
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      // source maps from typescript work
      { test: /\.js$/, loader: 'source-map-loader', enforce: 'pre' },
      // load typescript outside of node_modules
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      // load stylesheets -- only needed for development
      {
        test: /\.css$/, loader: ['style-loader', 'css-loader']
      }, 

      // load png images -- only needed for development 
      {
        test: /\.(png|jpg|gif)$/,
        loader: 'url-loader'
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    // library: 'tgview',
   // libraryTarget: 'umd',
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    devtoolModuleFilenameTemplate: '[absolute-resource-path]'
  },
  plugins: [
    new HTMLPlugin()
  ]
};
