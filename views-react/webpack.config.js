const HtmlWebPackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const devMode = process.env.NODE_ENV !== 'production'

const commonConfig = (name) => ({
  devtool: 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/env', '@babel/react'],
            plugins: ['@babel/plugin-transform-runtime', '@babel/plugin-proposal-class-properties']
          }
        }
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: { minimize: true }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [devMode ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader']
      },
      {
        test: /\.scss$/,
        use: [devMode ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader']
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebPackPlugin({
      // change it in case you want to change entry point such that;
      // template: "./src_1/index.html",
      template: path.join(__dirname, `./src/${name}/index.html`),
      filename: './index.html'
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    })
  ]
})

const outputDir = path.join(__dirname, './dist/')

const loginConfig = Object.assign({}, commonConfig('login'), {
  name: 'login',
  entry: path.join(__dirname, '/src/login/index.js'),
  output: {
    path: path.join(outputDir, '/login'),
    filename: 'index.js'
  }
})

const appConfig = Object.assign({}, commonConfig('app'), {
  name: 'app',
  entry: path.join(__dirname, '/src/app/index.js'),
  output: {
    path: path.join(outputDir, '/app'),
    filename: 'index.js'
  }
})

module.exports = [ appConfig, loginConfig ]
