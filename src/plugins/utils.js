const fs = require("fs");
const path = require("path");

function collectFiles(filePath, results, fileFilter, dirFilter) {
    const files = fs.readdirSync(filePath);

    files.forEach((filename) => {
        const filedir = path.posix.join(filePath, filename);
        // 给定文件路径的文件信息
        const stats = fs.statSync(filedir);
        const isFile = stats.isFile();
        const isDir = stats.isDirectory();
        if (isFile) {
            if (fileFilter && typeof fileFilter === "function") {
                const filterResult = fileFilter(filedir, filename);
                if (filterResult) {
                    results.push({
                        path: filedir,
                        isInner: filterResult === "inner",
                        fileName: filename
                    });
                }
            } else {
                results.push({
                    path: filedir,
                    inInner: false,
                    fileName: filename
                });
            }
        }
        let digIn = true;
        if (dirFilter && typeof dirFilter === "function") {
            if (!dirFilter(filedir)) {
                digIn = false; // 当前文件夹不需要递归
            }
        }
        if (isDir && digIn) {
            // 递归文件夹
            collectFiles(filedir, results, fileFilter, dirFilter);
        }
    });
}

function ensureFileSync(file) {
    if (!fs.existsSync(file)) {
        fs.mkdirSync(file);
    }
}

function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function recursiveIssuer(m, c) {
    if (m.issuer) {
        return recursiveIssuer(m.issuer);
    } else if (m.name) {
        return m.name;
    }
    return false;
}

const deleteAssets = (assetKeys, stats, compilation) => {
    assetKeys.forEach((key) => {
        const outputByKeys = stats.assetsByChunkName[key];
        if (outputByKeys) {
            const pattern = new RegExp(`^bundle/${key}(.*).(js)`);
            if (Array.isArray(outputByKeys)) {
                outputByKeys.forEach((fileName) => {
                    if (pattern.test(fileName) && compilation.assets[fileName]) {
                        delete compilation.assets[fileName];
                    }
                });
            } else if (typeof outputByKeys === "string") {
                if (pattern.test(outputByKeys) && compilation.assets[outputByKeys]) {
                    delete compilation.assets[outputByKeys];
                }
            }
        }
    });
};

module.exports = {
    collectFiles,
    ensureFileSync,
    randomNum,
    recursiveIssuer,
    deleteAssets
};
