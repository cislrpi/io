CelIO
=====

A framework for building distributed, multimodal applications

## Installation
```bash
npm install @cisl/celio
```

## Usage
```js
var CelIO = require('@cisl/celio');
var io = new CelIO();
io.mq.onTopic('topic.name', (msg) => {
  console.log(msg);
});
io.mq.publishTopic('topic.name', msg);
```

### Config

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
You need to have a cog.json file in your program directory, with the following fields:
```json
{
  "mq": {
    "url": "rabbitmq host",
    "username": "username",
    "password": "password",
    "exchange": "optional",
    "ca": "optional. If you use SSL connection, use this to specify where the certificate file is."
  }
}
```
This configuration object has username and password in it, 
so please don't share it with others and don't commit it to your repository.
Your applications can only communicate with each other if they use the same configuration.

You can access the RabbitMQ CelIO object by doing `io.mq`.

#### Usage
Publish:
```js
io.mq.publishTopic(topic, content, options);
```
Subscribe:
```js
io.mq.onTopic(topic, function(content, headers){
  // handle message
});
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

In `publishTopic`, the content can be of type string, Buffer, or Array. If the system detects an object,
it will attempt to run `JSON.stringify` on it before sending it to RabbitMQ.

In `onTopic`, we first attempt to `JSON.parse` the incoming message and return that to the user if possible,
else we just return the message as is.

#### Remote procedural call (RPC)
RPC is different from pub-sub.
While pub-sub is good for event broadcasting and subscription,
it isn't suited for request-reply patterns such as geting the webpages shown on monitor.
For request-reply, we implemented [`io.mq.call`](https://pages.github.ibm.com/celio/CELIO/CELIO.html#call) for sending a request,
and [`io.mq.doCall`](https://pages.github.ibm.com/celio/CELIO/CELIO.html#doCall) for responding to a request.
Please check the API documentation to see their usage.

### Redis
```json
{
  "store": {
    "url": "localhost",
    "username": "username",
    "password": "password"
  }
}
```
