'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var redis = require('redis');
var bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

module.exports = function () {
    function Store(options) {
        _classCallCheck(this, Store);

        if (options.url) {
            options.url = 'redis://' + options.url;
        }
        this.client = redis.createClient(options);
    }

    _createClass(Store, [{
        key: 'addToHash',
        value: function addToHash(key, field, value) {
            return this.client.hsetAsync(key, field, value);
        }
    }, {
        key: 'getHash',
        value: function getHash(key) {
            return this.client.hgetallAsync(key).then(function (r) {
                if (r == null) return {};
            });
        }
    }, {
        key: 'removeFromHash',
        value: function removeFromHash(key, field) {
            return this.client.hdelAsync(key, field);
        }
    }, {
        key: 'addToSet',
        value: function addToSet(key, value) {
            return this.client.saddAsync(key, value);
        }
    }, {
        key: 'getSet',
        value: function getSet(key) {
            return this.client.smembersAsync(key);
        }
    }, {
        key: 'removeFromSet',
        value: function removeFromSet(key, val) {
            return this.client.sremAsync(key, val);
        }
    }, {
        key: 'setState',
        value: function setState(key, value) {
            return this.client.setAsync(key, value);
        }
    }, {
        key: 'getState',
        value: function getState(key) {
            return this.client.getAsync(key);
        }
    }, {
        key: 'delState',
        value: function delState(key) {
            return this.client.delAsync(key);
        }
    }, {
        key: 'getRedisClient',
        value: function getRedisClient() {
            return this.client;
        }
    }]);

    return Store;
}();