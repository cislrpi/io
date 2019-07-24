<div style="text-align:center"><img src="img/moon.svg" style="width: 200px" /></div>

# @cisl/io

A framework for building distributed applications and the coolest of Jupiter's moons.

## Installation
```bash
npm install @cisl/io
```

## Usage
NodeJS
```js
const io = require('@cisl/io').io;
// or
const Io = require('@cisl/io').Io;
const io = new Io();
```

TypeScript:
```typescript
import { io, Io } from '@cisl/io';
const otherIo = new Io();
```

### Configuration

The `cog.json` file is parsed and saved as a `io.config` object, so that you can query any configurations with the following function:
```js
io.config.get('rootKey:nestedKey');
```
The config object also reads in command line arguments and environment variables.
For environment variables, replace ":" with "_". 
You can use command line arguments to override settings in the cog.json file to temporarily switch exchanges for example.

We use the [nconf](https://github.com/indexzero/nconf) to do this.
For more information about the config object, you can read the nconf documentation.

### RabbitMQ
RabbitMQ requires the `mq` value to be set, where `true` will use the defaults below. Any field not set will use these defaults:
```json
{
  "mq": {
    "url": "localhost",
    "username": "guest",
    "password": "guest",
    "exchange": "amq.topic",
    "ca": null
  }
}
```
This configuration object has username and password in it, 
so please don't share it with others and don't commit it to your repository.
Your applications can only communicate with each other if they use the same configuration.

You can access the RabbitMQ CelIO object by using `io.mq`.

#### Usage
```typescript
type PublishCallback = (content: Buffer | any, message: amqplib.ConsumeMessage) => void;

type ReplyCallback = (content: Error | Buffer | any) => void;
type RpcReplyCallback = (content: Buffer | any, reply: ReplyCallback, message: amqplib.ConsumeMessage) => void;

interface RpcResponse {
  content: Buffer | any;
  message: amqplib.ConsumeMessage;
}

// Publish to a RabbitMQ topic on the configured exchange
io.mq.publishTopic(topic: string, content: Buffer | any, options: amqplib.Options.Publish = {}): void

// Listen to a topic for any new content
io.mq.onTopic(topic: string, handler: PublishCallback, exchange?: string): Promise<any>

// Publish to a RPC queue, expecting a callback through the promise
io.mq.publishRpc(queue: string, content: Buffer | string, options: amqplib.Options.Publish = {}): Promise<RpcResponse>

// Listen on a RPC queue, sending content back through handler
io.mq.onRpc(queue: string, handler: RpcReplyCallback, exclusive: boolean = true): void

// Get a list of all queues
io.mq.getQueues(): Promise<any>

// Listen for any queue creations
io.mq.onQueueCreated(handler: (properties: amqplib.MessageProperties) => void): void
// Listen for any queue deletions
io.mq.onQueueDeleted(handler: (properties: amqplib.MessageProperties) => void): void
```

For `publishTopic` and `publishRpc`, see 
[amqplib](http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish) for acceptable
values for the `options` argument.

#### Content-Type
For publishing content, if a content-type is not specified and the content is not a `Buffer`, then
`Io` will assume that it can be run through `JSON.stringify` and will set the content-type to
`application/json` automatically. On receving content, if the content-type is set to `application/json`,
then `Io` will automatically run `JSON.parse` and return that content, else it will return the `Buffer`
object for the user to manually deal with.

#### Queue Names
When subscribing to events, you can include in topic name wildcards `*` and `#`.
`*` substitues one word, and `#` substitues multiple words. For example, `transcript.result.*`
subscribes to `transcript.result.final` and `transcript.result.interim`, whereas `transcript.#` subscribes
to `transcript.result.final`, `transcript.result.interim`, and `transcript.command`.

### Redis
```json
{
  "store": {
    "url": "redis://localhost:6379"
  }
}
```
Note: If you specify a URL without a port, the default port of `6379` is appended
Note: If you specify a URL without `redis://`, it is added as a prefix

#### Usage
```typescript
io.store.database: string | number;
io.store.client: redis.RedisClient;
io.store.hsetAsync(key: string, field: string, value: any): Promise<number>;
io.store.hgetallAsync(key: string): Promise<any>;
io.store.hgetAsync(key: string, field: string): Promise<any>;
io.store.hdelAsync(key: string, field: string): Promise<number>;
io.store.saddAsync(key: string, values: string[]): Promise<number>;
io.store.smembersAsync(key: string): Promise<string[]>;
io.store.sremAsync(key: string, value: any): Promise<number>;
io.store.getsetAsync(key: string, value: any): Promise<any>;
io.store.getAsync(key: string): Promise<any | null>;
io.store.delAsync(key: string): Promise<any>;
```
### Mongo
```json
{
  "mongo": {
    "host": "localhost",
    "port": 27017,
    "dbname": "cais"
  }
}
```

#### Usage
```typescript
io.mongo.mongoose: mongoose.Mongoose;
```

## License
[MIT License](LICENSE)

## Icon Attribution
[Moon](https://thenounproject.com/search/?q=moon&i=139166) by MarkieAnn Packer from the Noun Project
