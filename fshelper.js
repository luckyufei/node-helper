var tag = "[fshelper]-",
    fs = require("fs"),
    http = require("http"),
    Q = require("q"),
    _ = require("./lodash.extra"),
    path = require("path"),
    mkdirp = require("mkdirp"),
    crypto = require('crypto'),
    rimraf = require("rimraf"),
    ncp = require("ncp").ncp,
    exec = require('child_process').exec,
    platform = require('os').platform(),
    sevenZipCmd = (platform === 'win32' ? "7z" : "7za");

exports.readFile = Q.denodeify(fs.readFile);
exports.exists = function (filename) {
    var defer = Q.defer();
    fs.exists(filename, function (flag) {
        flag ? defer.resolve() : defer.reject();
    });
    return defer.promise;
};
exports.appendFile = Q.denodeify(fs.appendFile);
exports.rmdir = Q.denodeify(fs.rmdir);
exports.rmdirp = Q.denodeify(rimraf);
/**
 * 打开文件句柄
 */
exports.open = Q.denodeify(fs.open);
/**
 * 递归拷贝文件和文件夹
 * @param src
 * @param dest
 */
exports.ncp = Q.denodeify(ncp);

/**
 * 删除文件
 * @param file
 */
exports.unlink = Q.denodeify(fs.unlink);

exports.writeFile = Q.denodeify(fs.writeFile);

/**
 * 递归创建目录. 如果没有制定mode, 则赋予'0777'
 */
exports.mkdirp = Q.denodeify(mkdirp);

/**
 * 递归删除多个文件/目录
 * @param {array} srcdirs
 */
exports.rmdirps = function (srcdirs) {
    var self = this ,
        defer = Q.defer();
    Q.spread(_.map(srcdirs, function (srcdir) {
        return self.rmdirp(srcdir);
    }), defer.resolve).fail(defer.reject);
    return defer.promise;
}


/**
 * 最快速的文件拷贝方式. 如果targetfile不存在则创建
 * @param srcFile
 * @param targetFile
 * @returns {*}
 */
exports.pipeFile = function (srcFile, targetFile) {
    var defer = Q.defer();
    var streamIn = fs.createReadStream(srcFile);
    var streamOut = fs.createWriteStream(targetFile, {flags: 'w+'});
    streamIn.pipe(streamOut);

    streamIn.on("error", defer.reject);
    streamOut.on("error", defer.reject);
    streamOut.on("close", defer.resolve);
    return defer.promise;
}


/**
 * 计算文件的md5
 * @param path
 * @returns {*}
 */
exports.filemd5 = function (path) {
    var defer = Q.defer(),
        md5 = crypto.createHash("md5"),
        stream = fs.ReadStream(path);

    stream.on("data", function (data) {
        md5.update(data);
    })
    stream.on('end', function () {
        defer.resolve(md5.digest("hex"));
    });
    stream.on('error', defer.reject)
    return defer.promise;
}

/**
 *递归创建多个目录
 * @param {array} paths
 */
exports.mkdirps = function (paths) {
    var self = this,
        defer = Q.defer();

    Q.spread(_.map(paths, function (path) {
        return self.mkdirp(path);
    })).then(defer.resolve).fail(defer.reject);

    return defer.promise;
}

/**
 * 通过7zip解压文件
 */
exports.unzip = function (zipFile, destDir) {
    return this.exec(sevenZipCmd + " x " + zipFile + " -o" + destDir);
}

exports.zipFolder = function (srcdir, zipfile) {
    return this.exec(sevenZipCmd + " a -tzip " + zipfile + " " + srcdir);
}

exports.exec = function (cmd) {
    var defer = Q.defer();

    exec(cmd, {
        timeout: 59000,
        maxBuffer: 40 * 1024 * 1024
    }, function (err, stdout, stderr) {
        err ? defer.reject(err) : defer.resolve(stdout);
    });

    return defer.promise;
}


