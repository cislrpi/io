const Three = require('three')
const EventEmitter = require('events')

const lowCutOffFreq = 0.25
const highCutOffFreq = 5
const lowv = 200
const highv = 4000
const vanishTime = 1000

/**
 * Class representing the Hotspot object.
 */
class Hotspot extends EventEmitter {
    /**
     * Use {@link CELIO#createHotspot} instead.
     */
    constructor(io, region, excludeEventsOutsideRegion) {
        super()
        // Construct a rectangle for hit test
        this.setRegion(region)
        this.excludeEventsOutsideRegion = excludeEventsOutsideRegion

        this.pointerStates = new Map()

        io.onTopic('*.absolute.pointing', msg => {
            const pointers = JSON.parse(msg.toString())

            if (Array.isArray(pointers)) {
                for (let pointer of pointers) {
                    this._generateEvents(this._intersect(pointer))
                }
            } else {
                this._generateEvents(this._intersect(pointers))
            }
        })

        setInterval(() => {
            const now = new Date()

            for (let [key, ps] of this.pointerStates) {
                if (now - ps.lastSeen > vanishTime) {
                    this.pointerStates.delete(key)
                    this.emit('detach', {name: key})
                }
            }
        }, vanishTime)
    }

    /**
     * Set the rectangular region for the hotpot.
     * @param  {Object} region
     */
    setRegion(region) {
        const norm = new Three.Vector3(region.normal[0], region.normal[1], region.normal[2])
        this.center = new Three.Vector3(region.center[0], region.center[1], region.center[2])
        this.plane = new Three.Plane(norm, -norm.dot(this.center))
        this.over = new Three.Vector3(region.over[0], region.over[1], region.over[2])
        this.up = new Three.Vector3()
        this.up.crossVectors(norm, this.over)
        this.width = region.width
        this.height = region.height
    }

    /**
     * Calculate the intersection point. Return null if no intersection.
     * @private
     * @param  {Ray} pointer
     * @returns Point
     */
    _intersect(pointer) {
        if (this.plane) {
            const loc = new Three.Vector3(pointer.loc[0], pointer.loc[1], pointer.loc[2])
            if (pointer.aim) {
                const aim = new Three.Vector3(pointer.aim[0], pointer.aim[1], pointer.aim[2])
                const ray = new Three.Ray(loc, aim)
                const distanceAlongRay = ray.distanceToPlane(this.plane)
                if (distanceAlongRay) {
                    const intersection = ray.at(distanceAlongRay)
                    const distVec = new Three.Vector3().subVectors(intersection, this.center)
                    const x = this.width / 2 + this.over.dot(distVec)
                    const y = this.height / 2 + this.up.dot(distVec)
                    const hit = x >= 0 && x <= this.width && y >= 0 && y <= this.height
                    const distanceAlongNormal = this.plane.distanceToPoint(loc)
                    return { x, y, hit, distanceAlongRay, distanceAlongNormal, details: pointer }
                }
            } else {
                return {
                    x: this.width / 2 + loc.x - this.center.x,
                    y: this.height / 2 - (loc.y - this.center.y),
                    hit: true,
                    distanceAlongRay: 0,
                    distanceAlongNormal: 0,
                    details: pointer
                }
            }
        }
        return null
    }

