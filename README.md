# CELIO - Cognitive Environment Library for I/O
<!-- TOC depthFrom:2 depthTo:6 insertAnchor:false orderedList:false updateOnSave:true withLinks:true -->

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
- [Display](#display)
	- [Application Context](#application-context)
	- [Display Window](#display-window)
	- [View Object](#view-object)
	- [CELIO API](#celio-api)
		- [getDisplay](#getdisplay)
	- [DISPLAY API](#display-api)
		- [getScreens](#getscreens)
		- [setAppContext](#setappcontext)
		- [closeAppContext](#closeappcontext)
		- [createWindow](#createwindow)
		- [getGrid](#getgrid)

<!-- /TOC -->

## Setup
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
    "url": "rabbitmq host",
    "username": "username",
    "password": "password"
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
  messageId: "uuid string"
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

## Display
The Display object enables you to manipulate content of the displays

### Application Context
An application context is used to group brower windows related to the application. "default" is the default application context. So when you open url without setting application context, the window is added to the default application context. 

### Display Window 
Within an application context, you can open multiple display windows. The display window always occupies entire display screen and only one of the display window is shown and receives user interaction such as pointing. 

### View Object
Within a display window, you can open webpages as view objects.


###  CELIO API

#### getDisplay
returns display object

```javascript
var display = io.getDisplay();
```


### DISPLAY API


#### getScreens
returns an array of screen details 

```javascript
var screens = display.getScreens();
/*
[ { id: 2077751741,
    bounds: { x: 0, y: 0, width: 1920, height: 1200 },
    workArea: { x: 0, y: 23, width: 1920, height: 1173 },
    size: { width: 1920, height: 1200 },
    workAreaSize: { width: 1920, height: 1173 },
    scaleFactor: 2,
    rotation: 0,
    touchSupport: 'unknown' } ]
*/
```

#### setAppContext
opens or switches an application context

```javascript
display.setAppContext("context_name")

```
Setting a application context will automatically hide the display windows of other application context

#### closeAppContext
closes an application context

 ```javascript
display.closeAppContext("context_name")
```
Closing an application context will automatically close all display windows


#### getActiveContext
returns active application context

 ```javascript
display.getActiveContext()

```


#### createWindow
creates a display window

 ```javascript
let win_obj = display.createWindow({
          "screenName" : "front",
          "appContext" : "default",
          "x" : screens[0].workArea.x,
          "y" : screens[0].workArea.y,
          "width"  : screens[0].workArea.width,
          "height" : screens[0].workArea.height,
          "contentGrid" : {
              "row" : 2,
              "col" : 3,
              "padding" : 5
          },
          "gridBackground" : {
              "1|1" : "white",
              "1|2" : "grey",
              "1|3" : "white",
              "2|1" : "grey",
              "2|2" : "white",
              "2|3" : "grey"
          }
      } )

```

#### getWindowById
retrieves window object using id. Id is an integer

```javascript
    display.getWindowById( 5 )
```


#### getViewObjectById
retrieves view object using id. Id is an uuid string

```javascript
    display.getViewObjectById( "uuid-string" )
```


### DisplayWindow API

#### id
return the DisplayWindow id


#### show, hide and close
- show, hide and close a display window using its id + screenName combination

 ```javascript
var res = win_obj.hide()
var res = win_obj.show()
var res = win_obj.close()

// res = {"status" : "success"} or { "error" : "error details" }
```


#### getGrid
return the grid details


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

### TODO
- Introduce object notation for DisplayWindow and ViewObject
- Emit events from DisplayWindow and ViewObject
- Add Sketching layer - tied to DisplayWindow and ViewObject
- Add background presence layer
- Distributed drawing using  d3.js and three.js

## RPC
### io.call(queue, content, options)
*queue* is the queue name, *content* is the RPC parameter.
This funciton returns a promise that contains the result or error of the RPC.

### doCall(queue, handler, noAck=true, exclusive=true)
Again, *queue* is the queue name, handler is a callback function that handles the RPC call.
The handler can return a string, a Buffer, an ArrayBuffer, an Array, or an array-like object.
We recommand that you use JSON strings.
If the handler returns an Error object, it will trigger an exception in the caller site.