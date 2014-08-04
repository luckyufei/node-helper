var _tag = "[helper]-[http]",
    request = require("request"),
    http = require("http"),
    Q = require("q"),
    fs = require("fs");

exports.post = function (url, json, headers) {
    var defer = Q.defer();
    request.post({
        url: url,
        headers: headers || {},
        json: json || {}
    }, function (err, res, body) {
        err ? defer.reject(err) : defer.resolve(body);
    });
    return defer.promise;
}

/**
 * 文件下载接口, 使用了stream
 * @param url
 * @param target
 * @returns {*}
 */
exports.pipeFile = function (url, target) {
    var defer = Q.defer();

    var _writable = target.indexOf("http:") === -1 ? fs.createWriteStream(target)
        : request.put(target);

    var writable = request(url).pipe(_writable);
    writable.on("finish", function () {
        defer.resolve(target);
    });
    writable.on("error", function (err) {
        defer.reject(err);
    });
    return defer.promise;
}

/**
 * 使用nodejs原生的http api进行文件下载
 * 1. 进度提示, 只需监听httpGet'progress'事件, 有一个参数是number类型的参数.
 * 2. 判断是否中止, 只需监听httpGet的end事件, 此时文件写入流也已经关闭
 *
 * @param httpGet http get 请求对象
 * @param destfile 写入的目标文件
 */
exports.downloadByNode = function (httpGet, destfile) {
    var defer = Q.defer(),
        length = 0 ,
        writeStream = fs.createWriteStream(destfile);

    writeStream.on("close", function () {
        httpGet.emit("end");
        defer.resolve(true);
    });

    httpGet.on('response', function (response) {
        var total = response.headers['content-length'];
        response.on('data', function (chunk) {
            writeStream.write(chunk, 'binary');
            length += chunk.length;
            var percent = parseInt(length * 100 / total);
            httpGet.emit('progress', percent > 100 ? 100 : percent, length);
        });
        response.on('end', function () {
            writeStream.end();
        });
    });

    httpGet.on("error", function (err) {
        defer.reject(err);
    });

    return defer.promise;
}

