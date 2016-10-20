"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var redis = require('redis');
var bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

module.exports = function () {
    function StateMachine(options) {
        _classCallCheck(this, StateMachine);

        this.persist = redis.createClient(options);
    }

    // persistence accessor

    _createClass(StateMachine, [{
        key: "addToHash",
        value: function addToHash(key, field, value) {
            this.persist.hset(key, field, value);
        }
    }, {
        key: "getHash",
        value: function getHash(key) {
            return this.persist.hgetallAsync(key);
        }
    }, {
        key: "removeFromHash",
        value: function removeFromHash(key, field) {
            return this.persist.hdel(key, field);
        }
    }, {
        key: "addToSet",
        value: function addToSet(key, value) {
            this.persist.sadd(key, value);
        }
    }, {
        key: "getSet",
        value: function getSet(key) {
            return this.persist.smembersAsync(key);
        }
    }, {
        key: "removeFromSet",
        value: function removeFromSet(key, val) {
            this.persist.srem(key, val);
        }
    }, {
        key: "setState",
        value: function setState(key, value) {
            this.persist.set(key, value);
        }
    }, {
        key: "getState",
        value: function getState(key) {
            return this.persist.getAsync(key);
        }
    }, {
        key: "delState",
        value: function delState(key) {
            this.persist.del(key);
        }
    }, {
        key: "getPersistence",
        value: function getPersistence() {
            return this.persist;
        }
    }]);

    return StateMachine;
}();