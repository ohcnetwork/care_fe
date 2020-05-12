const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

let googleKey = '6LdvxuQUAAAAADDWVflgBqyHGfq-xmvNJaToM0pN';

module.exports = (env, argv) => {
    const mode = argv.mode || 'development';
    const isDev = mode !== 'production';
    const app =['./src/index.tsx'];
    if (isDev) {
        app.push('webpack-dev-server/client');
        googleKey = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
    }
    return ({
        entry: {
            vendor: ['react', 'react-dom'],
            app
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: isDev ? 'js/bundle.[hash].js' : 'js/bundle.prod.[hash].js',
            chunkFilename: '[name].[chunkhash].chunk.js',
            publicPath: '/',
        },
        devtool: isDev ? 'source-map' : 'none',
        mode,
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
                    target: 'https://careapi.coronasafe.in/',
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
            new webpack.DefinePlugin({
                "process.env.GOOGLE_KEY": JSON.stringify(googleKey)
            }),
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, 'src', 'index.html')
            }),
            new webpack.HotModuleReplacementPlugin(),
            new MiniCssExtractPlugin({
                filename: isDev ? 'css/[name][hash].bundle.css' : 'css/[name][hash].prod.bundle.css',
            }),
        ],
    })
   

};

