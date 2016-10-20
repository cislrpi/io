const redis = require('redis');
const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

module.exports = class StateMachine {

    constructor ( options ){
        this.persist = redis.createClient( options )
    }

    // persistence accessor

    addToHash( key , field, value){ 
        this.persist.hset(key, field, value)
    }

    getHash ( key ) {
        return this.persist.hgetallAsync( key )
    }

    removeFromHash( key, field ){
        return this.persist.hdel( key, field )
    }

    addToSet( key , value){
        this.persist.sadd( key, value )
    }

    getSet (key ) {
        return this.persist.smembersAsync(key)
    }

    removeFromSet ( key, val ){
        this.persist.srem( key, val )
    }

    setState( key , value) {
        this.persist.set(key, value)
    }

    getState( key ){
        return this.persist.getAsync(key)
    }

    delState( key ) {
        this.persist.del(key)
    }

    getPersistence() {
        return this.persist
    }

}