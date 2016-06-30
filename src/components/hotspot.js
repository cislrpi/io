const Three = require('three');

module.exports = class Hotspot {
    constructor(region, io) {
        // Construct a rectangle for hit test
        this.setRegion(region);
        this.io = io;
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
                const within = x >= 0 && x <= this.width && y >=0 && y <= this.height;
                const distanceAlongNormal = this.plane.distanceToPoint(loc);
                return { x, y, within, distanceAlongRay, distanceAlongNormal,
                    details: pointer };
            }
        }
        return null;
    }

    on(handler) {
        this.io.onTopic('*.absolute.pointing', msg => {
            const pointers = JSON.parse(msg.content.toString());

            if (Array.isArray(pointers)) {
                for (let pointer of pointers) {
                    handler(this._intersect(pointer));
                }
            } else {
                handler(this._intersect(pointer));
            }
        });
        // TODO: Handle relative pointing devices like mice
    }
}
