# CELIO

To install this package:
```
npm install git+ssh://github.ibm.com/celio/CELIO.git
```

To use it in nodejs:
```
var CELIO = require('celio');
var io = new CELIO();
```

CELIO has several components.

## Transcript
The transcript object has three functions for subscribing to transcripts: `onFinal`, `onInterim`, `onAll`.
```
var transcript = io.getTranscript();
transcript.onFinal(function(msg) => {
    // Do your thing here
    var sentence = msg.result.alternatives[0].transcript;
});
```
The transcript object has at least the following fields:
```
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

