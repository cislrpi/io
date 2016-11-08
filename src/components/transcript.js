/**
 * Callback for handling transcription subscriptions.
 * @callback transcriptSubscriptionCallback
 * @param {Object} content - The message content parsed into a javascript object.
 * @param {Object} headers - The message headers.
 */

/**
 * Class representing the Transcript object.
 * The transcript messages has the following format.
 * ```js
 * {
 *   workerID: "id",
 *   channelIndex: num,
 *   speaker: "speaker name(optional)",
 *   result: {
 *       alternatives: [{transcript: "message", confidence: 0.9}],
 *       final: true,
 *       keyword_result: {}
 *   },
 *   messageID: "uuid string"
 *   time_captured: unix_time
 * }
 * ```
 * The result field follows the definition of Watson STT.
 * The full specification can be seen on [Watson STT website](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/speech-to-text/output.shtml).
 */
class Transcript {
    /**
     * Use {@link CELIO#transcript} instead.
     */
    constructor(io) {
        this.io = io
    }

    _on(topic, handler) {
        this.io.onTopic(topic, (msg, headers) =>
            handler(JSON.parse(msg.toString()), headers))
    }

    /**
     * Subscribe only to the final transcriptions.
     * @param  {transcriptSubscriptionCallback} handler - Function to respond the transcription results.
     */
    onFinal(handler) {
        this._on('*.final.transcript', handler)
    }

    /**
     * Subscribe only to the interim transcriptions before a sentence is finalized.
     * @param  {transcriptSubscriptionCallback} handler - Function to respond the transcription results.
     */
    onInterim(handler) {
        this._on('*.interim.transcript', handler)
    }

    /**
     * Subscribe to all transcriptions.
     * @param  {transcriptSubscriptionCallback} handler - Function to respond the transcription results.
     */
    onAll(handler) {
        this._on('*.*.transcript', handler)
    }

    /**
     * Request all transcript workers to switch to a model.
     * @param  {string} model - The name of the model to switch to.
     */
    switchModel(model) {
        this.io.publishTopic('switchModel.transcript.command', model)
    }

    /**
     * Request a transcript worker to tag a channel with a speaker name
     * @param  {string} workerID - The transcript worker's UUID. Available in transcript messages' workerID field.
     * @param  {number} channelIndex - The channel index number. Available in transcript messages' channelIndex field.
     * @param  {string} speakerName - The speaker name to tag.
     * @returns {Promise} A promise that resolves to {content: Buffer('done')}.
     */
    tagChannel(workerID, channelIndex, speakerName) {
        return this.io.call(`rpc-transcript-${workerID}-tagChannel`, JSON.stringify({ channelIndex, speaker: speakerName }))
    }

    addKeywords(words) {
        // this.io.store.addToSet('transcript:keywords', )
        this.io.publishTopic('addKeywords.transcript.command', JSON.stringify(words))
    }

    /**
     * Request all transcript workers to stop publishing. Useful for entering a privacy mode.
     */
    stopPublishing() {
        this.io.publishTopic('stopPublishing.transcript.command', '')
    }

    /**
     * Publish transcript result on `[near|far|beamform].[final|interim].transcript`
     * @param  {string} micType - The microphone type: near, far, beamform.
     * Far-range mics are disabled when the agent speaker is playing audio.
     * Beamform mics are disabled whenever some other types of mics are functioning.
     * @param  {bool} isFinal - Indicates whether the result is final.
     * @param  {Object} msg - The transcript to publish.
     */
    publish(micType, isFinal, msg) {
        const topic = isFinal ? 'final' : 'interim'
        if (!msg.time_captured) {
            msg.time_captured = new Date().getTime()
        }
        msg.messageID = this.io.generateUUID()
        this.io.publishTopic(`${micType}.${topic}.transcript`, JSON.stringify(msg))
    }
}

module.exports = Transcript
