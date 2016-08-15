'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Three = require('three');
var EventEmitter = require('events');

var lowCutOffFreq = .25;
var highCutOffFreq = 5;
var lowv = 200;
var highv = 4000;
var vanishTime = 1000;

module.exports = function (_EventEmitter) {
    _inherits(Hotspot, _EventEmitter);

    function Hotspot(io, region, excludeEventsOutsideRegion) {
        _classCallCheck(this, Hotspot);

        // Construct a rectangle for hit test

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Hotspot).call(this));

        _this.setRegion(region);
        _this.excludeEventsOutsideRegion = excludeEventsOutsideRegion;

        _this.pointerStates = new Map();

        io.onTopic('*.absolute.pointing', function (msg) {
            var pointers = JSON.parse(msg.toString());

            if (Array.isArray(pointers)) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = pointers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var _pointer = _step.value;

                        _this._generateEvents(_this._intersect(_pointer));
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
            } else {
                _this._generateEvents(_this._intersect(pointer));
            }
        });

        setInterval(function () {
            var now = new Date();

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _this.pointerStates[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _step2$value = _slicedToArray(_step2.value, 2);

                    var key = _step2$value[0];
                    var ps = _step2$value[1];

                    if (now - ps.lastSeen > vanishTime) {
                        _this.pointerStates.delete(key);
                        _this.emit('detach', { name: key });
                    }
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
        }, vanishTime);
        return _this;
    }
    /**
     * Set the rectangular region for the hotpot.
     * @param  {Region} region
     * @returns void
     */


    _createClass(Hotspot, [{
        key: 'setRegion',
        value: function setRegion(region) {
            var norm = new Three.Vector3(region.normal[0], region.normal[1], region.normal[2]);
            this.center = new Three.Vector3(region.center[0], region.center[1], region.center[2]);
            this.plane = new Three.Plane(norm, -norm.dot(this.center));
            this.over = new Three.Vector3(region.over[0], region.over[1], region.over[2]);
            this.up = new Three.Vector3();
            this.up.crossVectors(norm, this.over);
            this.width = region.width;
            this.height = region.height;
        }

        /**
         * Calculate the intersection point. Return null if no intersection.
         * @param  {Ray} pointer
         * @returns Point
         */

    }, {
        key: '_intersect',
        value: function _intersect(pointer) {
            if (this.plane) {
                var loc = new Three.Vector3(pointer.loc[0], pointer.loc[1], pointer.loc[2]);
                var aim = new Three.Vector3(pointer.aim[0], pointer.aim[1], pointer.aim[2]);
                var ray = new Three.Ray(loc, aim);
                var distanceAlongRay = ray.distanceToPlane(this.plane);
                if (distanceAlongRay) {
                    var intersection = ray.at(distanceAlongRay);
                    var distVec = new Three.Vector3().subVectors(intersection, this.center);
                    var x = this.width / 2 + this.over.dot(distVec);
                    var y = this.height / 2 + this.up.dot(distVec);
                    var hit = x >= 0 && x <= this.width && y >= 0 && y <= this.height;
                    var distanceAlongNormal = this.plane.distanceToPoint(loc);
                    return { x: x, y: y, hit: hit, distanceAlongRay: distanceAlongRay, distanceAlongNormal: distanceAlongNormal,
                        details: pointer };
                }
            }
            return null;
        }
    }, {
        key: '_generateEvents',
        value: function _generateEvents(pointer) {
            if (pointer) {
                // A pointer attached
                var pointerState = this.pointerStates.get(pointer.details.name);
                if (!pointerState) {
                    pointerState = { within: false, downButtons: new Set(), lastX: pointer.x, lastY: pointer.y,
                        lastTimeCaptured: pointer.details.time_captured };
                    this.pointerStates.set(pointer.details.name, pointerState);
                    this.emit('attach', pointer);
                } else {
                    // smooth pointer x,y
                    var denom = void 0;
                    var dt = (pointer.details.time_captured - pointerState.lastTimeCaptured) / 1000;
                    // v is mm/s
                    var v = Math.sqrt(Math.pow(pointer.x - pointerState.lastX, 2) + Math.pow(pointer.y - pointerState.lastY, 2)) / dt;
                    if (v < lowv) {
                        denom = 2 * Math.PI * dt * lowCutOffFreq;
                    } else if (v > highv) {
                        denom = 2 * Math.PI * dt * highCutOffFreq;
                    } else {
                        var freq = (v - lowv) / (highv - lowv) * (highCutOffFreq - lowCutOffFreq);
                        denom = 2 * Math.PI * dt * freq;
                    }
                    var alpha = denom / (denom + 1);
                    pointer.x = pointerState.lastX + alpha * (pointer.x - pointerState.lastX);
                    pointer.y = pointerState.lastY + alpha * (pointer.y - pointerState.lastY);
                    pointerState.lastX = pointer.x;
                    pointerState.lastY = pointer.y;
                    pointerState.lastTimeCaptured = pointer.details.time_captured;
                }

                pointerState.lastSeen = new Date();

                // A pointer enters when the pointer first appears within the region
                if (!pointerState.within && pointer.hit) {
                    pointerState.within = true;
                    this.emit('enter', pointer);
                }

                // A pointer leaves when the pointer already entered and then goes out of the region
                if (pointerState.within && !pointer.hit) {
                    pointerState.within = false;
                    delete pointerState.hardenedButtons;
                    pointerState.downButtons = new Set();
                    this.emit('leave', pointer);
                }

                // Only emit button events when the pionter is within the region or when we don't exclude events outside region
                // Expect buttons to be an array
                if ((pointer.hit || !this.excludeEventsOutsideRegion) && Array.isArray(pointer.details.buttons)) {
                    // Emit the move event first
                    if (pointer.hit || !this.excludeEventsOutsideRegion) {
                        // For now, a pointer is always moving if it's inside
                        this.emit('move', pointer);
                    }
                    // Emit pointer down and up events only when the pointerState has record of any buttons
                    // otherwise just set it to the buttons field
                    if (!pointerState.hardenedButtons) {
                        pointerState.hardenedButtons = new Set(pointer.details.buttons);
                    } else {
                        var hardenedButtons = new Set(pointer.details.buttons);

                        // If any of the previously hardenedButtons is not currently hardened, emit a up event
                        var _iteratorNormalCompletion3 = true;
                        var _didIteratorError3 = false;
                        var _iteratorError3 = undefined;

                        try {
                            for (var _iterator3 = pointerState.hardenedButtons[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                                var b = _step3.value;

                                if (!hardenedButtons.has(b)) {
                                    pointerState.hardenedButtons.delete(b);
                                    pointer.eventButton = b;
                                    this.emit('up', pointer);

                                    // If the upbutton is previous downed, emit a click event
                                    // Note that if a button is already hardened when enter the region,
                                    // there will be no click event upon release, because the click didn't happen
                                    // within the region.
                                    if (pointerState.downButtons.has(b)) {
                                        pointerState.downButtons.delete(b);
                                        this.emit('click', pointer);
                                    }
                                }
                            }

                            // A button is down when it is not hardened already
                            // If any of the currently hardenedButtons was not previously hardened, emit a down event
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

                        var _iteratorNormalCompletion4 = true;
                        var _didIteratorError4 = false;
                        var _iteratorError4 = undefined;

                        try {
                            for (var _iterator4 = hardenedButtons[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                var _b = _step4.value;

                                if (!pointerState.hardenedButtons.has(_b)) {
                                    pointerState.hardenedButtons.add(_b);
                                    pointerState.downButtons.add(_b);
                                    pointer.eventButton = _b;
                                    this.emit('down', pointer);
                                }
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
                    }
                }
            }
        }
    }, {
        key: 'onPointerMove',
        value: function onPointerMove(handler) {
            this.on('move', handler);
        }
    }, {
        key: 'onPointerEnter',
        value: function onPointerEnter(handler) {
            this.on('enter', handler);
        }
    }, {
        key: 'onPointerLeave',
        value: function onPointerLeave(handler) {
            this.on('leave', handler);
        }
    }, {
        key: 'onPointerDown',
        value: function onPointerDown(handler) {
            this.on('down', handler);
        }
    }, {
        key: 'onPointerUp',
        value: function onPointerUp(handler) {
            this.on('up', handler);
        }
    }, {
        key: 'onPointerClick',
        value: function onPointerClick(handler) {
            this.on('click', handler);
        }
    }, {
        key: 'onPointerAttach',
        value: function onPointerAttach(handler) {
            this.on('attach', handler);
        }
    }, {
        key: 'onPointerDetach',
        value: function onPointerDetach(handler) {
            this.on('detach', handler);
        }
    }]);

    return Hotspot;
}(EventEmitter);