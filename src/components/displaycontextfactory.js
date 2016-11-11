const DisplayContext = require('./displaycontext')

/**
 * @typedef {Object} focus_window
 * @property {string} status success or Error message
 * @property {number} window_id Window Id, when status is success
 * @property {string} command The command name
 * @property {string} displayName Display Name
 * @property {string} displayContext DisplayContext Name
 * @example
 * { "command" : "get-focus-window",
 *   "status" : "success",
 *   "window_id" : 23,
 *   "displayName" : "main",
 *   "displayContext" : "creative"
 *  }
 */

/**
 * @typedef {Object} window_settings
 * @property {string} displayName Display Name
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {object} contentGrid
 * @property {number} contentGrid.row
 * @property {number} contentGrid.col
 * @property {number} contentGrid.padding
 * @property {Object.<String,String>} gridBackground. key is "row|col" and value is a valid html color string
 * @property {String} fontSize
 */

/**
 * Callback for handling viewObjects event subscriptions.
 * @callback viewObjectBasicEventCallback
 * @param {Object} message - The message content parsed into a javascript object.
 * @param {String} message.type - event type
 * @param {String} message.displayContext - The display context name
 * @param {Object} message.details - The message details.
 * @param {String} message.details.view_id - view object id
 */

/**
 * Callback for handling viewObjects URL event subscriptions.
 * @callback viewObjectURLEventCallback
 * @param {Object} message - The message content parsed into a javascript object.
 * @param {String} message.type - event type
 * @param {String} message.displayContext - The display context name
 * @param {Object} message.details - The message details.
 * @param {String} message.details.view_id - view object id
 * @param {String} message.details.url - view object url
 */

/**
 * Callback for handling viewObject created event subscriptions.
 * @callback viewObjectCreatedEventCallback
 * @param {Object} message - The message content parsed into a javascript object.
 * @param {String} message.type - event type
 * @param {String} message.displayContext - The display context name
 * @param {Object} message.details - The message details.
 */

/**
 * Callback for handling viewObject Bounds change event subscriptions.
 * @callback viewObjectBoundsEventCallback
 * @param {Object} message - The message content parsed into a javascript object.
 * @param {String} message.type - event type
 * @param {String} message.displayContext - The display context name
 * @param {Object} message.details - The message details.
 * @param {String} message.details.view_id - view object id
 * @param {Number} message.details.top - Top position in pixel.
 * @param {Number} message.details.left - Left position in pixel.
 * @param {Number} message.details.width - Width in pixel.
 * @param {Number} message.details.height - Height position in pixel.
 */

/**
 * Callback for handling displayContextClosed event subscriptions.
 * @callback displayContextClosedEventCallback
 * @param {Object} message - The message content parsed into a javascript object.
 * @param {String} message.type - event type
 * @param {String} message.displayContext - The display context name
 * @param {Object} message.details - The message details.
 * @param {String} message.details.view_id - view object id
 * @param {Number} message.details.top - Top position in pixel.
 * @param {Number} message.details.left - Left position in pixel.
 * @param {Number} message.details.width - Width in pixel.
 * @param {Number} message.details.height - Height position in pixel.
 */

/**
 * Callback for handling display worker add/remove event subscriptions.
 * Display worker added event
 * @callback displayEventCallback
 * @param {String} displayName
 */

/**
 * Class representing the DisplayContextFactory object.
 */
class DisplayContextFactory {

    constructor(io) {
        this.io = io
    }

    /**
    * gets the Display Workers details running in the environment.
    * @returns {Promise} A ES2015 Map object with displayNames as keys and bounds as values.
    */
    getDisplays() {
        return this.io.store.getHash('display:displays').then(m => {
            let map = new Map()
            for (var k of Object.keys(m)) {
                map.set(k, JSON.parse(m[k]))
            }
            return map
        })
    }

    /**
    * list display contexts live in the environment.
    * @returns {Promise} An array of String containing display context names.
    */
    list() {
        return this.io.store.getSet('display:displayContexts')
    }

