<div style="text-align:center"><img src="img/moon.svg" style="width: 200px" /></div>

# @cisl/io

A framework for building distributed applications and the coolest of Jupiter's moons. What the heck

## Installation
```bash
npm install @cisl/celio
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
type FieldsAndProperties = amqplib.ConsumeMessageFields & amqplib.MessageProperties;

type OnTopicCallback = (content: Buffer, headers: FieldsAndProperties, msg: amqplib.ConsumeMessage) => void;
type OnTopicStringCallback = (content: string, headers: FieldsAndProperties, msg: amqplib.ConsumeMessage) => void;
type OnTopicJsonCallback = (content: any, headers: FieldsAndProperties, msg: amqplib.ConsumeMessage) => void;

type ReplyCallback = (content: Buffer) => void;
type ReplyStringCallback = (content: string) => void;
type ReplyJsonCallback = (content: any) => void;

type DoCallCallback = (content: Buffer, headers: FieldsAndProperties, reply: ReplyCallback, msg: amqplib.ConsumeMessage) => void;
type DoCallStringCallback = (content: string, headers: FieldsAndProperties, reply: ReplyStringCallback, msg: amqplib.ConsumeMessage) => void;
type DoCallJsonCallback = (content: any, headers: FieldsAndProperties, reply: ReplyJsonCallback, msg: amqplib.ConsumeMessage) => void;

// Publish to a RabbitMQ topic on the configured exchange
io.mq.publishTopic(topic: string, content: Buffer | string, options?: any): void
// Puglish to a RabbitMQ topic on the configured exchange. Any content is run through JSON.stringify.
io.mq.publishTopicJson(topic: string, content: any, options: any): void

// Listen to a topic for any new content, returned as Buffer
io.mq.onTopic(topic: string, handler: OnTopicCallback, options: any = {}): Promise<any>
// Listen to a topic for any new content, returned as a string
io.mq.onTopicString(topic: string, handler: OnTopicStringCallback, options: any = {}): Promise<any>
// Listen to a topic for any new content, returned as a JSON object
io.mq.onTopicJson(topic: string, handler: OnTopicJsonCallback, options: any = {}): Promise<any>

// Publish to a RPC queue, expecting a callback through the promise
io.mq.publishRpc(queue: string, content: Buffer | string, options: any = {}): Promise<any>
// Publish to a RPC queue, expecting a callback through the promise. The content is run through JSON.stringify
io.mq.publishRpcJson(queue: string, content: any, options: any = {}): Promise<any>

// Listen on a RPC queue, sending Buffer content back through handler
io.mq.onRpc(queue: string, handler: DoCallCallback, exclusive: boolean = true): void
// Listen on a RPC queue, sending string content back through handler
io.mq.onRpcString(queue: string, handler: DoCallStringCallback, exclusive: boolean = true): void
// Listen on a RPC queue, sending JSON.parsed content back through handler
io.mq.onRpcJson(queue: string, handler: DoCallJsonCallback, exclusive: boolean = true): void

// Get a list of all queues
io.mq.getQueues(): Promise<any>

// Listen for any queue creations
io.mq.onQueueCreated(handler: (headers: amqplib.MessagePropertyHeaders, fields: FieldsAndProperties) => void): void
// Listen for any queue deletions
io.mq.onQueueDeleted(handler: (headers: amqplib.MessagePropertyHeaders, fields: FieldsAndProperties) => void): void
```

In `publishTopic`, you can use options to specify a header for the message.
See [amqp.node](http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish) for how to use the header.

The topic should have the following format `major_type.minor_type.command` or `major_type.command`.
An example of this is `transcript.result.final` and `transcript.command`, where the fisrt part
designates the module (transcript), and then the next part indicates what it's doing.

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