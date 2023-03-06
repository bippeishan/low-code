// @ts-nocheck
const child_process = require("child_process");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const filename = "version.html";

class VersionPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        const buildInfo = this.getBuildInfo();
        compiler.hooks.compilation.tap(this.constructor.name, (compilation) => {
            if (compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing) {
                compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tapAsync(
                    this.constructor.name,
                    (htmlData, cb) => {
                        // html文件注入git提交信息
                        htmlData.html = htmlData.html.replace(
                            /<body(.*)<\/body>/gi,
                            `<body$1<script type="text/javascript">console.log(${buildInfo.repo},${buildInfo.commit},${buildInfo.commitMsg})</script></body>`
                        );
                        cb(null, htmlData);
                        // return htmlData;
                    }
                );
            } else if (HtmlWebpackPlugin.getHooks) {
                HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(this.constructor.name, (pluginData, cb) => {
                    // html文件注入git提交信息
                    if (pluginData.outputName === "index.html") {
                        pluginData.html = pluginData.html.replace(
                            /<body(.*)<\/body>/gi,
                            `<body$1<script type="text/javascript">console.log("${buildInfo.repo}","${buildInfo.commit}","${buildInfo.commitMsg}")</script></body>`
                        );
                    }

                    cb(null, pluginData);
                });
            }
        });

        // 加入HtmlWebpackPlugin plugin
        compiler.options.plugins.push(
            new HtmlWebpackPlugin({
                templateContent: ({ htmlWebpackPlugin }) => {
                    return `<!DOCTYPE html>
                    <html>
                        <head>
                            <meta charset="utf-8" />
                            <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1,IE=11,IE=10" />
                            <meta
                                name="viewport"
                                content="width=device-width, initial-scale=1.0, minimum-scale=0.5, maximum-scale=2.0, user-scalable=yes"
                            />
                            <title>${htmlWebpackPlugin.options.buildInfo.repo}版本</title>
                        </head>
                        <body>
                            <p>commitID: ${htmlWebpackPlugin.options.buildInfo.commit}</p>
                            <p>commitMsg: ${htmlWebpackPlugin.options.buildInfo.commitMsg}</p>
                            <p>repo: ${htmlWebpackPlugin.options.buildInfo.repo}</p>
                            <p>commitUserName: ${htmlWebpackPlugin.options.buildInfo.commitUserName}</p>
                            <p>commitDate: ${htmlWebpackPlugin.options.buildInfo.commitDate}</p>
                            <p>buildDate: ${htmlWebpackPlugin.options.buildInfo.buildDate}</p>
                        </body>
                    </html>`;
                },
                filename,
                inject: false,
                minify: {
                    removeComments: false,
                    collapseWhitespace: true,
                    removeAttributeQuotes: false
                },
                __ustack_inner_plugin: true,
                buildInfo
            })
        );
    }
    getBuildInfo() {
        const cmdOption = {};
        const nowDate = new Date();
        try {
            const commitDateObj = new Date(child_process.execSync(`git show -s --format=%cd`, cmdOption).toString());
            return {
                commit: child_process.execSync("git show -s --format=%H", cmdOption).toString().trim(),
                repo: child_process.execSync("basename `git rev-parse --show-toplevel`", cmdOption).toString().trim(),
                commitMsg: child_process.execSync("git show -s --format=%s", cmdOption).toString().trim(),
                commitUserName: child_process.execSync("git show -s --format=%cn", cmdOption).toString().trim(),
                commitUserMail: child_process.execSync("git show -s --format=%ce", cmdOption).toString().trim(),
                commitDateObj,
                commitDate: `${
                    commitDateObj.getFullYear() +
                    "-" +
                    (commitDateObj.getMonth() + 1) +
                    "-" +
                    commitDateObj.getDate() +
                    " " +
                    commitDateObj.getHours() +
                    ":" +
                    commitDateObj.getMinutes()
                }`,
                buildDate: `${
                    nowDate.getFullYear() +
                    "-" +
                    (nowDate.getMonth() + 1) +
                    "-" +
                    nowDate.getDate() +
                    " " +
                    nowDate.getHours() +
                    ":" +
                    nowDate.getMinutes()
                }`
            };
        } catch (e) {
            process.exit(1);
        }
    }
}

module.exports = VersionPlugin;
