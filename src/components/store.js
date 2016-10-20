const redis = require('redis');
const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

module.exports = class Store {

    constructor ( options ){
        this.client = redis.createClient( options )
    }

    addToHash( key , field, value){ 
        this.client.hset(key, field, value)
    }

    getHash ( key ) {
        return this.client.hgetallAsync( key )
    }

    removeFromHash( key, field ){
        return this.client.hdel( key, field )
    }

    addToSet( key , value){
        this.client.sadd( key, value )
    }

    getSet (key ) {
        return this.client.smembersAsync(key)
    }

    removeFromSet ( key, val ){
        this.client.srem( key, val )
    }

    setState( key , value) {
        this.client.set(key, value)
    }

    getState( key ){
        return this.client.getAsync(key)
    }

    delState( key ) {
        this.client.del(key)
    }

    getRedisClient() {
        return this.client
    }

}