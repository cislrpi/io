<h1 class="title"> CELIO </h1>
<h2 class="site-subtitle">A framework for building distributed, multimodal applications</h2>

# [Full API Documentation](https://pages.github.ibm.com/celio/CELIO/CELIO.html)

# Example
```js
var CELIO = require('celio');
var io = new CELIO();
io.transcript.onFinal(function(msg, headers) {
    // Do your thing here
    var sentence = msg.result.alternatives[0].transcript;
    if (sentence.indexOf('hello') > -1) {
      io.speaker.speak('world');
    }
});
```

# Installation
The first time you use this package on a machine, you need to configure your npm to use our private registry. 
```
npm config set registry https://cel-npm-registry.mybluemix.net/
npm login
# username is cel
# password is npmregistry
```

After configuration, do:
```
npm install celio
```

# Usage
## Rabbitmq and redis configuration
You need to have a cog.json file in your program directory, with the following fields:
```json
{
  "mq": {
    "url": "rabbitmq host",
    "username": "username",
    "password": "password",
    "exchange": "optional"
  },
  "store": {
    "url": "redis host",
    "username": "optional",
    "password": "optional"
  }
}
```
This configuration object has username and password in it, 
so please don't share it with others and don't commit it to your repository.
Your applications can only communicate with each other if they use the same configuration.

To use it in nodejs:
```js
var CELIO = require('celio');
var io = new CELIO();
```

To use it in the browser with webpack or browserify:
```js
var CELIO = require('celio/lib/client');
var config = require('path/to/cog.json');

var io = new CELIO(config);
```


# Overview

## Publish and Subscribe
The following functions are provided to publish and subscribe messages.
### Publish
```js
io.publishTopic(topic, content, options);
```
### Subscribe
```js
io.onTopic(topic, function(content, headers){
  // handle messages
  var msg = JSON.parse(content.toString());
});
```
In `publishTopic`, you can use options to specify a header for the message.
See [amqp.node](http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish) for how to use the header.

The topic should have the following format `subType.minorType.majorType`.
Our convention is to use the topic to declare the message type, and the type should be from more specific to less specific, 
e.g., `close.final.transcript` and `wand.absolute.pointing`.

To subscribe events, you can include in topic name wildcards `*` and `#`.
`*` substitues one word, and `#` substitues multiple words.
For example, `*.absolute.pointing` subscribes to `wand.absolute.pointing` and `lighthouse.absolute.pointing`,
whereas `#.pointing` also subscribes to them plus other pointing events like `mouse.relative.pointing`.

In `publishTopic`, the content can be of type string, Buffer, or Array. We recommand that you use JSON strings.

## Remote procedural call (RPC)
RPC is different from pub-sub.
While pub-sub is good for event broadcasting and subscription,
it isn't suited for request-reply patterns such as geting the webpages shown on monitor.
For request-reply, we implemented [`io.call`](https://pages.github.ibm.com/celio/CELIO/CELIO.html#call) for sending a request,
and [`io.doCall`](https://pages.github.ibm.com/celio/CELIO/CELIO.html#doCall) for responding to a request.
Please check the API documentation to see their usage.

## [Display](https://github.ibm.com/celio/CELIO/blob/master/docs/Display.md)

## [Transcript](https://pages.github.ibm.com/celio/CELIO/Transcript.html)

## [Speaker](https://pages.github.ibm.com/celio/CELIO/Speaker.html)

## [Store](https://pages.github.ibm.com/celio/CELIO/Store.html)

## Config
The `cog.json` file is parsed and saved as a `io.config` object, so that you can query any configurations with the following function:
```js
io.config.get('rootKey:nestedKey');
```
The config object also reads in command line arguments and environment variables.
For environment variables, replace ":" with "_". 
You can use command line arguments to override settings in the cog.json file to temporarily switch exchanges for example.

We use the [nconf](https://github.com/indexzero/nconf) to do this.
For more information about the config object, you can read the nconf documentation. 

## [Setting up a CELIO server](https://github.ibm.com/celio/CELIO/blob/master/docs/CELIO%20central%20server%20setup.md)