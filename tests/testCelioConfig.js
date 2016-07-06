const CELIO = require('../src/index.js');
const io = new CELIO();
console.log(io.config.get('sys'))
// bound to see a connection error due to fake rabbit mq url in cog.json
io.getTranscript();