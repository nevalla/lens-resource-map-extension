/* eslint @typescript-eslint/no-var-requires: "off" */

const path = require("path");
const mode = process.env.NODE_ENV || "production"
module.exports = [
  {
    entry: "./renderer.tsx",
    context: __dirname,
    target: "electron-renderer",
    mode,
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.s?css$/,
          use: [
            "style-loader",
            "css-loader",
            "sass-loader",
          ]
        }
      ],
    },
    externals: [
      {
        "@k8slens/extensions": "var global.LensExtensions",
        "react": "var global.React",
        "mobx": "var global.Mobx",
        "mobx-react": "var global.MobxReact",
      }
    ],
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      libraryTarget: "commonjs2",
      globalObject: "this",
      filename: "renderer.js",
      path: path.resolve(__dirname, "dist"),
      chunkFilename: "chunks/[name].js",
    },
    node: {
      __dirname: false,
      __filename: false
    }
  },
];
