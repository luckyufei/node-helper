/**
 * 读取指定开始位置和长度的文件字节
 * @param {string} srcFile - 文件绝对路径
 * @parma {number} begin - 开始位置
 * @param {number} length - 字节长度
 */
exports.readBytesAsync = exports.readFileSectionByLoopAsync = function (srcFile, begin, length) {
    return  eval(Wind.compile("async", function (srcFile, begin, length) {
        var fdIn = $await(fs.openAsync(srcFile, "r"));
        var stat = $await(fs.fstatAsync(fdIn));
        if (begin + length > stat.size) {
            length = stat.size - begin;
        }
        var buffer = new Buffer(length);
        try {
            $await(fs.readAsync(fdIn, buffer, 0, length, begin));
            return  buffer;
        } catch (e) {
            log.error(tag, "readFileSectionByLoopAsync: srcFile: ", srcFile, ",begin: "
                , begin, ", length: ", length, ", error: ", e);
        } finally {
            $await(fs.closeAsync(fdIn));
        }
    }))(srcFile, begin, length);
}

/**
 * 通过pump的方式拷贝文件
 *
 * @param srcFile
 * @param targetFile
 * @returns {*}
 */
exports.copyFileByPumpAsync = function (srcFile, targetFile) {
    return eval(Wind.compile("async", function (srcFile, targetFile) {
        var streamIn = fs.createReadStream(srcFile);
        var streamOut = fs.createWriteStream(targetFile);
        $await(util.pumpAsync(streamIn, streamOut));
    }))(srcFile, targetFile);
};

/**
 * 合并多个文件
 * @param targetFile
 * @param srcdir
 * @param [srcfiles]
 * @returns {*}
 */
exports.mergeFilesAsync = function (targetFile, srcdir, srcfiles) {
    var self = this;
    return eval(Wind.compile("async", function (targetFile, srcdir, srcfiles) {
        if (!srcfiles)
            srcfiles = $await(self.getSortFilesAsync(srcdir));
        if (srcfiles.length === 1) {
            $await(self.renameAsync(path.join(srcdir, srcfiles[0]), targetFile));
            return targetFile;
        }
        for (var i = 0; i < srcfiles.length; i++) {
            var fileName = srcfiles[i];
            $await(eval(Wind.compile("async", function (fileName) {
                var srcFile = srcdir + "/" + fileName;
                var data = $await(fs.readFileAsync(srcFile));
                $await(fs.appendFileAsync(targetFile, data));
            }))(fileName));
        }
        return targetFile;
    }))(targetFile, srcdir, srcfiles);
};

/**
 * 返回指定路径下排序过的文件
 * @param path
 * @param {function} [sortFunc] 排序函数
 * @returns {*}
 */
exports.getSortFilesAsync = function (path, sortFunc) {
    var self = this;
    return eval(Wind.compile("async", function (path, sortFunc) {
        var exists = $await(self.existsAsync(path));
        if (!exists) {
            $await(self.mkdirpAsync(path));
            return [];
        }
        var files = $await(self.readdirAsync(path));
        files.sort(sortFunc || function (a, b) {
            return parseInt(a) > parseInt(b) ? 1 : -1;
        });
        return files;
    }))(path, sortFunc);
}


/**
 * 将指定文件按照指定大小(blockSize)拆分成块
 * @param srcFile 源文件
 * @param targetDir 目标目录
 * @param blockSize 块大小
 * @returns {*}
 */
exports.splitFileAsync = function (srcFile, targetDir, blockSize) {
    var self = this;
    return eval(Wind.compile("async", function (srcFile, targetDir, blockSize) {
            var offset = 0;
            var data = $await(self.readFileAsync(srcFile));
            var blockCount = Math.ceil(data.length / blockSize);
            for (var i = 1; i <= blockCount; i++) {
                $await(self.appendFileAsync(targetDir + "/" + i, data.slice(offset, offset + blockSize)));
                offset += blockSize;
            }
        }
    ))(srcFile, targetDir, blockSize);
}

/**
 * TODO 递归浏览目录下的所有的文件
 * @param start
 * @returns {*}
 */
exports.walkAsync = function (start) {
    return eval(Wind.compile("async", function () {
        var stat = $await(self.lstat(start));
        if (!stat.isDirectory()) {
            throw new Error("path: " + start + " is not a directory");
        }

        var files = $await(self.readdirAsync(start));
        var coll = files.reduce(function (acc, i) {
            var abspath = path.join(start, i);

            if (fs.statSync(abspath).isDirectory()) {
                exports.walk(abspath, callback);
                acc.dirs.push(abspath);
            } else {
                acc.names.push(abspath);
            }

            return acc;
        }, {"names": [], "dirs": []});
        return files;
    }))();
};

/**
 * 获取正确解码的文本文件内容
 * @param srcfile
 * @returns {Buffer} utf-8编码的buffer
 */
exports.decodeTextFileAsync = function (srcfile) {
    var self = this;
    return eval(Wind.compile("async", function (srcfile) {
        var data = $await(self.readFileAsync(srcfile));
        return self.decodeTextBuff(data);
    }))(srcfile);
}

exports.ensureFolderEmptyAsync = function (folder) {
    var self = this;
    return eval(Wind.compile("async", function (folder) {
        var exists = $await(self.existsAsync(folder));
        if (!exists) {
            $await(self.mkdirpAsync(folder));
            return folder;
        }

        $await(self.rmdirpAsync(folder));
        $await(self.mkdirAsync(folder));
        return folder;
    }))(folder);
}

exports.zipFolderAsync = function (srcdir, zipfile) {
    var self = this;
    return eval(Wind.compile("async", function (srcdir, zipfile) {
        var cmd = (platform === 'win32' ? "7z" : "7za") + " a -tzip " + zipfile + " " + srcdir;
        var result = $await(self.execAsync(cmd, {
            timeout: 59000,
            maxBuffer: 40 * 1024 * 1024
        }));
        return result;
    }))(srcdir, zipfile);
}

