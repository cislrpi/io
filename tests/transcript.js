const CELIO = require('../src/index.js');

const io = new CELIO();

const transcript = io.getTranscript();

transcript.onFinal(msg=>console.log(msg));

