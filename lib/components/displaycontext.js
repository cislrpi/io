'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DisplayWindow = require('./displaywindow');
var ViewObject = require('./viewobject');
var _ = require('lodash');

module.exports = function () {
    function DisplayContext(name, window_settings, io) {
        var _this = this;

        _classCallCheck(this, DisplayContext);

        console.log("creating obj for display context : ", name);
        this.io = io;
        this.name = name;
        this.displayWindows = new Map();
        this.viewObjects = new Map();

        if (!_.isEmpty(window_settings)) this.io.getStore().addToHash("display.windowBounds", name, JSON.stringify(window_settings));

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
                if (!_.isEmpty(m)) {
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
            console.log(displayName, data);
            return this.io.call('display-rpc-queue-' + displayName, JSON.stringify(data));
        }
    }, {
        key: 'restoreFromStore',
        value: function restoreFromStore() {
            var _this2 = this;

            var reset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            return this.io.getStore().getHash("dc." + this.name).then(function (m) {
                if (_.isEmpty(m)) {
                    console.log("initialize from options");
                    return _this2.getWindowBounds().then(function (bounds) {
                        return _this2.initialize(bounds);
                    });
                } else {
                    console.log("restoring from store");
                    _this2.displayWindows.clear();
                    _this2.viewObjects.clear();

                    if (m.displayWinObjMap) {
                        var mobj = JSON.parse(m.displayWinObjMap);
                        // create WindowObjects based on  windowName , window_id

                        var _iteratorNormalCompletion2 = true;
                        var _didIteratorError2 = false;
                        var _iteratorError2 = undefined;

                        try {
                            for (var _iterator2 = Object.keys(mobj)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                var _k3 = _step2.value;

                                var _opts = mobj[_k3];
                                _this2.displayWindows.set(_k3, new DisplayWindow(_this2.io, _opts));
                            }

                            // create viewObjects based on view_id, windowName
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

                        if (m.viewObjDisplayMap) {
                            var vobj = JSON.parse(m.viewObjDisplayMap);
                            var _iteratorNormalCompletion3 = true;
                            var _didIteratorError3 = false;
                            var _iteratorError3 = undefined;

                            try {
                                for (var _iterator3 = Object.keys(vobj)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                                    var k = _step3.value;

                                    var wn = mobj[vobj[k]];
                                    var opts = {
                                        "view_id": k,
                                        "window_id": wn.window_id,
                                        "displayName": wn.displayName,
                                        "displayContext": _this2.name,
                                        "windowName": wn.windowName
                                    };
                                    _this2.viewObjects.set(k, new ViewObject(_this2.io, opts));
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
                    }

                    if (reset) {
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
        key: 'getWindowBounds',
        value: function getWindowBounds() {
            var _this3 = this;

            return this.io.getStore().getHashField("display.windowBounds", this.name).then(function (m) {
                console.log(m);
                if (m == null) {
                    return _this3.io.getStore().getHash("display.displays").then(function (x) {
                        var _iteratorNormalCompletion4 = true;
                        var _didIteratorError4 = false;
                        var _iteratorError4 = undefined;

                        try {
                            for (var _iterator4 = Object.keys(x)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                var k = _step4.value;

                                x[k] = JSON.parse(x[k]);
                                if (x[k].displayName == undefined) x[k].displayName = k;
                                x[k].windowName = k;
                                x[k].displayContext = _this3.name;
                            }
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

                        return x;
                    });
                } else {
                    var x = JSON.parse(m);
                    var _iteratorNormalCompletion5 = true;
                    var _didIteratorError5 = false;
                    var _iteratorError5 = undefined;

                    try {
                        for (var _iterator5 = Object.keys(x)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                            var k = _step5.value;

                            if (x[k].displayName == undefined) x[k].displayName = k;
                            x[k].windowName = k;
                            x[k].displayContext = _this3.name;
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

                    return x;
                }
            });
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
            var _this4 = this;

            var cmd = {
                command: "set-display-context",
                options: {
                    context: this.name
                }
            };

            return this.getWindowBounds().then(function (m) {
                var disps = new Set();
                var _iteratorNormalCompletion7 = true;
                var _didIteratorError7 = false;
                var _iteratorError7 = undefined;

                try {
                    for (var _iterator7 = Object.keys(m)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                        var k = _step7.value;

                        disps.add(m[k].displayName);
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

                console.log(disps);
                var _ps = [];
                var _iteratorNormalCompletion8 = true;
                var _didIteratorError8 = false;
                var _iteratorError8 = undefined;

                try {
                    for (var _iterator8 = disps[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                        var _k4 = _step8.value;

                        _ps.push(_this4._postRequest(_k4, cmd));
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
                console.log("##windows shown");
                _this4.io.getStore().setState("activeDisplayContext", _this4.name);
                return m;
            });
        }
    }, {
        key: 'hide',
        value: function hide() {
            var _this5 = this;

            var cmd = {
                command: "hide-display-context",
                options: {
                    context: this.name
                }
            };
            return this.getWindowBounds().then(function (m) {
                var disps = new Set();
                var _iteratorNormalCompletion9 = true;
                var _didIteratorError9 = false;
                var _iteratorError9 = undefined;

                try {
                    for (var _iterator9 = Object.keys(m)[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                        var k = _step9.value;

                        disps.add(m[k].displayName);
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

                var _ps = [];
                var _iteratorNormalCompletion10 = true;
                var _didIteratorError10 = false;
                var _iteratorError10 = undefined;

                try {
                    for (var _iterator10 = disps[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                        var _k5 = _step10.value;

                        _ps.push(_this5._postRequest(_k5, cmd));
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

                return Promise.all(_ps);
            }).then(function (m) {
                return m;
            });
        }
    }, {
        key: 'close',
        value: function close() {
            var _this6 = this;

            var cmd = {
                command: "close-display-context",
                options: {
                    context: this.name
                }
            };
            return this.getWindowBounds().then(function (m) {
                if (m) {
                    var disps = new Set();
                    var _iteratorNormalCompletion11 = true;
                    var _didIteratorError11 = false;
                    var _iteratorError11 = undefined;

                    try {
                        for (var _iterator11 = Object.keys(m)[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                            var k = _step11.value;

                            disps.add(m[k].displayName);
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

                    var _ps = [];
                    var _iteratorNormalCompletion12 = true;
                    var _didIteratorError12 = false;
                    var _iteratorError12 = undefined;

                    try {
                        for (var _iterator12 = disps[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                            var _k6 = _step12.value;

                            _ps.push(_this6._postRequest(_k6, cmd));
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
                } else {
                    return [];
                }
            }).then(function (m) {
                console.log("##closing dc");
                var map = [];
                var isHidden = false;
                for (var i = 0; i < m.length; i++) {
                    var res = JSON.parse(m[i].toString());
                    if (res.command == 'hide-display-context') isHidden = true;
                    map.push(res);
                }
                if (!isHidden) {
                    _this6.displayWindows.clear();
                    _this6.viewObjects.clear();
                    _this6.io.getStore().delState('dc.' + _this6.name);
                    _this6.io.getStore().removeFromSet("displayContexts", _this6.name);
                    _this6.io.getStore().removeFromHash("display.windowBounds", _this6.name);
                    _this6.io.getStore().getState('activeDisplayContext').then(function (x) {
                        if (x == _this6.name) _this6.io.getStore().delState('activeDisplayContext');
                    });
                }
                return map;
            });
        }
    }, {
        key: 'reloadAll',
        value: function reloadAll() {
            var _ps = [];
            var _iteratorNormalCompletion13 = true;
            var _didIteratorError13 = false;
            var _iteratorError13 = undefined;

            try {
                for (var _iterator13 = this.viewObjects[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
                    var _step13$value = _slicedToArray(_step13.value, 2),
                        k = _step13$value[0],
                        v = _step13$value[1];

                    _ps.push(v.reload());
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

            return Promise.all(_ps).then(function (m) {
                console.log(m);
                var map = [];
                for (var i = 0; i < m.length; i++) {
                    var res = JSON.parse(m[i].toString());
                    map.push(res);
                }
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
            var _this7 = this;

            return this.show().then(function () {
                var _ps = [];
                var _iteratorNormalCompletion14 = true;
                var _didIteratorError14 = false;
                var _iteratorError14 = undefined;

                try {
                    for (var _iterator14 = Object.keys(options)[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
                        var k = _step14.value;

                        console.log("creating window for ", k);
                        options[k].template = "index.html";
                        var cmd = {
                            command: 'create-window',
                            options: options[k]
                        };
                        _ps.push(_this7._postRequest(options[k].displayName, cmd));
                    }
                } catch (err) {
                    _didIteratorError14 = true;
                    _iteratorError14 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion14 && _iterator14.return) {
                            _iterator14.return();
                        }
                    } finally {
                        if (_didIteratorError14) {
                            throw _iteratorError14;
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
                    _this7.displayWindows.set(res.windowName, new DisplayWindow(_this7.io, res));
                }
                _this7.io.getStore().addToHash("dc." + _this7.name, "displayWinObjMap", JSON.stringify(map));
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
            var _iteratorNormalCompletion15 = true;
            var _didIteratorError15 = false;
            var _iteratorError15 = undefined;

            try {
                for (var _iterator15 = this.displayWindows[Symbol.iterator](), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
                    var _step15$value = _slicedToArray(_step15.value, 2),
                        k = _step15$value[0],
                        v = _step15$value[1];

                    _ps.add(v.capture());
                }
            } catch (err) {
                _didIteratorError15 = true;
                _iteratorError15 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion15 && _iterator15.return) {
                        _iterator15.return();
                    }
                } finally {
                    if (_didIteratorError15) {
                        throw _iteratorError15;
                    }
                }
            }

            return Promise.all(_ps);
        }
    }, {
        key: 'createViewObject',
        value: function createViewObject(options) {
            var _this8 = this;

            var windowName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "main";

            options.displayContext = this.name;
            if (this.displayWindows.has(windowName)) {
                return this.displayWindows.get(windowName).createViewObject(options).then(function (vo) {
                    _this8.viewObjects.set(vo.view_id, vo);
                    var map = {};
                    var _iteratorNormalCompletion16 = true;
                    var _didIteratorError16 = false;
                    var _iteratorError16 = undefined;

                    try {
                        for (var _iterator16 = _this8.viewObjects[Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
                            var _step16$value = _slicedToArray(_step16.value, 2),
                                k = _step16$value[0],
                                v = _step16$value[1];

                            map[k] = v.windowName;
                        }
                    } catch (err) {
                        _didIteratorError16 = true;
                        _iteratorError16 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion16 && _iterator16.return) {
                                _iterator16.return();
                            }
                        } finally {
                            if (_didIteratorError16) {
                                throw _iteratorError16;
                            }
                        }
                    }

                    _this8.io.getStore().addToHash("dc." + _this8.name, "viewObjDisplayMap", JSON.stringify(map));
                    return vo;
                });
            } else {
                return this.getWindowBounds().then(function (bounds) {
                    var _iteratorNormalCompletion17 = true;
                    var _didIteratorError17 = false;
                    var _iteratorError17 = undefined;

                    try {
                        for (var _iterator17 = Object.keys(bounds)[Symbol.iterator](), _step17; !(_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done); _iteratorNormalCompletion17 = true) {
                            var k = _step17.value;

                            if (bounds[k].displayName == undefined) bounds[k].displayName = k;
                            bounds[k].windowName = k;
                            bounds[k].template = "index.html";
                            bounds[k].displayContext = _this8.name;
                        }
                    } catch (err) {
                        _didIteratorError17 = true;
                        _iteratorError17 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion17 && _iterator17.return) {
                                _iterator17.return();
                            }
                        } finally {
                            if (_didIteratorError17) {
                                throw _iteratorError17;
                            }
                        }
                    }

                    return _this8.initialize(bounds);
                }).then(function (m) {
                    return _this8.createViewObject(options, windowName);
                });
            }
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
            this._on('display.displayContext.changed', handler);
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