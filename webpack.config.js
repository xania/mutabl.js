const fspath = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = () => ({
  target: 'web',
  mode: 'production',
  entry: {
    index: './lib/index.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              esModule: true,
              name: '[path][name].css',
            },
          },
          { loader: 'extract-loader' },
          // { loader: "style-loader" },
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              // you can specify a publicPath here
              // by default it uses publicPath in webpackOptions.output
              publicPath: './',
              // esModule: true,
              // hmr: true,
            },
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [['autoprefixer']],
              },
            },
          },
          {
            loader: 'sass-loader',
            options: {
              // Prefer Dart Sass
              implementation: require('sass'),
              sassOptions: {
                includePaths: ['./node_modules'],
              },
            },
          },
        ],
      },
      {
        test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]',
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.scss', '.css'],
  },
  output: {
    path: fspath.resolve(__dirname, './dist'),
    filename: 'mutable.js',
    library: 'Mutable',
    libraryTarget: 'umd',
    globalObject: 'this',
    umdNamedDefine: true,
  },
});