    /**
    * gets the activelist display contexts.
    * @returns {Promise} An array of String containing display context names.
    */
    getActive() {
        return this.io.store.getState('display:activeDisplayContext').then(m => {
            console.log('active display context is ', m)
            if (m) {
                let _dc = new DisplayContext(m, {}, this.io)
                return _dc.restoreFromStore().then(m => { return _dc })
            } else {
                let _dc = new DisplayContext('default', {}, this.io)
                return _dc.restoreFromStore().then(m => { return _dc })
            }
        })
    }

    /**
    * sets a display context active. Making a display context active ensures only windows of the display context are visible. Windows from other display contexts are hidden.
    * @param {string} display_ctx_name - display context name.
    * @param {boolean} [reset=false] if the viewObjects of the displayContext need to be reloaded.
    * @returns {Promise} return false if the display context name is already active.
    */
    setActive(display_ctx_name, reset = false) {
        return this.io.store.getState('display:activeDisplayContext').then(name => {
            console.log('Current active display context name : ', name)
            console.log('requested display context name to be made active : ', display_ctx_name)
            if (name !== display_ctx_name) {
                this.io.store.setState('display:activeDisplayContext', display_ctx_name)
                return (new DisplayContext(display_ctx_name, {}, this.io)).restoreFromStore(reset).then(m => {
                    this.io.publishTopic('display.displayContext.changed', JSON.stringify({
                        'type': 'displayContextChanged',
                        'details': {
                            'displayContext': display_ctx_name,
                            'lastDisplayContext': name
                        }
                    }))
                    return m
                })
                /*
                    io.publishTopic("display.displayContext.changed", JSON.stringify({
                        type : "displayContextChanged",
                        details : {
                            displayContext : this.activeDisplayContext,
                            lastDisplayContext : lastContext
                        }
                    }))
                */
            } else {
                console.log('app name : ', display_ctx_name, 'is already active')
                return false
            }
        })
    }

    /**
    * Creates a display context. If the display context already exists, it is made active and a DisplayContext Object is restored from store.
    * @param {string} display_ctx_name - display context name.
    * @param {Object.<String, window_settings>} [window_settings={}] Key is window name and value is an object
    * @returns {Promise<Object>} A DisplayContext Object is returned.
    * @example
{
    'windowA': {
        'displayName': 'main',
        'x': 0,
        'y': 0,
        'width': 500,
        'height': 500,
        'contentGrid': {
            'row': 2,
            'col': 2,
            'padding': 5
        },
        'fontSize': '50px'
    },
    'windowB': {
        'displayName': 'main',
        'x': 505,
        'y': 0,
        'width': 500,
        'height': 500,
        'contentGrid': {
            'row': 2,
            'col': 2,
            'padding': 5
        }
    },
    'windowC': {
        'displayName': 'main',
        'x': 1010,
        'y': 0,
        'width': 500,
        'height': 500,
        'contentGrid': {
            'row': 2,
            'col': 2,
            'padding': 5
        },
        'gridBackground' : {
            '1|1' : 'white',
            '1|2' : 'grey',
            '2|1' : 'grey',
            '2|2' : 'white'
        }
    }
}
    */
    create(display_ctx_name, window_settings = {}) {
        let _dc = new DisplayContext(display_ctx_name, window_settings, this.io)
        return _dc.restoreFromStore().then(m => {
            this.io.publishTopic('display.displayContext.created', JSON.stringify({
                type: 'displayContextCreated',
                details: {
                    displayContext: display_ctx_name
                }
            }))
            return _dc
        })
    }

    /**
    * hides all display contexts. If the display context already exists, it is made active and a DisplayContext Object is restored from store.
    * @returns {Promise<Object>} A array of JSON object containing status of hide function execution at all display workers.
    */
    hideAll() {
        let cmd = {
            command: 'hide-all-windows'
        }
        return this.getDisplays().then(m => {
            let _ps = []
            for (let [k] of m) {
                _ps.push(this.io.call('rpc-display-' + k, JSON.stringify(cmd)).then(m => JSON.parse(m.content)))
            }
            return Promise.all(_ps)
        }).then(m => {
            this.io.store.del('display:activeDisplayContext')
            return m
        })
    }

