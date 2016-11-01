'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('whatwg-fetch');
var redis = require('webdismay');

module.exports = function () {
    function Store(options) {
        _classCallCheck(this, Store);

        var params = {
            endPoint: 'http://' + options.url + ':7379/'
        };
        if (options.username && options.password) {
            params.headers = {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: "Basic " + btoa(options.username + ':' + options.password)
            };
            params.putHeaders = {
                'Accept': 'application/json',
                'Content-Type': 'application/octet-stream',
                Authorization: "Basic " + btoa(options.username + ':' + options.password)
            };
        }
        redis.configure(params);
        this.client = redis;
    }

    _createClass(Store, [{
        key: 'addToHash',
        value: function addToHash(key, field, value) {
            return new this.client.Hash(key).setnx(field, value);
        }
    }, {
        key: 'getHash',
        value: function getHash(key) {
            return new this.client.Hash(key).getAll();
        }
    }, {
        key: 'removeFromHash',
        value: function removeFromHash(key, field) {
            return new this.client.Hash(key).del(field);
        }
    }, {
        key: 'addToSet',
        value: function addToSet(key, value) {
            return new this.client.Rset(key).add(value);
        }
    }, {
        key: 'getSet',
        value: function getSet(key) {
            return new this.client.Rset(key).getAll();
        }
    }, {
        key: 'removeFromSet',
        value: function removeFromSet(key, val) {
            return new this.client.Rset(key).remove(val);
        }
    }, {
        key: 'setState',
        value: function setState(key, value) {
            return new this.client.Key(key).set(value);
        }
    }, {
        key: 'getState',
        value: function getState(key) {
            return new this.client.Key(key).get();
        }
    }, {
        key: 'delState',
        value: function delState(key) {
            return new this.client.Key(key).del();
        }
    }, {
        key: 'getRedisClient',
        value: function getRedisClient() {
            return this.client;
        }
    }]);

    return Store;
}();