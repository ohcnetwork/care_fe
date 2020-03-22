const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');


const app =['./src/index.tsx'];
if (process.env.NODE_ENV !== 'production') {
    app.push('webpack-dev-server/client');

}
module.exports = {
    entry: {
        vendor: ['react', 'react-dom'],
        app
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].bundle.js',
        publicPath: '/',
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    },
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        host: "0.0.0.0",
        port: 4000,
        proxy: {
            '/api': {
                target: 'https://dev.care.coronasafe.in/',
                changeOrigin: true,
            }
        },
        historyApiFallback: true
    },
    module: {
        rules: [{
            test: /\.(ts|tsx)$/,
            loader: 'ts-loader',
        },
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: 'source-map-loader'
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader',
                ]
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [{
                    loader: 'file-loader'
                }]
            }
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'src', 'index.html')
        }),
        new webpack.HotModuleReplacementPlugin(),
        new MiniCssExtractPlugin({
            filename: 'css/[name].bundle.css',
        }),
    ],

};
