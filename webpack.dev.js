const webpack = require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.common.js").commonConfig;

const apiHost = "localhost:3000";
const protocol = "http";

module.exports = merge(common, {
    mode: "development",
    devtool: "eval",
    devServer: {
        historyApiFallback: true,
        hot: true,
        disableHostCheck: true,
        compress: true,
        // host: "127.0.0.1",
        port: "8080",
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        watchContentBase: false,
        liveReload: false,
        transportMode: "ws",
        injectClient: false,
        proxy: {
            "/api": {
                target: protocol + "://" + apiHost,
                changeOrigin: true,
                cookieDomainRewrite: "localhost",
                headers: {
                    Host: apiHost,
                    Origin: protocol + "://" + apiHost,
                    Referer: protocol + "://" + apiHost + "/"
                }
            }
        }
    },
    plugins: [new webpack.HotModuleReplacementPlugin(), new webpack.NamedModulesPlugin()]
});
