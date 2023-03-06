const fs = require("fs-extra");
const path = require("path");

const deleteAssets = require("./utils").deleteAssets;

const pluginInfo = { name: "ThemesGeneratorPlugin" };

/**
 * options:
 * styleEntry
 * buildDir  // 内部变量
 */
class ThemesGeneratorPlugin {
    constructor(options) {
        this.options = options;
    }

    apply(compiler) {
        // 记录webpack配置的outputPath
        this.options.buildDir = compiler.options.output.path;
        
        const onEmit = (compilation, callback) => {
            const { styleEntry } = this.options;
            const stats = compilation.getStats().toJson();
            
            // 打包第三方css多出的js文件
            deleteAssets(Object.keys(styleEntry), stats, compilation);

            if (callback && typeof callback === "function") {
                callback();
            }
        };
        const onDone = () => {
            // 删除index.html中多插入的第三方样式的js文件
            const htmlPath = path.resolve(this.options.buildDir, "index.html");
            if (fs.existsSync(htmlPath)) {
                let fileContent = fs.readFileSync(htmlPath).toString();
                const { styleEntry = {} } = this.options;
                Object.keys(styleEntry).map((info) => {
                    const styleEntryPattern = new RegExp(
                        `<script .*src="${compiler.options.output.publicPath}bundle/${info}\\.[a-z0-9]+\\.js\\?[a-z0-9]+"></script>`
                    );
                    fileContent = fileContent.replace(styleEntryPattern, "");
                });
                fs.writeFileSync(htmlPath, fileContent);
            }
        };
        compiler.hooks.emit.tapAsync(pluginInfo, onEmit);
        compiler.hooks.done.tap(pluginInfo, onDone);
    }
}

module.exports = ThemesGeneratorPlugin;
