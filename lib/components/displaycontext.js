'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DisplayWindow = require('./displaywindow');
var ViewObject = require('./viewobject');

module.exports = function () {
    function DisplayContext(name, options, io) {
        var _this = this;

        _classCallCheck(this, DisplayContext);

        this.io = io;
        this.name = name;
        this.displayWindows = new Map();
        this.viewObjects = new Map();
        this.io.getStore().addSet("displayContexts", name);
        this.restoreFromStore(options);

        this.eventHandlers = new Map();
        this.io.onTopic("display.removed", function (m) {

            //clean up objects
            var closedScreen = m.toString();
            var closedWindowObjId = _this.displayWindows.get(closedScreen);
            _this.displayWindows.delete(closedScreen);
            var toRemove = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _this.viewObjects[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _step$value = _slicedToArray(_step.value, 2);

                    var _k2 = _step$value[0];
                    var v = _step$value[1];

                    if (v.screenName == closedScreen) toRemove.push(_k2);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            for (var k = 0; k < toRemove.length; k++) {
                _this.viewObjects.delete(toRemove[k]);
            }

            // call event handlers
            var eventType = "displayRemoved";
            var details = {
                type: eventType,
                screenName: closedScreen,
                closedViewObjects: toRemove,
                closedWindowObjId: closedWindowObjId
            };

            if (_this.eventHandlers.has(eventType)) {
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = _this.eventHandlers.get(eventType)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var h = _step2.value;

                        h(details);
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }
            }

            //clear up the store
            io.getStore().getHash("dc." + _this.name).then(function (m) {
                if (m != null) {
                    var mobj = JSON.parse(m.displayWinObjMap);
                    delete mobj[closedScreen];

                    var vobj = JSON.parse(m.viewObjDisplayMap);
                    for (var _k = 0; _k < toRemove.length; _k++) {
                        delete vobj[toRemove[_k]];
                    }

                    io.getStore().addToHash("dc." + _this.name, "displayWinObjMap", mobj);
                    io.getStore().addToHash("dc." + _this.name, "viewObjDisplayMap", vobj);
                }
            });
        });

        this.io.onTopic("display.added", function (m) {
            var openedScreen = m.toString();
            var eventType = "displayAdded";
            var details = {
                type: eventType,
                screenName: openedScreen
            };

            if (_this.eventHandlers.has(eventType)) {
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = _this.eventHandlers.get(eventType)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var h = _step3.value;

                        h(details);
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }
            }
        });
    }

    _createClass(DisplayContext, [{
        key: 'addEventListener',
        value: function addEventListener(type, handler) {
            if (this.eventHandlers.has(type)) {
                this.eventHandlers.get(type).add(handler);
            } else {
                var ws = new Set();
                ws.add(handler);
                this.eventHandlers.set(type, ws);
            }
        }
    }, {
        key: 'removeEventListener',
        value: function removeEventListener(type, handler) {
            if (this.eventHandlers.has(type)) {
                this.eventHandlers.get(type).delete(handler);
            }
        }
    }, {
        key: '_postRequest',
        value: function _postRequest(screenName, data) {
            return this.io.call('display-rpc-queue-' + screenName, JSON.stringify(data));
        }
    }, {
        key: 'restoreFromStore',
        value: function restoreFromStore(options) {
            var _this2 = this;

            this.io.getStore().getHash("dc." + this.name).then(function (m) {
                console.log(m);
                if (m == null) {
                    console.log("initialize from options");
                    _this2.getDisplayBounds().then(function (bounds) {
                        _this2.initialize(bounds, options);
                    });
                } else {
                    console.log("restoring from store");
                    var mobj = JSON.parse(m.displayWinObjMap);
                    // create WindowObjects based on  screenname , window_id
                    _this2.displayWindows.clear();
                    var _iteratorNormalCompletion4 = true;
                    var _didIteratorError4 = false;
                    var _iteratorError4 = undefined;

                    try {
                        for (var _iterator4 = Object.keys(mobj)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                            var k = _step4.value;

                            var opts = {
                                "window_id": mobj[k],
                                "screenName": k,
                                "appContext": _this2.name
                            };
                            _this2.displayWindows.set(k, new DisplayWindow(_this2.io, opts));
                        }

                        // create viewObjects based on view_id, screenname
                    } catch (err) {
                        _didIteratorError4 = true;
                        _iteratorError4 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                _iterator4.return();
                            }
                        } finally {
                            if (_didIteratorError4) {
                                throw _iteratorError4;
                            }
                        }
                    }

                    _this2.viewObjects.clear();
                    var vobj = JSON.parse(m.viewObjDisplayMap);
                    var _iteratorNormalCompletion5 = true;
                    var _didIteratorError5 = false;
                    var _iteratorError5 = undefined;

                    try {
                        for (var _iterator5 = Object.keys(vobj)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                            var _k3 = _step5.value;

                            var _opts = {
                                "view_id": _k3,
                                "window_id": mobj[vobj[_k3]],
                                "screenName": vobj[_k3]
                            };
                            _this2.viewObjects.set(_k3, new ViewObject(_this2.io, _opts));
                        }
                    } catch (err) {
                        _didIteratorError5 = true;
                        _iteratorError5 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion5 && _iterator5.return) {
                                _iterator5.return();
                            }
                        } finally {
                            if (_didIteratorError5) {
                                throw _iteratorError5;
                            }
                        }
                    }

                    if (options['reset'] || options['reset'] == 1) {
                        _this2.show();
                        _this2.reloadAll();
                    }
                }
            });
        }

        // returns a map of displayName with bounds

    }, {
        key: 'getDisplayBounds',
        value: function getDisplayBounds() {
            return io.getStore().getHash("display.screens");
        }

        // returns the window_object corresponding to the displayName

    }, {
        key: 'getDisplayWindow',
        value: function getDisplayWindow(displayName) {
            return this.displayWindows.get(displayName);
        }
    }, {
        key: 'show',
        value: function show() {
            var cmd = {
                command: "set-app-context",
                options: {
                    context: this.name
                }
            };

            var _ps = [];
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = this.displayWindows[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var _step6$value = _slicedToArray(_step6.value, 2);

                    var k = _step6$value[0];
                    var v = _step6$value[1];

                    _ps.add(this._postRequest(k, cmd));
                }
            } catch (err) {
                _didIteratorError6 = true;
                _iteratorError6 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion6 && _iterator6.return) {
                        _iterator6.return();
                    }
                } finally {
                    if (_didIteratorError6) {
                        throw _iteratorError6;
                    }
                }
            }

            return Promise.all(_ps).then(function (m) {
                return m;
            });
        }
    }, {
        key: 'hide',
        value: function hide() {
            var cmd = {
                command: "hide-app-context",
                options: {
                    context: this.name
                }
            };
            var _ps = [];
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
                for (var _iterator7 = this.displayWindows[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var _step7$value = _slicedToArray(_step7.value, 2);

                    var k = _step7$value[0];
                    var v = _step7$value[1];

                    _ps.add(this._postRequest(k, cmd));
                }
            } catch (err) {
                _didIteratorError7 = true;
                _iteratorError7 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion7 && _iterator7.return) {
                        _iterator7.return();
                    }
                } finally {
                    if (_didIteratorError7) {
                        throw _iteratorError7;
                    }
                }
            }

            return Promise.all(_ps).then(function (m) {
                return m;
            });
        }
    }, {
        key: 'close',
        value: function close() {
            var _this3 = this;

            var cmd = {
                command: "close-app-context",
                options: {
                    context: this.name
                }
            };
            var _ps = [];
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = this.displayWindows[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var _step8$value = _slicedToArray(_step8.value, 2);

                    var k = _step8$value[0];
                    var v = _step8$value[1];

                    _ps.add(this._postRequest(k, cmd));
                }
            } catch (err) {
                _didIteratorError8 = true;
                _iteratorError8 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion8 && _iterator8.return) {
                        _iterator8.return();
                    }
                } finally {
                    if (_didIteratorError8) {
                        throw _iteratorError8;
                    }
                }
            }

            return Promise.all(_ps).then(function (m) {
                console.log(m);
                var map = [];
                for (var i = 0; i < m.length; i++) {
                    var res = JSON.parse(m[i].toString());
                    map.push(res);
                }
                console.log(map);
                _this3.displayWindows.clear();
                _this3.viewObjects.clear();
                _this3.io.getStore().delState('dc.' + _this3.name);
                return map;
            });
        }
    }, {
        key: 'reloadAll',
        value: function reloadAll() {
            var _ps = [];
            var _iteratorNormalCompletion9 = true;
            var _didIteratorError9 = false;
            var _iteratorError9 = undefined;

            try {
                for (var _iterator9 = this.viewObjects[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                    var _step9$value = _slicedToArray(_step9.value, 2);

                    var k = _step9$value[0];
                    var v = _step9$value[1];

                    _ps.add(v.reload());
                }
            } catch (err) {
                _didIteratorError9 = true;
                _iteratorError9 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion9 && _iterator9.return) {
                        _iterator9.return();
                    }
                } finally {
                    if (_didIteratorError9) {
                        throw _iteratorError9;
                    }
                }
            }

            return Promise.all(_ps).then(function (m) {
                console.log(m);
                var map = [];
                for (var i = 0; i < m.length; i++) {
                    var res = JSON.parse(m[i].toString());
                    map.push(res);
                }
                console.log(map);
                return map;
            });
        }

        /*
            initializes a displayWindow  for list of displays
            args:
             bounds : //(json object)
                {
                    screenName1 : {
                         x : <int>,
                         y : <int>,
                         width : <int>,
                         height : <int>
                    },
                    screenName2 : ...
                }
             options : //(json object)
                {
                    screenName1 : {
                        contentGrid : { //(for uniform grid)
                            row : <int>, // no of rows
                            col : <int>, // no of cols
                            rowHeight : < float array> , // height percent for each row - 0.0 to 1.0 )
                            colWidth : < float array>, // width percent for each col - 0.0 to 1.0 )
                            padding : <float> // in px or em
                            custom : [  // ( array of json Object)
                                { "label" : "cel-id-1",  left, top, width, height}, // in px or em or percent
                                { "label" : "cel-id-2",  left, top, width, height},
                                { "label" : "cel-id-3",  left, top, width, height},
                                ...
                            ],
                            gridBackground : {
                                "row|col" : "backgroundColor",
                                "cel-id-1" : "backgroundColor",
                                "cel-id-2" : "backgroundColor",
                            }
                    },
                    screenName2 : ...
                }
            
        */

    }, {
        key: 'initialize',
        value: function initialize(bounds, options) {
            var _this4 = this;

            var _ps = [];
            var _iteratorNormalCompletion10 = true;
            var _didIteratorError10 = false;
            var _iteratorError10 = undefined;

            try {
                for (var _iterator10 = Object.keys(bounds)[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                    var k = _step10.value;

                    var opts = options[k] ? options[k] : {};
                    Object.assign(opts, JSON.parse(bounds[k]));
                    opts.template = "index.html";
                    var cmd = {
                        command: 'create-window',
                        options: opts
                    };
                    _ps.push(this._postRequest(k, cmd));
                }
            } catch (err) {
                _didIteratorError10 = true;
                _iteratorError10 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion10 && _iterator10.return) {
                        _iterator10.return();
                    }
                } finally {
                    if (_didIteratorError10) {
                        throw _iteratorError10;
                    }
                }
            }

            return Promise.all(_ps).then(function (m) {
                console.log(m);
                var map = {};
                for (var i = 0; i < m.length; i++) {
                    var res = JSON.parse(m[i].toString());
                    console.log(res);
                    map[res.screenName] = res.window_id;
                    _this4.displayWindows.set(res.screenName, new DisplayWindow(_this4.io, res));
                }
                console.log(map);
                _this4.io.getStore().addToHash("dc." + _this4.name, "displayWinObjMap", JSON.stringify(map));
            });
        }
    }, {
        key: 'getViewObjectById',
        value: function getViewObjectById(id) {
            return this.viewObjects.get(id);
        }
    }, {
        key: 'getViewObjects',
        value: function getViewObjects() {
            return this.viewObjects;
        }
    }, {
        key: 'createViewObject',
        value: function createViewObject(screenName, options) {
            return this.displayWindows.get(screenName).createViewObject(options);
        }
    }]);

    return DisplayContext;
}();