# CELIO - Cognitive Environment Library for I/O
<!-- TOC depthFrom:2 depthTo:4 insertAnchor:false orderedList:false updateOnSave:true withLinks:true -->

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
		- [getActiveAppContext](#getactiveappcontext)
		- [createWindow](#createwindow)
		- [getGrid](#getgrid)
		- [addToGrid(label, bounds, backgroundStyle)](#addtogridlabel-bounds-backgroundstyle)
		- [setCellStyle(label, js_css_style, animation)](#setcellstylelabel-jscssstyle-animation)
		- [setFontSize("pixels")](#setfontsizepixels)
		- [createViewObject](#createviewobject)
	- [ViewObject API](#viewobject-api)
	- [TODO](#todo)
- [RPC](#rpc)
	- [io.call(queue, content, options)](#iocallqueue-content-options)
	- [doCall(queue, handler, noAck=true, exclusive=true)](#docallqueue-handler-noacktrue-exclusivetrue)
- [Setting up a rabbitmq server](#setting-up-a-rabbitmq-server)

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

You can also interrupt the speaker by calling `stop`.

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
All functions return a promise unless specified.

#### getScreens
returns an array of screen details. A screen corresponds to a display worker. A screen can be composed of multiple monitors. The screen's bound box is the maximum rectangular region that fits across its multiple monitors.


```javascript
display.getScreens()

/* // output
[
  {
    "screenName": "front",
    "bounds": {
      "x": 0,
      "y": 0,
      "right": 1920,
      "bottom": 1200,
      "width": 1920,
      "height": 1200
    },
    "details": [
      {
        "id": 2077751741,
        "bounds": {
          "x": 0,
          "y": 0,
          "width": 1920,
          "height": 1200
        },
        "workArea": {
          "x": 0,
          "y": 23,
          "width": 1920,
          "height": 1173
        },
        "size": {
          "width": 1920,
          "height": 1200
        },
        "workAreaSize": {
          "width": 1920,
          "height": 1173
        },
        "scaleFactor": 2,
        "rotation": 0,
        "touchSupport": "unknown"
      }
    ]
  }
]
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

#### hideAppContext
hides an application context

 ```javascript
display.hideAppContext("context_name")
```

#### getActiveAppContext
returns active application context

 ```javascript
display.getActiveAppContext()

```

#### getAllContexts
returns an array of app contexts

 ```javascript
display.getAllContexts()

```


#### createWindow
creates a display window

 ```javascript
display.createWindow({
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
      } ).then( m => { win_obj = m })

```

#### getWindowById 
retrieves window object using id. Id is an integer. (Not a promise return)

```javascript
    display.getWindowById( 5 )
```


#### getAllWindowIds
returns an array of window ids. (Not a promise return)


#### getAllWindowIdsByContext(context)
returns an array of window ids beloging to a context. (Not a promise return)


#### getViewObjectById
retrieves view object using id. Id is an uuid string. (Not a promise return)

```javascript
    display.getViewObjectById( "uuid-string" )
```

#### getAllViewObjectIds
return all view object ids. (Not a promise return)

#### getAllViewObjectIdsByWindowId( window_id )
returns an array of viewobject ids in a display window. (Not a promise return)

#### closeAllWindows
closes all windows of the display



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

```javascript
win_obj.getGrid()

/*
{ '1|1': 
   { height: 240,
     rh: 250,
     rw: 334,
     rx: 0,
     ry: 0,
     width: 324,
     x: 5,
     y: 5 },
  '1|2': 
   { height: 240,
     rh: 250,
     rw: 334,
     rx: 334,
     ry: 0,
     width: 324,
     x: 339,
     y: 5 },
  '1|3': 
   { height: 240,
     rh: 250,
     rw: 334,
     rx: 668,
     ry: 0,
     width: 324,
     x: 673,
     y: 5 },
  '2|1': 
   { height: 240,
     rh: 250,
     rw: 334,
     rx: 0,
     ry: 250,
     width: 324,
     x: 5,
     y: 255 },
  '2|2': 
   { height: 240,
     rh: 250,
     rw: 334,
     rx: 334,
     ry: 250,
     width: 324,
     x: 339,
     y: 255 },
  '2|3': 
   { height: 240,
     rh: 250,
     rw: 334,
     rx: 668,
     ry: 250,
     width: 324,
     x: 673,
     y: 255 },
  center: { height: 250, width: 500, x: 250, y: 125 },
  fullscreen: { height: 500, width: 1000, x: 0, y: 0 } }
*/

```

####  addToGrid(label, bounds, backgroundStyle)

add a custom area to the grid

```javascript

win_obj.addToGrid("left-pane", {
        left : "200px",
        top : "300px",
        width : "500px",
        height : "500px"
    }, {
        background : "black",
        borderTop : "2px solid white"
    })

```

#### setCellStyle(label, js_css_style, animation)

sets the grid background cell style

```javascript
    win_obj.setCellStyle("left-pane", { "background" : "green", "borderTop" : "5px solid orangered"  })

    // for uniform grid
    //win_obj.setCellStyle("<gridtop>|<gridleft>", { "background" : "green", "borderTop" : "5px solid orangered"  })
    win_obj.setCellStyle("1|2", { "background" : "green", "borderTop" : "5px solid orangered"  })
```


#### setFontSize("pixels")
sets the fontsize of the displayWindow

```javascript
 win_obj.setFontSize("380px")

```

#### createViewObject

creates a new viewObject in the displayWindow

```javascript
   win_obj.createViewObject({
            "url" : "http://nytimes.com",
            "left" : "1.0em",
            "top" : "0.0em",
            "width" : "3.0em",
            "height" : "3.0em",
            "nodeintegration" : true,
            "cssText":"body{border : 2px solid white; overflow:hidden;zoom:3.2;}"
   }).then( m => { view_obj = m })
```

### ViewObject API

- setBounds

```javascript
view_obj.setBounds({ 
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

- reload

```javascript
view_obj.reload()

```

- close

```javascript
view_obj.close()

```


- You can navigate the view object (webpage) history


Go back :

```javascript
view_obj.goBack()

```

Go Forward :

```javascript
view_obj.goForward()

```

- openDevTools()


- closeDevTools()

- setUrl("<url string>")

- setCSSStyle(<css_string>)

```javascript
    view_obj.setCSSStyle("body{ zoom : 2.0 }")

```


### TODO
- Emit events from DisplayWindow and ViewObject
- Add Sketching layer - tied to DisplayWindow and ViewObject
- Add background presence layer
- Distributed drawing using  d3.js and three.js

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