    _generateEvents(pointer) {
        if (pointer) {
            // A pointer attached
            let pointerState = this.pointerStates.get(pointer.details.name)
            if (!pointerState) {
                pointerState = {
                    within: false,
                    downButtons: new Set(),
                    lastX: pointer.x,
                    lastY: pointer.y,
                    lastTimeCaptured: pointer.details.time_captured
                }
                this.pointerStates.set(pointer.details.name, pointerState)
                this.emit('attach', pointer)
            } else {
                // smooth pointer x,y
                let denom
                const dt = (pointer.details.time_captured - pointerState.lastTimeCaptured) / 1000
                // v is mm/s
                const v = Math.sqrt(Math.pow(pointer.x - pointerState.lastX, 2) + Math.pow(pointer.y - pointerState.lastY, 2)) / dt
                if (v < lowv) {
                    denom = 2 * Math.PI * dt * lowCutOffFreq
                } else if (v > highv) {
                    denom = 2 * Math.PI * dt * highCutOffFreq
                } else {
                    const freq = (v - lowv) / (highv - lowv) * (highCutOffFreq - lowCutOffFreq)
                    denom = 2 * Math.PI * dt * freq
                }
                const alpha = denom / (denom + 1)
                pointer.x = pointerState.lastX + alpha * (pointer.x - pointerState.lastX)
                pointer.y = pointerState.lastY + alpha * (pointer.y - pointerState.lastY)
                pointerState.lastX = pointer.x
                pointerState.lastY = pointer.y
                pointerState.lastTimeCaptured = pointer.details.time_captured
            }

            pointerState.lastSeen = new Date()

            // A pointer enters when the pointer first appears within the region
            if (!pointerState.within && pointer.hit) {
                pointerState.within = true
                this.emit('enter', pointer)
            }

            // A pointer leaves when the pointer already entered and then goes out of the region
            if (pointerState.within && !pointer.hit) {
                pointerState.within = false
                delete pointerState.hardenedButtons
                pointerState.downButtons = new Set()
                this.emit('leave', pointer)
            }

            // Only emit button events when the pionter is within the region or when we don't exclude events outside region
            // Expect buttons to be an array
            if ((pointer.hit || !this.excludeEventsOutsideRegion) && Array.isArray(pointer.details.buttons)) {
                // Emit the move event first
                if (pointer.hit || !this.excludeEventsOutsideRegion) {
                    // For now, a pointer is always moving if it's inside
                    this.emit('move', pointer)
                }
                // Emit pointer down and up events only when the pointerState has record of any buttons
                // otherwise just set it to the buttons field
                if (!pointerState.hardenedButtons) {
                    pointerState.hardenedButtons = new Set(pointer.details.buttons)
                } else {
                    const hardenedButtons = new Set(pointer.details.buttons)

                    // If any of the previously hardenedButtons is not currently hardened, emit a up event
                    for (let b of pointerState.hardenedButtons) {
                        if (!hardenedButtons.has(b)) {
                            pointerState.hardenedButtons.delete(b)
                            pointer.eventButton = b
                            this.emit('up', pointer)

                            // If the upbutton is previous downed, emit a click event
                            // Note that if a button is already hardened when enter the region,
                            // there will be no click event upon release, because the click didn't happen
                            // within the region.
                            if (pointerState.downButtons.has(b)) {
                                pointerState.downButtons.delete(b)
                                this.emit('click', pointer)
                            }
                        }
                    }

                    // A button is down when it is not hardened already
                    // If any of the currently hardenedButtons was not previously hardened, emit a down event
                    for (let b of hardenedButtons) {
                        if (!pointerState.hardenedButtons.has(b)) {
                            pointerState.hardenedButtons.add(b)
                            pointerState.downButtons.add(b)
                            pointer.eventButton = b
                            this.emit('down', pointer)
                        }
                    }
                }
            }
        }
    }

    /**
     * Subscribe to pointer-move events.
     * @param  {} handler
     */
    onPointerMove(handler) {
        this.on('move', handler)
    }

    /**
     * Subscribe to pointer-enter events.
     * @param  {} handler
     */
    onPointerEnter(handler) {
        this.on('enter', handler)
    }

    /**
     * Subscribe to pointer-leave events.
     * @param  {} handler
     */
    onPointerLeave(handler) {
        this.on('leave', handler)
    }

    /**
     * Subscribe to pointer-down events.
     * @param  {} handler
     */
    onPointerDown(handler) {
        this.on('down', handler)
    }

    /**
     * Subscribe to pointer-up events.
     * @param  {} handler
     */
    onPointerUp(handler) {
        this.on('up', handler)
    }

    /**
     * Subscribe to pointer-click events.
     * @param  {} handler
     */
    onPointerClick(handler) {
        this.on('click', handler)
    }

    /**
     * Subscribe to pointer-attach events.
     * @param  {} handler
     */
    onPointerAttach(handler) {
        this.on('attach', handler)
    }

    /**
     * Subscribe to pointer-detach events.
     * @param  {} handler
     */
    onPointerDetach(handler) {
        this.on('detach', handler)
    }
}

module.exports = Hotspot