    /**
     * gets the details of the focused window from a display.
     * @param {string} [displayName=main] - Display Name.
     * @returns {Promise.<focus_window>} - A JSON object with window details.
     */
    getFocusedWindow(displayName = 'main') {
        let cmd = {
            command: 'get-focus-window'
        }
        return this.io.call('rpc-display-' + displayName, JSON.stringify(cmd)).then(m => JSON.parse(m.content))
    }

    /**
     * gets the details of the focused window from all displays.
     * @returns {Promise.<Array.<focus_window>>} - An array of JSON object with window details.
     */
    getFocusedWindows() {
        let cmd = {
            command: 'get-focus-window'
        }
        return this.getDisplays().then(m => {
            let _ps = []
            for (let [k] of m) {
                _ps.push(this.io.call('rpc-display-' + k, JSON.stringify(cmd)).then(m => JSON.parse(m.content)))
            }
            return Promise.all(_ps)
        })
    }

    _on(topic, handler) {
        this.io.onTopic(topic, (msg, headers) => {
            if (handler != null) { handler(JSON.parse(msg.toString()), headers) }
        })
    }

    /**
     * viewObject created event
     * @param {viewObjectCreatedEventCallback} handler
     */
    onViewObjectCreated(handler) {
        this._on(`display.*.viewObjectCreated.*`, handler)
    }

    /**
     * viewObject hidden event
     * @param {viewObjectBasicEventCallback} handler
     */
    onViewObjectHidden(handler) {
        this._on(`display.*.viewObjectHidden.*`, handler)
    }

    /**
     * viewObject became visible event
     * @param {viewObjectBasicEventCallback} handler
     */
    onViewObjectShown(handler) {
        this._on(`display.*.viewObjectShown.*`, handler)
    }

    /**
     * viewObject closed event
     * @param {viewObjectBasicEventCallback} handler
     */
    onViewObjectClosed(handler) {
        this._on(`display.*.viewObjectClosed.*`, handler)
    }

    /**
     * viewObject bounds changed event
     * @param {viewObjectBoundsEventCallback} handler
     */
    onViewObjectBoundsChanged(handler) {
        this._on(`display.*.viewObjectBoundsChanged.*`, handler)
    }

    /**
     * viewObject URL changed event
     * @param {viewObjectURLEventCallback} handler
     */
    onViewObjectUrlChanged(handler) {
        this._on(`display.*.viewObjectUrlChanged.*`, handler)
    }

    /**
     * viewObject URL reloaded event
     * @param {viewObjectURLEventCallback} handler
     */
    onViewObjectUrlReloaded(handler) {
        this._on(`display.*.viewObjectUrlChanged.*`, handler)
    }

    /**
     * viewObject crashed event
     * @param {viewObjectBasicEventCallback} handler
     */
    onViewObjectCrashed(handler) {
        this._on(`display.*.viewObjectCrashed.*`, handler)
    }

    /**
     * viewObject GPU crashed event
     * @param {viewObjectBasicEventCallback} handler
     */
    onViewObjectGPUCrashed(handler) {
        this._on(`display.*.viewObjectGPUCrashed.*`, handler)
    }

    /**
     * viewObject plugin crashed event
     * @param {viewObjectBasicEventCallback} handler
     */
    onViewObjectPluginCrashed(handler) {
        this._on(`display.*.viewObjectPluginCrashed.*`, handler)
    }

    /**
     * DisplayContext created event
     * @param {displayContextCreatedEventCallback} handler
     */
    onDisplayContextCreated(handler) {
        this._on('display.displayContext.created', handler)
    }

    /**
     * DisplayContext changed event
     * @param {displayContextChangedEventCallback} handler
     */
    onDisplayContextChanged(handler) {
        this._on('display.displayContext.changed', handler)
    }

    /**
     * DisplayContext closed event
     * @param {displayContextClosedEventCallback} handler
     */
    onDisplayContextClosed(handler) {
        this._on('display.displayContext.closed', handler)
    }

    /**
     * Display worker removed event
     * @param {displayEventCallback} handler
     */
    onDisplayWorkerRemoved(handler) {
        this._on('display.removed', handler)
    }

    /**
     * Display worker added event
     * @param {displayEventCallback} handler
     */
    onDisplayWorkerAdded(handler) {
        this._on('display.added', handler)
    }

}

module.exports = DisplayContextFactory
