"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Display = require('./display');

module.exports = function () {
    function DisplayContext(name, io) {
        var _this = this;

        _classCallCheck(this, DisplayContext);

        this.io = io;
        this.name = name;
        this.io.getStore().addToSet("appcontexts", name);
        this.io.getStore().getHash("display.screens").then(function (m) {
            Array.from(m).forEach(function (x) {
                var d = new Display(io, x);
                d.setAppContext(name).then(function (res) {});
                _this.displays.set(x, d);
            });
        });
    }

    _createClass(DisplayContext, [{
        key: "getDisplays",
        value: function getDisplays() {
            return this.displays;
        }

        /*
             {
                displayName : {
                   template : template (string - relative path to the template file)
                }
             }
         */

    }, {
        key: "initialize",
        value: function initialize(template, screenName) {}
    }, {
        key: "show",
        value: function show() {}
    }, {
        key: "hide",
        value: function hide() {}
    }, {
        key: "close",
        value: function close() {}
    }, {
        key: "getDisplays",
        value: function getDisplays() {
            return this.displays;
        }
    }, {
        key: "setTemplate",
        value: function setTemplate(template, screenName) {}
    }, {
        key: "getViewObjectById",
        value: function getViewObjectById() {}
    }, {
        key: "getViewObjectsByScreenName",
        value: function getViewObjectsByScreenName() {}
    }, {
        key: "getViewObjects",
        value: function getViewObjects() {}
    }, {
        key: "createViewObject",
        value: function createViewObject(screenName, options) {}
    }]);

    return DisplayContext;
}();