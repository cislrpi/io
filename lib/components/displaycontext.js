'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DisplayWindow = require('./displaywindow');
var ViewObject = require('./viewobject');

module.exports = function () {
    function DisplayContext(name, io) {
        var _this = this;

        _classCallCheck(this, DisplayContext);

        this.io = io;
        this.name = name;
        this.displayWindows = new Map();
        this.viewObjects = new Map();
        this.io.getStore().addToSet("displayContexts", name);

        this.eventHandlers = new Map();
        this.io.onTopic("display.removed", function (m) {

            // clean up objects
            var closedDisplay = m.toString();
            var closedWindowObjId = _this.displayWindows.get(closedDisplay);
            _this.displayWindows.delete(closedDisplay);
            var toRemove = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _this.viewObjects[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _step$value = _slicedToArray(_step.value, 2),
                        _k2 = _step$value[0],
                        v = _step$value[1];

                    if (v.displayName == closedDisplay) toRemove.push(_k2);
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

            //clear up the store
            _this.io.getStore().getHash("dc." + _this.name).then(function (m) {
                if (m != null) {
                    var mobj = m.displayWinObjMap ? JSON.parse(m.displayWinObjMap) : null;
                    if (mobj) {
                        delete mobj[closedDisplay];
                        mobj = Object.keys(mobj).length > 0 ? mobj : null;
                    }
                    if (mobj) {
                        _this.io.getStore().addToHash("dc." + _this.name, "displayWinObjMap", JSON.stringify(mobj));
                    } else {
                        _this.io.getStore().removeFromHash("dc." + _this.name, "displayWinObjMap");
                    }

                    var vobj = m.viewObjDisplayMap ? JSON.parse(m.viewObjDisplayMap) : null;

                    if (vobj) {
                        for (var _k = 0; _k < toRemove.length; _k++) {
                            delete vobj[toRemove[_k]];
                        }
                        vobj = Object.keys(vobj).length > 0 ? vobj : null;
                    }
                    if (vobj) {
                        _this.io.getStore().addToHash("dc." + _this.name, "viewObjDisplayMap", JSON.stringify(vobj));
                    } else {
                        _this.io.getStore().removeFromHash("dc." + _this.name, "viewObjDisplayMap");
                    }
                }
            });
        });
    }

    _createClass(DisplayContext, [{
        key: '_on',
        value: function _on(topic, handler) {
            this.io.onTopic(topic, function (msg, headers) {
                if (handler != null) handler(JSON.parse(msg.toString()), headers);
            });
        }
    }, {
        key: '_postRequest',
        value: function _postRequest(displayName, data) {
            return this.io.call('display-rpc-queue-' + displayName, JSON.stringify(data));
        }
    }, {
        key: 'restoreFromStore',
        value: function restoreFromStore(options) {
            var _this2 = this;

            return this.io.getStore().getHash("dc." + this.name).then(function (m) {
                if (m == null) {
                    console.log("initialize from options");
                    if (options == undefined || Object.keys(options).length === 0) {
                        return _this2.getDisplayBounds().then(function (bounds) {
                            var _iteratorNormalCompletion2 = true;
                            var _didIteratorError2 = false;
                            var _iteratorError2 = undefined;

                            try {
                                for (var _iterator2 = Object.keys(bounds)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                    var k = _step2.value;

                                    bounds[k] = JSON.parse(bounds[k]);
                                    bounds[k].displayName = k;
                                    bounds[k].windowName = k;
                                    bounds[k].template = "index.html";
                                    bounds[k].displayContext = _this2.name;
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

                            return _this2.initialize(bounds);
                        });
                    } else {
                        var _iteratorNormalCompletion3 = true;
                        var _didIteratorError3 = false;
                        var _iteratorError3 = undefined;

                        try {
                            for (var _iterator3 = Object.keys(options)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                                var k = _step3.value;

                                options[k].windowName = k;
                                options[k].displayContext = _this2.name;
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

                        return _this2.initialize(options);
                    }
                } else {
                    console.log("restoring from store");
                    _this2.displayWindows.clear();
                    _this2.viewObjects.clear();

                    if (m.displayWinObjMap) {
                        var mobj = JSON.parse(m.displayWinObjMap);
                        // create WindowObjects based on  windowName , window_id

                        var _iteratorNormalCompletion4 = true;
                        var _didIteratorError4 = false;
                        var _iteratorError4 = undefined;

                        try {
                            for (var _iterator4 = Object.keys(mobj)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                var _k4 = _step4.value;

                                var _opts = mobj[_k4];
                                _this2.displayWindows.set(_k4, new DisplayWindow(_this2.io, _opts));
                            }

                            // create viewObjects based on view_id, windowName
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

                        if (m.viewObjDisplayMap) {
                            var vobj = JSON.parse(m.viewObjDisplayMap);
                            var _iteratorNormalCompletion5 = true;
                            var _didIteratorError5 = false;
                            var _iteratorError5 = undefined;

                            try {
                                for (var _iterator5 = Object.keys(vobj)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                                    var _k3 = _step5.value;

                                    var wn = mobj[vobj[_k3]];
                                    var opts = {
                                        "view_id": _k3,
                                        "window_id": wn.window_id,
                                        "displayName": wn.displayName,
                                        "displayContext": _this2.name,
                                        "windowName": wn.windowName
                                    };
                                    _this2.viewObjects.set(_k3, new ViewObject(_this2.io, opts));
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
                        }
                    }

                    if (options['reset']) {
                        console.log("making it active and reloading");
                        _this2.show().then(function (m) {
                            return _this2.reloadAll();
                        }).then(function (m) {
                            console.log(m);
                        });
                    } else {
                        console.log("making it active ");
                        _this2.show().then(function (m) {
                            return m;
                        });
                    }
                }
            });
        }

        // returns a map of displayName with bounds

    }, {
        key: 'getDisplayBounds',
        value: function getDisplayBounds() {
            return this.io.getStore().getHash("display.displays");
        }

        // returns the window_object corresponding to the displayName

    }, {
        key: 'getDisplayWindowSync',
        value: function getDisplayWindowSync(displayName) {
            return this.displayWindows.get(displayName);
        }
    }, {
        key: 'getDisplayWindowByIdSync',
        value: function getDisplayWindowByIdSync(window_id) {
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = this.displayWindows[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var _step6$value = _slicedToArray(_step6.value, 2),
                        k = _step6$value[0],
                        v = _step6$value[1];

                    if (v.window_id === window_id) return v;
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

            return new Error('Window id ' + window_id + ' is not present');
        }
    }, {
        key: 'getDisplayWindowNameSync',
        value: function getDisplayWindowNameSync() {
            return this.displayWindows.keys();
        }
    }, {
        key: 'show',
        value: function show() {
            var _this3 = this;

            var cmd = {
                command: "set-display-context",
                options: {
                    context: this.name
                }
            };

            return this.getDisplayBounds().then(function (m) {
                var _ps = [];
                var _iteratorNormalCompletion7 = true;
                var _didIteratorError7 = false;
                var _iteratorError7 = undefined;

                try {
                    for (var _iterator7 = Object.keys(m)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                        var k = _step7.value;

                        _ps.push(_this3._postRequest(k, cmd));
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

                return Promise.all(_ps);
            }).then(function (m) {
                _this3.io.getStore().setState("activeDisplayContext", _this3.name);
                return m;
            });
        }
    }, {
        key: 'hide',
        value: function hide() {
            var _this4 = this;

            var cmd = {
                command: "hide-display-context",
                options: {
                    context: this.name
                }
            };
            return this.getDisplayBounds().then(function (m) {
                var _ps = [];
                var _iteratorNormalCompletion8 = true;
                var _didIteratorError8 = false;
                var _iteratorError8 = undefined;

                try {
                    for (var _iterator8 = Object.keys(m)[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                        var k = _step8.value;

                        _ps.push(_this4._postRequest(k, cmd));
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

                return Promise.all(_ps);
            }).then(function (m) {
                return m;
            });
        }
    }, {
        key: 'close',
        value: function close() {
            var _this5 = this;

            var cmd = {
                command: "close-display-context",
                options: {
                    context: this.name
                }
            };
            return this.getDisplayBounds().then(function (m) {
                if (m) {
                    var _ps = [];
                    var _iteratorNormalCompletion9 = true;
                    var _didIteratorError9 = false;
                    var _iteratorError9 = undefined;

                    try {
                        for (var _iterator9 = Object.keys(m)[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                            var k = _step9.value;

                            _ps.push(_this5._postRequest(k, cmd));
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

                    return Promise.all(_ps);
                } else {
                    return [];
                }
            }).then(function (m) {
                console.log(m);
                var map = [];
                for (var i = 0; i < m.length; i++) {
                    var res = JSON.parse(m[i].toString());
                    map.push(res);
                }
                console.log(map);
                _this5.displayWindows.clear();
                _this5.viewObjects.clear();
                _this5.io.getStore().delState('dc.' + _this5.name);
                _this5.io.getStore().removeFromSet("displayContexts", _this5.name);
                _this5.io.getStore().getState('activeDisplayContext').then(function (x) {
                    if (x == _this5.name) _this5.io.getStore().delState('activeDisplayContext');
                });

                return map;
            });
        }
    }, {
        key: 'reloadAll',
        value: function reloadAll() {
            var _ps = [];
            var _iteratorNormalCompletion10 = true;
            var _didIteratorError10 = false;
            var _iteratorError10 = undefined;

            try {
                for (var _iterator10 = this.viewObjects[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                    var _step10$value = _slicedToArray(_step10.value, 2),
                        k = _step10$value[0],
                        v = _step10$value[1];

                    _ps.push(v.reload());
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
                    displayName1 : {
                         x : <int>,
                         y : <int>,
                         width : <int>,
                         height : <int>
                    },
                    displayName2 : ...
                }
             options : //(json object)
                {
                    displayName1 : {
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
                    displayName2 : ...
                }
            
        */

    }, {
        key: 'initialize',
        value: function initialize(options) {
            var _this6 = this;

            return this.show().then(function () {
                var _ps = [];
                var _iteratorNormalCompletion11 = true;
                var _didIteratorError11 = false;
                var _iteratorError11 = undefined;

                try {
                    for (var _iterator11 = Object.keys(options)[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                        var k = _step11.value;

                        var cmd = {
                            command: 'create-window',
                            options: options[k]
                        };
                        _ps.push(_this6._postRequest(k, cmd));
                    }
                } catch (err) {
                    _didIteratorError11 = true;
                    _iteratorError11 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion11 && _iterator11.return) {
                            _iterator11.return();
                        }
                    } finally {
                        if (_didIteratorError11) {
                            throw _iteratorError11;
                        }
                    }
                }

                return Promise.all(_ps);
            }).then(function (m) {
                var map = {};
                for (var i = 0; i < m.length; i++) {
                    var res = JSON.parse(m[i].toString());
                    console.log(res);
                    map[res.windowName] = res;
                    _this6.displayWindows.set(res.windowName, new DisplayWindow(_this6.io, res));
                }
                _this6.io.getStore().addToHash("dc." + _this6.name, "displayWinObjMap", JSON.stringify(map));
                return map;
            });
        }
    }, {
        key: 'getViewObjectByIdSync',
        value: function getViewObjectByIdSync(id) {
            return this.viewObjects.get(id);
        }
    }, {
        key: 'getViewObjectsSync',
        value: function getViewObjectsSync() {
            return this.viewObjects;
        }
    }, {
        key: 'captureDisplayWindows',
        value: function captureDisplayWindows() {
            var _ps = [];
            var _iteratorNormalCompletion12 = true;
            var _didIteratorError12 = false;
            var _iteratorError12 = undefined;

            try {
                for (var _iterator12 = this.displayWindows[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                    var _step12$value = _slicedToArray(_step12.value, 2),
                        k = _step12$value[0],
                        v = _step12$value[1];

                    _ps.add(v.capture());
                }
            } catch (err) {
                _didIteratorError12 = true;
                _iteratorError12 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion12 && _iterator12.return) {
                        _iterator12.return();
                    }
                } finally {
                    if (_didIteratorError12) {
                        throw _iteratorError12;
                    }
                }
            }

            return Promise.all(_ps);
        }
    }, {
        key: 'createViewObject',
        value: function createViewObject(options, windowName) {
            var _this7 = this;

            var wname = "main";
            if (windowName && this.displayWindows.has(windowName)) {
                wname = windowName;
            }
            console.log("wname : ", wname);
            return this.displayWindows.get(wname).createViewObject(options).then(function (vo) {
                _this7.viewObjects.set(vo.view_id, vo);
                var map = {};
                var _iteratorNormalCompletion13 = true;
                var _didIteratorError13 = false;
                var _iteratorError13 = undefined;

                try {
                    for (var _iterator13 = _this7.viewObjects[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
                        var _step13$value = _slicedToArray(_step13.value, 2),
                            k = _step13$value[0],
                            v = _step13$value[1];

                        map[k] = v.windowName;
                    }
                } catch (err) {
                    _didIteratorError13 = true;
                    _iteratorError13 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion13 && _iterator13.return) {
                            _iterator13.return();
                        }
                    } finally {
                        if (_didIteratorError13) {
                            throw _iteratorError13;
                        }
                    }
                }

                _this7.io.getStore().addToHash("dc." + _this7.name, "viewObjDisplayMap", JSON.stringify(map));
                return vo;
            });
        }
    }, {
        key: 'onViewObjectCreated',
        value: function onViewObjectCreated(handler) {
            this._on('display.' + this.name + '.viewObjectCreated', handler);
        }
    }, {
        key: 'OnViewObjectHidden',
        value: function OnViewObjectHidden(handler) {
            this._on('display.' + this.name + '.viewObjectHidden', handler);
        }
    }, {
        key: 'onViewObjectShown',
        value: function onViewObjectShown(handler) {
            this._on('display.' + this.name + '.viewObjectShown', handler);
        }
    }, {
        key: 'onViewObjectClosed',
        value: function onViewObjectClosed(handler) {
            this._on('display.' + this.name + '.viewObjectClosed', handler);
        }
    }, {
        key: 'onViewObjectBoundsChanged',
        value: function onViewObjectBoundsChanged(handler) {
            this._on('display.' + this.name + '.viewObjectBoundsChanged', handler);
        }
    }, {
        key: 'onViewObjectUrlChanged',
        value: function onViewObjectUrlChanged(handler) {
            this._on('display.' + this.name + '.viewObjectUrlChanged', handler);
        }
    }, {
        key: 'onViewObjectUrlReloaded',
        value: function onViewObjectUrlReloaded(handler) {
            this._on('display.' + this.name + '.viewObjectUrlChanged', handler);
        }
    }, {
        key: 'onViewObjectCrashed',
        value: function onViewObjectCrashed(handler) {
            this._on('display.' + this.name + '.viewObjectCrashed', handler);
        }
    }, {
        key: 'onViewObjectGPUCrashed',
        value: function onViewObjectGPUCrashed(handler) {
            this._on('display.' + this.name + '.viewObjectGPUCrashed', handler);
        }
    }, {
        key: 'onViewObjectPluginCrashed',
        value: function onViewObjectPluginCrashed(handler) {
            this._on('display.' + this.name + '.viewObjectPluginCrashed', handler);
        }
    }, {
        key: 'onDisplayContextCreated',
        value: function onDisplayContextCreated(handler) {
            this._on('display.displayContext.created', handler);
        }
    }, {
        key: 'onActiveDisplayContextChanged',
        value: function onActiveDisplayContextChanged(handler) {
            this._on('display.displayContext.activeChanged', handler);
        }
    }, {
        key: 'onDisplayContextClosed',
        value: function onDisplayContextClosed(handler) {
            this._on('display.displayContext.closed', handler);
        }
    }, {
        key: 'onDisplayWorkerRemoved',
        value: function onDisplayWorkerRemoved(handler) {
            this._on('display.removed', handler);
        }
    }, {
        key: 'onDisplayWorkerAdded',
        value: function onDisplayWorkerAdded(handler) {
            this._on('display.added', handler);
        }
    }]);

    return DisplayContext;
}();