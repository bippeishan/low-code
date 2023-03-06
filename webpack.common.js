// @ts-nocheck
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const yargs = require("yargs");

const devMode = process.env.NODE_ENV !== "production";
// const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const webpack = require("webpack");
const recursiveIssuer = require("./src/plugins/utils").recursiveIssuer;

const HappyPack = require("happypack");
const os = require("os");

const happyThreadPool = HappyPack.ThreadPool({
    size: os.cpus().length
});

const argv = yargs.argv;
const CONSOLE_VERSION = argv.CONSOLE_VERSION === "undefined" || !argv.CONSOLE_VERSION ? "2.3" : argv.CONSOLE_VERSION;

const styleEntry = {};

const styleCacheGroups = {};
Object.keys(styleEntry).forEach((entryKey) => {
    const groupName = entryKey + "Group";
    styleCacheGroups[entryKey] = {
        name: groupName,
        test: (m, c, entry = groupName) => m.constructor.name === "CssModule" && recursiveIssuer(m, c) === entry,
        chunks: "all",
        enforce: true
    };
});

const commonConfig = {
    entry: {
        ...styleEntry,
        app: "./src/index.tsx"
    },

    output: {
        path: path.resolve(__dirname, "build"), // webpack打包出来的文件
        publicPath: "/", // 影响index.html依赖的文件引用路径
        filename: devMode ? "bundle/[name].[hash:6].js" : "bundle/[name].[chunkhash:6].js", // 针对entry文件的命名
        chunkFilename: "module/[name].[contenthash:6].js" // 针对非chunk文件的命名
    },

    module: {
        rules: [
            {
                test: /\.(js|ts|tsx)?$/,
                exclude: /node_modules/,
                include: [path.resolve(__dirname, "src")],
                use: "happypack/loader?id=happyBabel"
            },
            {
                test: /\.css$/,
                include: [path.resolve(__dirname, "src")],
                use: [
                    {
                        loader: devMode ? "style-loader" : MiniCssExtractPlugin.loader
                    },
                    {
                        loader: "css-loader"
                    }
                ]
            },
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                include: [path.resolve(__dirname, "src")],
                use: [
                    {
                        loader: devMode ? "style-loader" : MiniCssExtractPlugin.loader
                    },
                    {
                        loader: "css-loader",
                        options: {
                            importLoaders: 1
                        }
                    },
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                plugins: [require("autoprefixer")]
                            }
                        }
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sassOptions: {
                                outputStyle: "compressed"
                            }
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpg|gif|ico)$/,
                include: [path.resolve(__dirname, "src")],
                use: [
                    {
                        loader: "url-loader",
                        options: {
                            limit: 8192,
                            name: "images/[hash:6].[ext]"
                        }
                    }
                ]
            },
            {
                test: /\.(woff|woff2|ttf|eot|svg)(\?\d+)?$/,
                include: [path.resolve(__dirname, "src")],
                use: [
                    {
                        loader: "url-loader",
                        options: {
                            limit: 10000,
                            name: "font/[hash:6].[ext]"
                        }
                    }
                ]
            },
            {
                test: /\.md$/,
                use: [
                    {
                        loader: "raw-loader"
                    }
                ]
            }
        ]
    },

    resolve: {
        alias: {
            "react-components": "@ucloud-fe/react-components",
            // "@": path.resolve(__dirname, "src/styles/images"),
            "@src": path.resolve(__dirname, "src"),
            moment: path.resolve(process.cwd(), "node_modules", "moment")
        },
        modules: ["src", "node_modules"],
        extensions: [".ts", ".tsx", ".js", ".json", ".css", ".scss"]
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                react: {
                    test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|react-redux|redux|connected-react-router|redux-observable)[\\/]/,
                    chunks: "initial",
                    name: "react",
                    filename: "bundle/[name].[contenthash:6].js",
                    priority: 14,
                    enforce: true
                },
                third_lib: {
                    test: /[\\/]node_modules[\\/](rxjs|history|axios)[\\/]/,
                    chunks: "initial",
                    name: "third_lib",
                    filename: "bundle/[name].[contenthash:6].js",
                    priority: 11,
                    enforce: true
                },
                ucloud_react: {
                    test: /[\\/]node_modules[\\/]@ucloud-fe\/react-components(.*)\.jsx?/,
                    chunks: "initial",
                    name: "ucloud_react",
                    filename: "bundle/[name].[contenthash:6].js",
                    priority: 10,
                    enforce: true,
                    reuseExistingChunk: true
                },
                form: {
                    test: /[\\/]node_modules[\\/](classnames|ip|formik|yup)[\\/]/,
                    chunks: "initial",
                    name: "form",
                    filename: "bundle/[name].[contenthash:6].js",
                    enforce: true,
                    priority: 8,
                    reuseExistingChunk: true
                },
                common: {
                    test: /[\\/]node_modules[\\/](moment|lodash)[\\/]/,
                    chunks: "initial",
                    name: "common",
                    filename: "bundle/[name].[contenthash:6].js",
                    enforce: true,
                    priority: 5,
                    reuseExistingChunk: true
                },
                vendor: {
                    test: /[\\/]node_modules(.*)\.js[\\/]/,
                    chunks: "initial",
                    name: "vendor",
                    filename: "bundle/[name].[contenthash:6].js",
                    enforce: true,
                    priority: -20,
                    reuseExistingChunk: true
                },
                async_commons: {
                    // 其余异步加载包
                    chunks: "async",
                    minChunks: 2,
                    name: "async_commons",
                    priority: 3
                },
                ...styleCacheGroups
            }
        }
    },

    plugins: [
        new HappyPack({
            id: "happyBabel",
            loaders: [
                {
                    loader: "cache-loader"
                },
                {
                    loader: "babel-loader",
                    options: {
                        cacheDirectory: true,
                        cacheCompression: false
                    }
                },
                {
                    loader: "ts-loader",
                    options: {
                        happyPackMode: true
                    }
                }
            ],
            threadPool: happyThreadPool,
            verbose: true
        }),

        new webpack.DefinePlugin({
            CONSOLE_VERSION: JSON.stringify(CONSOLE_VERSION)
        }),

        new HtmlWebpackPlugin({
            inject: "body",
            template: path.resolve(__dirname, "src/index.html"),
            favicon: path.resolve(__dirname, "src/favicon.ico"),
            hash: true,
            scriptLoading: "defer"
        }),

        new MiniCssExtractPlugin({
            filename: "[name].[hash:6].css",
            chunkFilename: "[id].[hash:6].css"
        }),

        // IgnorePlugin忽略所有locale，ContextReplacementPlugin可选择支持几种locale
        // new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /ja|it/),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)

        // new BundleAnalyzerPlugin({
        //     analyzerHost: "127.0.0.1",
        //     analyzerPort: "9001"
        // })
    ],
    stats: "minimal"
};

module.exports = {
    commonConfig: commonConfig,
    styleEntry: styleEntry
};
