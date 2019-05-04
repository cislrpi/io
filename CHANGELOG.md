# Changelog

### v3.0.4
* Fix loading of default variables for MongoDB and Redis modules
* Fix onQueueDeleted and onQueueCreated functions to match 2.x function signature

### v3.0.3
* Drop usage of deprecated `new Buffer` for `Buffer.from` in RabbitMQ module

### v3.0.2
* Fix loading celio plugins that don't have a config variable

### v3.0.1
* Fix redis component not loading properly
* Re-add call and doCall methods for dealing with RPC queues in RabbitMQ

### v3.0.0
* Complete restructure of CelIO module
