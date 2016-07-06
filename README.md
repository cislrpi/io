# CELIO - Cognitive Environment Library for I/O
<!-- TOC depthFrom:2 depthTo:6 insertAnchor:false orderedList:false updateOnSave:true withLinks:true -->

- [Intro](#intro)
- [Config](#config)
- [Transcript](#transcript)
- [Speaker](#speaker)
- [Display](#display)

<!-- /TOC -->

## Intro
To install this package:
```
npm install git+ssh://github.ibm.com/celio/CELIO.git
```

To use it in nodejs:
```js
var CELIO = require('celio');
var io = new CELIO();
```

For now, you need to have a cog.json file in your package directory, with the following fields:
```json
{
  "display": { "host" : "localhost" , "port" : 8081},
  "mq": {
    "url": "rabbitmq host",
    "username": "username",
    "password": "password",
    "exchange": "exchange"
  }
}
```
You don't need the `mq` configuration if you're just posting a webpage. For all other stuff, you need the `mq` configuration.
This configuration object has username and password in it, so please don't share it with others and don't commit it to your repository.
Your applications can only communicate with each other if they use the same exchange.

With the io object, you can publish and subscribe to raw messages with the following functions:
```js
io.publishTopic(topic, msg, options);
io.onTopic(topic, function(msg){
  // handle messages
  var content = JSON.parse(msg.content.toString());
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

In `onTopic`, the message is in RabbitMQ format and the content is contained in the content field. You need to do JSON parsing yourself.
In `publishTopic`, the message can be of type string, Buffer, ArrayBuffer, Array, or array-like objects. We recommand that you use JSON strings.

## Config
The `cog.json` file is parsed and saved as a `io.config` object, so that you can query any configurations with the following function:
```js
io.config.get('rootKey:nestedKey');
```
The config object also reads in command line arguments and environment variables.
You can use command line arguments to override settings in the cog.json file to temporarily switch exchanges for example.

We use the [nconf](https://github.com/indexzero/nconf) to do this.
For more information about the config object, you can read the nconf documentation. 

## Transcript
The transcript object has three functions for subscribing to transcripts: `onFinal`, `onInterim`, `onAll`.
`onFinal` subscribes to only the full sentences.
`onInterim` subscribes to only the interim results.
`onAll` subscribes to both.
```javascript
var transcript = io.getTranscript();
transcript.onFinal(function(msg, fields, properties) {
    // Do your thing here
    var sentence = msg.result.alternatives[0].transcript;
});
``` 
The `msg` object has at least the following fields:
```javascript
{
  channel: "channel_id(optional)",
  speaker: "speaker name(optional)",
  result: {
    alternatives: [{transcript: "message", confidence: 0.9}],
    final: true,
    keyword_result: {}
  }
}
```
The result field follows the definition of Watson STT.
The full specification can be seen on [Watson STT website](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/speech-to-text/output.shtml).

`fields` and `properties` contain message header content such as routing key and message id.

Transcript also has a function for switching language models.
```
transcript.switchModel('m_and_a');
``` 
Make sure that your transcript worker accepts the specified language model name.

## Speaker
The Speaker object allows you to pass text to Text-to-Speech worker to speak.
```javascript
var speaker = io.getSpeaker();
speaker.speak('Hi you');
```
Optionally, you can specify TTS voices as the second parameter to the function, e.g., `speaker.speak('Hi', 'en-US_AllisonVoice')`.
For a full list of voice you can use, check [Watson TTS website](http://www.ibm.com/watson/developercloud/doc/text-to-speech/http.shtml#voices).
You can also use SSML. Again, check [Watson TTS website](http://www.ibm.com/watson/developercloud/doc/text-to-speech/http.shtml#input).

If you want to subscribe to speaking events, you can use `onBeginSpeak` and `onEndSpeak`.


## Display
The Display object enables you to manipulate content of the displays

```javascript
var display = io.getDisplay();
```

### Application Context
An application context is used to group brower windows related to the application. "default" is the default application context. So when you open url without setting application context, the window is added to the default application context. 

- You can open or switch an application context

```javascript
display.setAppContext("context_name")

```

Setting a application context will automatically hide the display windows of other application context
- You can close an application context

 ```javascript
display.closeAppContext("context_name")
```

Closing an application context will automatically close all display windows

- You can get active application context

 ```javascript
display.getActiveContext()

```

### Display Window 
Within an application context, you can open multiple display windows. The display window always occupies entire display screen and only one of the display window is shown and receives user interaction such as pointing. 
- You can create a display window

 ```javascript
// context is optionally. if it is not specified the window is created under activeApplicationContext
let win_obj = display.createWindow({ context : "context_name" } )

// win_obj = { "window_id" : 1, "screenName": "front", "status" : "success"}  or { "error" : "error details" }
```

- You can show, hide and close a display window using its id + screenName combination

 ```javascript
// context is optionally. if it is not specified the window is created under activeApplicationContext
var res = display.hideWindow({ context : "context_name", screenName : win_obj.screenName , window_id : win_obj.window_id })
var res = display.showWindow({ context : "context_name", screenName : win_obj.screenName , window_id : win_obj.window_id })
var res = display.closeWindow({ context : "context_name", screenName : win_obj.screenName , window_id : win_obj.window_id })

// res = {"status" : "success"} or { "error" : "error details" }
```

### View Object
Within a display window, you can open webpages as view objects.

- You can open a url directly without opening a display window or even setting an application context. It opens on current display window under the active application context.
 ```javascript
// context is optionally. if it is not specified the window is created under activeApplicationContext
let view_obj = display.open({ 
    "screenName" : "front",
    "url" : "https://www.microsoft.com/en-us/",
    "left" : "1100px",
    "top" : "10px",
    "width" : 1000,
    "height" : 1000
} )

// view_obj = { "view_id" : "uuid...",   "window_id" : 1, "screenName": "front", "status" : "success"}  or { "error" : "error details" }
```

- You can also specify exact display window and application context
```javascript
// context is optionally. if it is not specified the window is created under activeApplicationContext
let view_obj = display.open({ 
    "screenName" : "front",
    "context" : "context_name",
    "window_id" : win_obj.window_id,
    "url" : "https://www.microsoft.com/en-us/",
    "left" : "1100px",
    "top" : "10px",
    "width" : 1000,
    "height" : 1000
} )

// view_obj = { "view_id" : "uuid...",   "window_id" : 1, "screenName": "front", "status" : "success"}  or { "error" : "error details" }
```

- You can move the view object

```javascript
// context is optionally. if it is not specified the window is created under activeApplicationContext
display.setBounds({ 
    "screenName" : "front",
    "view_id" : view_obj.view_id,
    "top" : "10px",
    "left" : "10px",
    "width" : "850px",
    "height" : "400px",
    "animation_options" : { // based on web animation api specifications
        duration : 800,
        fill : 'forwards',
        easing : 'linear'
    }
} )

```

- You can reload the view object

```javascript
// context is optionally. if it is not specified the window is created under activeApplicationContext
display.reload({ 
    "screenName" : "front",
    "view_id" : view_obj.view_id
} )

```

- You can close the view object

```javascript
// context is optionally. if it is not specified the window is created under activeApplicationContext
display.close({ 
    "screenName" : "front",
    "view_id" : view_obj.view_id
} )

```


- You can navigate the view object (webpage) history


Go back :

```javascript
// context is optionally. if it is not specified the window is created under activeApplicationContext
display.goBack({ 
    "screenName" : "front",
    "view_id" : view_obj.view_id
} )

```

Go Forward :

```javascript
// context is optionally. if it is not specified the window is created under activeApplicationContext
display.goForward({ 
    "screenName" : "front",
    "view_id" : view_obj.view_id
} )

```