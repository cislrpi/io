const redis = require('redis');
const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

module.exports = class Store {

    constructor ( options ){
        if (options.url) {
            options.url = 'redis://'+options.url
        } 
        this.client = redis.createClient( options )
    }

    addToHash( key , field, value){
        return this.client.hsetAsync(key, field, value)
    }

    getHash ( key ) {
        return this.client.hgetallAsync( key ).then(r=>{if (r==null) return {}})
    }

    getHashField( key, field ){
        return this.client.hgetAsync(key, field)
    }

    removeFromHash( key, field ){
        return this.client.hdelAsync( key, field )
    }

    addToSet( key , value){
        return this.client.saddAsync( key, value )
    }

    getSet (key ) {
        return this.client.smembersAsync(key)
    }

    removeFromSet ( key, val ){
        return this.client.sremAsync( key, val )
    }

    setState( key , value) {
        return this.client.setAsync(key, value)
    }

    getState( key ){
        return this.client.getAsync(key)
    }

    delState( key ) {
        return this.client.delAsync(key)
    }

    getRedisClient() {
        return this.client
    }
}