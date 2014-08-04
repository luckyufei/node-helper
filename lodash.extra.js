var _ = require("lodash");
_.str = require("underscore.string");
_.mixin(_.str.exports());

/**
 * 集合对象中是否包含多个keys
 * @param list
 * @param keys
 * @returns {*}
 */
_.containsKeys = function (list, keys) {
    var listKeys = _.isArray(list) ? list : _.keys(list);
    return _.every(keys, function (key) {
        return _.contains(listKeys, key);
    });
}

module.exports = _;