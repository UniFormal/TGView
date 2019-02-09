/**
 * @file
 *
 * This file contains configuration to run the demo locally.
 */
const path = require("path");
const HTMLPlugin = require("html-webpack-plugin");

module.exports = (_, {mode}) => {
  mode = mode || "development";
  
  return {
    entry: "./src/demo",
    mode: mode,
    devtool: mode === "development" ? "inline-source-map" : undefined,
    module: {
      rules: [
        // source maps from typescript work
        { test: /\.js$/, loader: "source-map-loader", enforce: "pre" },
  
        // load typescript outside of node_modules
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                compilerOptions: {
                  declaration: false,
                }
              }
            }
          ]
        },
        // load stylesheets -- only needed for development
        {
          test: /\.css$/,
          loader: ["style-loader", "css-loader"]
        },
  
        // load png images -- only needed for development
        {
          test: /\.(png|jpg|gif)$/,
          loader: "file-loader"
        }
      ]
    },
    resolve: {
      extensions: [".ts", ".js"]
    },
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, "dist"),
      devtoolModuleFilenameTemplate: mode === "development" ? "[absolute-resource-path]" : undefined,
    },
    optimization: {
      splitChunks: {
        chunks: "all"
      }
    },
    plugins: [new HTMLPlugin()]
  }
};
