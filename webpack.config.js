const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'bundle.js'
    },
    plugins: [
        new HtmlWebpackPlugin({template: './index.html'}),
        new webpack.ProvidePlugin({
            THREE: 'three'
        }),
        new CopyWebpackPlugin([
            './assets/**'
        ])
    ]
};