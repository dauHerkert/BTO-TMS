const webpack = require('webpack');
var path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    entry: './app.js',
    output: {
        path: path.resolve(__dirname, ''),
        filename: 'bundle.js'
    },
    watch: true,
    watchOptions: {
        ignored: /node_modules/,
    },
    module: {
        rules: [
            {
                test: /\.scss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "sass-loader",
                ],
            },
            {
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ],
            },
        ]
    },    
    resolve: {
        modules: ['node_modules'],
        alias: {
            //slick: path.resolve(__dirname, 'node_modules/slick-carousel/slick'),
            //toastr: path.resolve(__dirname, 'node_modules/toastr')
        }
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "styles.css",
            chunkFilename: "[id].css",
        }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            toastr: 'toastr'
        })
    ],    
};