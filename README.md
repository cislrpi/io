# CELIO - Cognitive Environment Library for I/O
<!-- TOC depthFrom:2 depthTo:6 insertAnchor:false orderedList:false updateOnSave:true withLinks:true -->

- [Intro](#intro)
- [Transcript](#transcript)
- [Speaker](#speaker)

<!-- /TOC -->

## Intro
To install this package:
```
npm install git+ssh://github.ibm.com/celio/CELIO.git
```

To use it in nodejs:
```javascript
var CELIO = require('celio');
var io = new CELIO();
```

For now, you also need to have a cog.json file in your package directory, with at least the following fields:
```json
{
  "rabbitMQ": {
    "url": "rabbitmq url",
    "exchange": "exchange name"
  }
}
```
The Rabbit url has username and password in it, so please don't share it with others and don't commit it to your repository.

With the io object, you can publish and subscribe to raw messages with the following functions:
```javascript
io.publishTopic(topic, msg);
io.onTopic(topic, function(msg){
  // handle messages
  var content = JSON.parse(msg.content.toString());
});
```
The topic should have the following format subType.minorType.majorType.
Our convention is to use the topic to declare the message type, and the type should be from more specific to less specific.
For command messages, we always have the 'command' as the last component of the topic tag. e.g., stop.speaker.command.
For other events, we have something like closeMic.final.transcript or wand.absolute.pointing.

To subscribe events, the topic can include wildcards `*` and `#`. `*` substitues one word, `#` substitues multiple words.
For example, `*.absolute.pointing` subscribes to wand.absolute.pointing and lighthouse.absolute.pointing, whereas `#.pointing` also subscribes to them plus other pointing events like mouse.relative.pointing.

In `onTopic`, the message is in RabbitMQ format and the content is contained in the content field. You need to do JSON parsing yourself.
In `publishTopic`, you can publish any type of messages, but we recommand using JSON strings.

## Transcript
The transcript object has three functions for subscribing to transcripts: `onFinal`, `onInterim`, `onAll`.
`onFinal` subscribes to only the full sentences.
`onInterim` subscribes to only the interim results.
`onAll` subscribes to both.
```javascript
var transcript = io.getTranscript();
transcript.onFinal(function(msg) {
    // Do your thing here
    var sentence = msg.result.alternatives[0].transcript;
});
```
The transcript object has at least the following fields:
```javascript
{
  channel: "channel_id",
  result: {
    alternatives: [{transcript: "message", confidence: 0.9}],
    final: true,
    keyword_result: {}
  },
  time_captured: 1467301438287 //unix_time_in_ms
}
```
The result field follows the definition of Watson STT.
The full specification can be seen on [Watson STT website](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/speech-to-text/output.shtml).

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

If you want to subscribe to speaking events, you can use `onBeingSpeak` and `onEndSpeak`.