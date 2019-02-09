/**
 * @file
 *
 * This file contains configuration to run the demo locally.
 */
const path = require("path");
const HTMLPlugin = require("html-webpack-plugin");
//const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = (_, argv) => {
  const mode = (argv || {}).mode || "development";

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
              loader: "ts-loader",
              options: {
                compilerOptions: {
                  declaration: false
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
      filename: "[name].bundle.js",
      path: path.resolve(__dirname, "dist"),
      devtoolModuleFilenameTemplate:
        mode === "development" ? "[absolute-resource-path]" : undefined
    },
    optimization: {
      splitChunks: {
        chunks: "all",
        minChunks: 1,

        cacheGroups: {
          // all other modules: enforce a module based on the folder
          nodeModules: {
            test: /\/node_modules\//,
            enforce: true,
            priority: -10,
            name: function(mod) {
              if (!mod.resource) return;
              const modName = mod.resource.match(/\/node_modules\/([^\/]*)/);
              return `modules-${modName[1]}`;
            }
          },
        }
      }
    },
    plugins: [new HTMLPlugin({title: 'TGView'})]
  };
};
