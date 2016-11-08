const maxSpeakDuration = 1000 * 20 // 20 seconds

/**
 * Callback for handling speak event subscriptions.
 * @callback speakSubscriptionCallback
 * @param {Object} content - The message content parsed into a javascript object.
 * @param {String} content.text - The spoken text.
 * @param {Object} headers - The message headers.
 */

/**
 * Class representing the Speaker object.
 */
class Speaker {
    /**
     * Use {@link CELIO#speaker} instead.
     */
    constructor(io) {
        this.io = io
    }

    /**
     * Speak text.
     * @param  {string} text - The text to speak out.
     * You can also use SSML. See [Watson TTS website](http://www.ibm.com/watson/developercloud/doc/text-to-speech/http.shtml#input).
     * @param  {Object} [options] - Speak options.
     * @param  {number} options.duration=20000 - The max non-stop speak duration. Defaults to 20 seconds.
     * @param  {string} options.voice - The voice to use. The default depends on the setting of speaker-worker.
     * For English (US), there are en-US_AllisonVoice, en-US_LisaVoice, and en-US_MichaelVoice.
     * For a full list of voice you can use, check [Watson TTS website](http://www.ibm.com/watson/developercloud/doc/text-to-speech/http.shtml#voices).
     * @returns {Promise<Object>} Resolves to "succeeded" or "interrupted".
     */
    speak(text, options = {}) {
        options.text = text
        if (!options.duration) {
            options.duration = maxSpeakDuration
        }
        return this.io.call('rpc-speaker-speakText', JSON.stringify(options), { expiration: options.duration })
    }

    /**
     * Increase speaker volume.
     * @param  {number} [change=20] - The change amount. The full range of the volume is from 0 to 120.
     * @returns {Promise} Resolves to "done".
     */
    increaseVolume(change = 20) {
        return this.io.call('rpc-speaker-changeVolume', JSON.stringify({ change }))
    }

    /**
     * Reduce speaker volume.
     * @param  {number} [change=20] - The change amount. The full range of the volume is from 0 to 120.
     * @returns {Promise} Resolves to "done".
     */
    reduceVolume(change = 20) {
        return this.io.call('rpc-speaker-changeVolume', JSON.stringify({ change: -change }))
    }

    /**
     * Stop the speaker.
     * @returns {Promise} Resolves to "done".
     */
    stop() {
        return this.io.call('rpc-speaker-stop', '')
    }

    beginSpeak(msg) {
        this.io.publishTopic('begin.speak', JSON.stringify(msg))
    }

    endSpeak(msg) {
        this.io.publishTopic('end.speak', JSON.stringify(msg))
    }

    /**
     * Subscribe to begin-speak events.
     * @param  {speakSubscriptionCallback} handler - The callback for handling the speaking events.
     */
    onBeginSpeak(handler) {
        this.io.onTopic('begin.speak', (content, headers) =>
            handler(JSON.parse(content.toString(), headers)))
    }

    /**
     * Subscribe to end-speak events.
     * @param  {speakSubscriptionCallback} handler - The callback for handling the speaking events.
     */
    onEndSpeak(handler) {
        this.io.onTopic('end.speak', (content, headers) =>
            handler(JSON.parse(content.toString(), headers)))
    }
}

module.exports = Speaker
