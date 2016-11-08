const DisplayContext = require('./displaycontext')
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
    */
    setActive(display_ctx_name, reset = false) {
        console.log('requested app name : ', display_ctx_name)
        this.io.store.getState('display:activeDisplayContext').then(name => {
            console.log('app name in store : ', name)
            if (name !== display_ctx_name) {
                this.io.store.setState('display:activeDisplayContext', display_ctx_name);
                (new DisplayContext(display_ctx_name, {}, this.io)).restoreFromStore(reset)
            } else {
                console.log('app name : ', display_ctx_name, 'is already active')
            }
        })
    }

    /**
    * Creates a display context. If the display context already exists, it is made active and a DisplayContext Object is restored from store.
    * @param {string} display_ctx_name - display context name.
    * @param {boolean} [reset=false] if the viewObjects of the displayContext need to be reloaded.
    * @returns {Promise<Object>} A DisplayContext Object is returned.
    */
    create(display_ctx_name, window_settings) {
        let _dc = new DisplayContext(display_ctx_name, window_settings, this.io)
        return _dc.restoreFromStore().then(m => {
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
        })
    }

    /**
     * gets the details of the focused window from a display.
     * @params {string} [displayName='main']
     * @returns {Promise<object>} A JSON object with window name.
     * @example <caption> A sample output </caption>
     * { "command" : "get-focus-window",
     *   "status" : "success",
     *   "window_id" : 23,
     *   "displayName" : this.displayName,
     *   "displayContext" : "creative"
     * }
     */
    getFocusedWindow(displayName = 'main') {
        let cmd = {
            command: 'get-focus-window'
        }
        return this.io.call('rpc-display-' + displayName, JSON.stringify(cmd)).then(m => JSON.parse(m.content))
    }

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

    onViewObjectCreated(handler) {
        this._on(`display.*.viewObjectCreated.*`, handler)
    }

    onViewObjectHidden(handler) {
        this._on(`display.*.viewObjectHidden.*`, handler)
    }

    onViewObjectShown(handler) {
        this._on(`display.*.viewObjectShown.*`, handler)
    }

    onViewObjectClosed(handler) {
        this._on(`display.*.viewObjectClosed.*`, handler)
    }

    onViewObjectBoundsChanged(handler) {
        this._on(`display.*.viewObjectBoundsChanged.*`, handler)
    }

    onViewObjectUrlChanged(handler) {
        this._on(`display.*.viewObjectUrlChanged.*`, handler)
    }

    onViewObjectUrlReloaded(handler) {
        this._on(`display.*.viewObjectUrlChanged.*`, handler)
    }

    onViewObjectCrashed(handler) {
        this._on(`display.*.viewObjectCrashed.*`, handler)
    }

    onViewObjectGPUCrashed(handler) {
        this._on(`display.*.viewObjectGPUCrashed.*`, handler)
    }

    onViewObjectPluginCrashed(handler) {
        this._on(`display.*.viewObjectPluginCrashed.*`, handler)
    }

    onDisplayContextCreated(handler) {
        this._on('display.displayContext.created', handler)
    }

    onDisplayContextChanged(handler) {
        this._on('display.displayContext.changed', handler)
    }

    onDisplayContextClosed(handler) {
        this._on('display.displayContext.closed', handler)
    }

    onDisplayWorkerRemoved(handler) {
        this._on('display.removed', handler)
    }

    onDisplayWorkerAdded(handler) {
        this._on('display.added', handler)
    }

}

module.exports = DisplayContextFactory
