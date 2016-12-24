/**
 * Created by Igor on 19.10.2016.
 */
const NODE_ENV = process.env.NODE_ENV || 'development';
const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const autoprefixer = require('autoprefixer');

module.exports = {
    context: __dirname,
    entry: {
        "js/islider": "./src/islider.js"
        ,"css/islider": "./src/style.css"
    },
    library: "./home",
    output: {
        path: __dirname + '/examples', /* For production */
        //path: __dirname + '/_loc', /* For local tests */
        //path: '../wp-test/wp-content/themes/twentysixteen', /* Local Wordpress test */

        publicPath: "/",
        filename: "[name].js"
    },

    //watch: NODE_ENV == 'development',

    watchOptions: {
        aggregateTimeout: 100
    },

    devTool: NODE_ENV == 'development' ? "cheap-inline-module-source-map" : null,

    module: {
        loaders: [
           {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract("style", "css!postcss-loader")
           }, {
                test: /\.(png|jpg)$/,
                loader: "file?name=[path][name].[ext]"
            }
        ]
    },

    externals: { jquery: "jQuery" },

    postcss: [ autoprefixer ],

    plugins: [
        new webpack.DefinePlugin({
            NODE_ENV:   JSON.stringify(NODE_ENV),
            LANG:       JSON.stringify("ru")
        }),
        new ExtractTextPlugin("[name].css")
    ],

    resolve: {
        modulesDirectories: ["node_modules"],
        extensions: ["", ".js"]
    },

    resolveLoader: {
        modulesDirectories: ["node_modules"],
        moduleTemplates: ["*-loader", "*"],
        extensions: ["", ".js"]
    },

    devServer: {
        host: 'localhost',
        port: 3000,
        inline: true,
        contentBase: __dirname + '/examples' /* Пусть с которого раздается статика */
        //contentBase: __dirname + '/_loc' /* Пусть с которого раздается статика */
    }
};


if(NODE_ENV == "production")
{
    module.exports.plugins.push(
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
                drop_console: true,
                unsafe: true
            }
        })
    );
}