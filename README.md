# CELIO - Cognitive Environment Library for I/O
<!-- TOC depthFrom:1 depthTo:6 insertAnchor:false orderedList:false updateOnSave:true withLinks:true -->

- [CELIO - Cognitive Environment Library for I/O](#celio-cognitive-environment-library-for-io)
    - [Setup](#setup)
    - [Publish and Subscribe](#publish-and-subscribe)
        - [Publish](#publish)
        - [Subscribe](#subscribe)
    - [Config](#config)
    - [Transcript](#transcript)
        - [Switch model](#switch-model)
        - [Stop publishing](#stop-publishing)
        - [Add keywords](#add-keywords)
        - [Tag channel with speaker name](#tag-channel-with-speaker-name)
    - [Speaker](#speaker)
        - [volume control](#volume-control)
            - [speaker.reduceVolume(change)](#speakerreducevolumechange)
            - [speaker.increaseVolume(change)](#speakerincreasevolumechange)
    - [Display](doc/Display.md)
        - [Basics](doc/Display.md)
        - API Reference
		    - [`io.displayContext`](doc/displayfactory.md)
	       - [DisplayContext](doc/displaycontext.md)
	       - [Window](doc/window.md)
	       - [ViewObject](doc/viewobject.md)
   
<!-- /TOC -->

## Setup
This package is hosted on our private npm registry. Ask us for user name and password. To install it, do the following:
```
npm config set registry https://cel-npm-registry.mybluemix.net/
npm login
npm install celio
```

To use it in nodejs:
```js
var CELIO = require('celio');
var io = new CELIO();
```

For now, you need to have a cog.json file in your package directory, with the following fields:
```json
{
  "mq": {
    "url": "rabbitmq host",
    "username": "username",
    "password": "password"
  }
}
```

You don't need the `mq` configuration if you're just posting a webpage. For all other stuff, you need the `mq` configuration.
This configuration object has username and password in it, so please don't share it with others and don't commit it to your repository.
Your applications can only communicate with each other if they use the same exchange.

To use it in the browser with webpack or other compilers:
```js
var CELIO = require('celio/lib/client');
var io = new CELIO({
  "mq": {
    "url": "rabbitmq host",
    "username": "username",
    "password": "password"
  }
})
```

## Publish and Subscribe
With the io object, you can publish and subscribe to raw messages with the following functions:
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

The topic should have the following format subType.minorType.majorType.
Our convention is to use the topic to declare the message type, and the type should be from more specific to less specific.
For command messages, we always have the 'command' as the last component of the topic tag. e.g., stop.speaker.command.
For other events, we have something like closeMic.final.transcript or wand.absolute.pointing.

To subscribe events, the topic can include wildcards `*` and `#`. `*` substitues one word, `#` substitues multiple words.
For example, `*.absolute.pointing` subscribes to wand.absolute.pointing and lighthouse.absolute.pointing, whereas `#.pointing` also subscribes to them plus other pointing events like mouse.relative.pointing.

In `publishTopic`, the message can be of type string, Buffer, ArrayBuffer, Array, or array-like objects. We recommand that you use JSON strings.

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

## Transcript
The transcript object has three functions for subscribing to transcripts: `onFinal`, `onInterim`, `onAll`.
`onFinal` subscribes to only the full sentences.
`onInterim` subscribes to only the interim results.
`onAll` subscribes to both.
```js
var transcript = io.getTranscript();
transcript.onFinal(function(msg, headers) {
    // Do your thing here
    var sentence = msg.result.alternatives[0].transcript;
    // For the most part, you don't need fields and properties
});
``` 
The `msg` object has at least the following fields:
```js
{
  workerID: "id",
  channelIndex: num,
  speaker: "speaker name(optional)",
  result: {
    alternatives: [{transcript: "message", confidence: 0.9}],
    final: true,
    keyword_result: {}
  },
  messageID: "uuid string"
  time_captured: unix_time
}
```
The result field follows the definition of Watson STT.
The full specification can be seen on [Watson STT website](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/speech-to-text/output.shtml).

The transcript object supports a few other features:
### Switch model
```js
transcript.switchModel('model name');
```
### Stop publishing
```js
transcript.stopPublishing();
```
### Add keywords
```js
transcript.addKeywords(words) // words is an array of strings
```
### Tag channel with speaker name
```js
transcript.tagChannel(workerID, channelIndex, speaker_name);
```

## Speaker
The Speaker object allows you to pass text to Text-to-Speech worker to speak.
```javascript
var speaker = io.getSpeaker();
speaker.speak('Hi you');
```
Optionally, you can specify TTS voices in the second parameter to the function, e.g., `speaker.speak('Hi', {voice:'en-US_AllisonVoice'})`.
For a full list of voice you can use, check [Watson TTS website](http://www.ibm.com/watson/developercloud/doc/text-to-speech/http.shtml#voices).
You can also use SSML. Again, check [Watson TTS website](http://www.ibm.com/watson/developercloud/doc/text-to-speech/http.shtml#input).

If you want to subscribe to speaking events, you can use `onBeginSpeak` and `onEndSpeak`. `onBeginSpeak` will give you the message that is spoken. 

You can also interrupt the speaker by calling `stop`.

### volume control
#### speaker.reduceVolume(change)
#### speaker.increaseVolume(change)
Volume is from 0 to 100.

## RPC
### io.call(queue, content, options)
*queue* is the queue name, *content* is the RPC parameter.
This funciton returns a promise that contains the result or error of the RPC.

### doCall(queue, handler, noAck=true, exclusive=true)
*handler* has the following sigature:
`handler(request, reply, ack)`.
*request* is an object with three fields *content*, *field*, *properties*. Use content to get the message sent by the client.
*reply* is a function. Use it to send a message back to the caller.
*ack* is the acknowledge function, and will only be provided if noAck is set to false. Normally you don't need this.

Again, *queue* is the queue name, handler is a callback function that handles the RPC call.
The *reply* function accepts a string, a Buffer, an ArrayBuffer, an Array, an array-like object, or an Error object.
We recommand that you use JSON strings.
If an Error object is used, it will trigger an exception in the caller site.

The *reply* function should only be called once.

## Setting up a rabbitmq server
Please follow the installation guide here:
https://www.rabbitmq.com/download.html