'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Three = require('three');

module.exports = function () {
    function Hotspot(region, io) {
        _classCallCheck(this, Hotspot);

        // Construct a rectangle for hit test
        this.setRegion(region);
        this.io = io;
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
        key: 'intersect',
        value: function intersect(pointer) {
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
                    var within = x >= 0 && x <= this.width && y >= 0 && y <= this.height;
                    var distanceAlongNormal = this.plane.distanceToPoint(loc);
                    return { x: x, y: y, within: within, distanceAlongRay: distanceAlongRay, distanceAlongNormal: distanceAlongNormal,
                        details: pointer };
                }
            }
            return null;
        }
    }, {
        key: 'on',
        value: function on(handler) {
            var _this = this;

            this.io.onTopic('*.absolute.pointing', function (msg) {
                var pointers = JSON.parse(msg.content.toString());

                if (Array.isArray(pointers)) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = pointers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var _pointer = _step.value;

                            handler(_this.intersect(_pointer));
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
                    handler(_this.intersect(pointer));
                }
            });
            // TODO: Handle relative pointing devices like mice
        }
    }]);

    return Hotspot;
}();