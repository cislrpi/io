const Three = require('three');
const EventEmitter = require('events');

module.exports = class Hotspot extends EventEmitter {
    constructor(region, io) {
        super();
        // Construct a rectangle for hit test
        this.setRegion(region);
        
        this.pointerStates = new Map();

        io.onTopic('*.absolute.pointing', msg => {
            const pointers = JSON.parse(msg.content.toString());

            if (Array.isArray(pointers)) {
                for (let pointer of pointers) {
                    this._generateEvents(this._intersect(pointer));
                }
            } else {
                this._generateEvents(this._intersect(pointer));
            }
        });

        // TODO: generate detach event;
        setInterval(()=>{
            const now = new Date();

            for (let [key, ps] of this.pointerStates) {
                if (now - ps.lastSeen > 1000) {
                    this.pointerStates.delete(key);
                    this.emit('detach', key);
                }
            }
        }, 1000);
    }
    /**
     * Set the rectangular region for the hotpot.
     * @param  {Region} region
     * @returns void
     */
    setRegion(region) {
        const norm = new Three.Vector3(region.normal[0], region.normal[1], region.normal[2]);
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
    _intersect(pointer) {
        if (this.plane) {
            const loc = new Three.Vector3(pointer.loc[0], pointer.loc[1], pointer.loc[2]);
            const aim = new Three.Vector3(pointer.aim[0], pointer.aim[1], pointer.aim[2]);
            const ray = new Three.Ray(loc, aim);
            const distanceAlongRay = ray.distanceToPlane(this.plane);
            if (distanceAlongRay) {
                const intersection = ray.at(distanceAlongRay);
                const distVec = new Three.Vector3().subVectors(intersection, this.center);
                const x = this.width / 2 + this.over.dot(distVec);
                const y = this.height / 2 + this.up.dot(distVec);
                const hit = x >= 0 && x <= this.width && y >=0 && y <= this.height;
                const distanceAlongNormal = this.plane.distanceToPoint(loc);
                return { x, y, hit, distanceAlongRay, distanceAlongNormal,
                    details: pointer };
            }
        }
        return null;
    }

    _generateEvents(pointer) {
        if (pointer) {
            // A pointer attached
            let pointerState = this.pointerStates.get(pointer.details.name);
            if (!pointerState) {
                pointerState = {within: false, downButtons: new Set()}
                this.pointerStates.set(pointer.details.name, pointerState);
                this.emit('attach', pointer);
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

            // Only emit button events when the pionter is within the region
            // Expect buttons to be an array
            if (pointer.hit && Array.isArray(pointer.details.buttons)) {
                // Emit pointer down and up events only when the pointerState has record of any buttons
                // otherwise just set it to the buttons field
                if (!pointerState.hardenedButtons) {
                    pointerState.hardenedButtons = new Set(pointer.details.buttons);
                } else {
                    // A button is down when it is not hardened already
                    const hardenedButtons = new Set(pointer.details.buttons);

                    // If any of the currently hardenedButtons was not previously hardened, emit a down event
                    for (let b of hardenedButtons) {
                        if (!pointerState.hardenedButtons.has(b)) {
                            pointerState.hardenedButtons.add(b);
                            pointerState.downButtons.add(b);
                            pointer.eventButton = b;
                            this.emit('down', pointer);
                        }
                    }

                    // If any of the previously hardenedButtons is not currently hardened, emit a up event
                    for (let b of pointerState.hardenedButtons) {
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
                }
            }

            if (pointer.hit) {
                // For now, a pointer is always moving if it's inside
                this.emit('move', pointer);
            }
        }
    }

    onPointerMove(handler) {
        this.on('move', handler);
    }

    onPointerEnter(handler) {
        this.on('enter', handler);
    }

    onPointerLeave(handler) {
        this.on('leave', handler);
    }

    onPointerDown(handler) {
        this.on('down', handler);
    }

    onPointerUp(handler) {
        this.on('up', handler);
    }

    onPointerClick(handler) {
        this.on('click', handler);
    }

    onPointerAttach(handler) {
        this.on('attach', handler);
    }

    onPointerDetach(handler) {
        this.on('detach', handler);
    }
}
