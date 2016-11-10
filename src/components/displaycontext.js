const DisplayWindow = require('./displaywindow')
const ViewObject = require('./viewobject')
const _ = require('lodash')

/**
 * @typedef {Promise.<Object>} display_rpc_result
 * @property {string} status success or Error message
 * @property {string} command The command name
 * @property {string} displayName Display Name
 * @property {string} displayContext DisplayContext Name
 */

/**
 * Class representing the DisplayContext object.
 */
class DisplayContext {
    /**
    * Creates an instance of DisplayContext.
    * @param {String} name Display context name
    * @param {Object.<String, window_settings>} window_settings - a collection of named window settings
    * @param {Object} io CELIO object instance
    */
    constructor(name, window_settings, io) {
        console.log('creating obj for display context : ', name)
        this.io = io
        this.name = name
        this.displayWindows = new Map()
        this.viewObjects = new Map()

        if (!_.isEmpty(window_settings)) {
            // console.log('storing window setting')
            this.io.store.addToHash('display:windowBounds', name, JSON.stringify(window_settings))
        }

        this.io.store.addToSet('display:displayContexts', name)

        this.eventHandlers = new Map()
        this.io.onTopic('display.removed', m => {
            // clean up objects
            let closedDisplay = m.toString()
            // let closedWindowObjId = this.displayWindows.get(closedDisplay)
            this.displayWindows.delete(closedDisplay)
            let toRemove = []
            for (let [k, v] of this.viewObjects) {
                if (v.displayName === closedDisplay) { toRemove.push(k) }
            }

            for (let k = 0; k < toRemove.length; k++) {
                this.viewObjects.delete(toRemove[k])
            }

            // clear up the store
            this.io.store.getHash('display:dc:' + this.name).then(m => {
                if (!_.isEmpty(m)) {
                    let mobj = m.displayWinObjMap ? JSON.parse(m.displayWinObjMap) : null
                    if (mobj) {
                        delete mobj[closedDisplay]
                        mobj = Object.keys(mobj).length > 0 ? mobj : null
                    }
                    if (mobj) {
                        this.io.store.addToHash('display:dc:' + this.name, 'displayWinObjMap', JSON.stringify(mobj))
                    } else {
                        this.io.store.removeFromHash('display:dc:' + this.name, 'displayWinObjMap')
                    }

                    let vobj = m.viewObjDisplayMap ? JSON.parse(m.viewObjDisplayMap) : null

                    if (vobj) {
                        for (let k = 0; k < toRemove.length; k++) {
                            delete vobj[toRemove[k]]
                        }
                        vobj = Object.keys(vobj).length > 0 ? vobj : null
                    }
                    if (vobj) {
                        this.io.store.addToHash('display:dc:' + this.name, 'viewObjDisplayMap', JSON.stringify(vobj))
                    } else {
                        this.io.store.removeFromHash('display:dc:' + this.name, 'viewObjDisplayMap')
                    }
                }
            })
        })
    }

    _on(topic, handler) {
        this.io.onTopic(topic, (msg, headers) => {
            if (handler != null) { handler(JSON.parse(msg.toString()), headers) }
        })
    }

    _postRequest(displayName, data) {
        // console.log(displayName, data)
        return this.io.call('rpc-display-' + displayName, JSON.stringify(data)).then(msg => {
            return JSON.parse(msg.content.toString())
        })
    }

    restoreFromStore(reset = false) {
        // console.log('getting state display:dc:' + this.name)
        return this.io.store.getHash('display:dc:' + this.name).then(m => {
            // console.log('from store', m, _.isEmpty(m))
            if (_.isEmpty(m)) {
                console.log(`initialize display context - ${this.name} from options`)
                return this.getWindowBounds().then(bounds => {
                    return this.initialize(bounds)
                })
            } else {
                console.log(`restoring display context - ${this.name} from store`)
                this.displayWindows.clear()
                this.viewObjects.clear()

                if (m.displayWinObjMap) {
                    let mobj = JSON.parse(m.displayWinObjMap)
                    // create WindowObjects based on  windowName , window_id

                    for (let k of Object.keys(mobj)) {
                        let opts = mobj[k]
                        this.displayWindows.set(k, new DisplayWindow(this.io, opts))
                    }

                    // create viewObjects based on view_id, windowName
                    if (m.viewObjDisplayMap) {
                        let vobj = JSON.parse(m.viewObjDisplayMap)
                        for (let k of Object.keys(vobj)) {
                            let wn = mobj[vobj[k]]
                            let opts = {
                                'view_id': k,
                                'window_id': wn.window_id,
                                'displayName': wn.displayName,
                                'displayContext': this.name,
                                'windowName': wn.windowName
                            }
                            this.viewObjects.set(k, new ViewObject(this.io, opts))
                        }
                    }
                }

                if (reset) {
                    console.log('making it active and reloading')
                    return this.show().then(m => {
                        return this.reloadAll()
                    }).then(m => {
                        console.log(m)
                        return m
                    })
                } else {
                    console.log('making it active ')
                    return this.show()
                }
            }
        })
    }

    /**
     * gets a map of displayName with bounds
     * @returns {Promise.<Object>} A map of displayNames with bounds
     */
    getWindowBounds() {
        return this.io.store.getHashField('display:windowBounds', this.name).then(m => {
            // console.log('display:windowBounds', m)
            if (m == null) {
                // console.log('using display:displays for windowBounds')
                return this.io.store.getHash('display:displays').then(x => {
                    for (let k of Object.keys(x)) {
                        x[k] = JSON.parse(x[k])
                        if (x[k].displayName === undefined) { x[k].displayName = k }
                        x[k].windowName = k
                        x[k].displayContext = this.name
                    }
                    return x
                })
            } else {
                // console.log('using  windowBounds from store')
                let x = JSON.parse(m)
                for (let k of Object.keys(x)) {
                    if (x[k].displayName === undefined) { x[k].displayName = k }
                    x[k].windowName = k
                    x[k].displayContext = this.name
                }
                return x
            }
        })
    }

    /**
     * gets a window object by window name
     * @param {any} displayName
     * @returns {DisplayWindow} returns an instance of DisplayWindow
     */
    getDisplayWindowSync(displayName) {
        return this.displayWindows.get(displayName)
    }

    /**
     * gets a window object by window id
     * @param {Number} window_id window id
     * @param {String} displayName display's name
     * @returns {DisplayWindow} returns an instance of DisplayWindow
     */
    getDisplayWindowByIdSync(window_id, displayName) {
        for (let [k, v] of this.displayWindows) {
            if (v.window_id === window_id && v.displayName === displayName) { return v }
        }
        return new Error(`Window id ${window_id} is not present`)
    }

    /**
     * gets all window names
     * @returns {Array.<String>} An array of window names
     */
    getDisplayWindowNameSync() {
        return this.displayWindows.keys()
    }

    /**
     * Shows all windows of a display context
     * @returns {display_rpc_result} returns a status object
     */
    show() {
        let cmd = {
            command: 'set-display-context',
            options: {
                context: this.name
            }
        }

        return this.getWindowBounds().then(m => {
            let disps = new Set()
            for (let k of Object.keys(m)) {
                disps.add(m[k].displayName)
            }
            // console.log(disps)
            let _ps = []
            for (let k of disps) {
                _ps.push(this._postRequest(k, cmd))
            }
            return Promise.all(_ps)
        }).then(m => {
            // console.log('##windows shown')
            this.io.store.setState('display:activeDisplayContext', this.name)
            return m
        })
    }

    /**
     * hides all windows of a display context
     * @returns {display_rpc_result} returns a status object
     */
    hide() {
        let cmd = {
            command: 'hide-display-context',
            options: {
                context: this.name
            }
        }
        return this.getWindowBounds().then(m => {
            let disps = new Set()
            for (let k of Object.keys(m)) {
                disps.add(m[k].displayName)
            }
            let _ps = []
            for (let k of disps) {
                _ps.push(this._postRequest(k, cmd))
            }
            return Promise.all(_ps)
        }).then(m => {
            return m
        })
    }

    /**
    * closes all windows of a display context
    * @returns {display_rpc_result} returns a status object
    */
    close() {
        let cmd = {
            command: 'close-display-context',
            options: {
                context: this.name
            }
        }
        return this.getWindowBounds().then(m => {
            if (m) {
                let disps = new Set()
                for (let k of Object.keys(m)) {
                    disps.add(m[k].displayName)
                }
                let _ps = []
                console.log('close at ', disps)
                for (let k of disps) {
                    _ps.push(this._postRequest(k, cmd))
                }
                return Promise.all(_ps)
            } else {
                return []
            }
        }).then(m => {
            console.log('##closing dc')
            let map = []
            let isHidden = false
            for (var i = 0; i < m.length; i++) {
                let res = m[i]
                if (res.command === 'hide-display-context') { isHidden = true }
                map.push(res)
            }
            if (!isHidden) {
                this.displayWindows.clear()
                this.viewObjects.clear()
                this.io.store.delState('display:dc:' + this.name)
                this.io.store.removeFromSet('display:displayContexts', this.name)
                this.io.store.removeFromHash('display:windowBounds', this.name)
                this.io.store.getState('display:activeDisplayContext').then(x => {
                    if (x === this.name) {
                        console.log('clearing up active display context')
                        this.io.store.delState('display:activeDisplayContext')
                    }
                })
                this.io.publishTopic('display.displayContext.closed', JSON.stringify({
                    'type': 'displayContextClosed',
                    'details': map
                }))
            }
            return map
        })
    }

    /**
    * reloads all viewObjects of a display context
    * @returns {display_rpc_result} returns a status object
    */
    reloadAll() {
        let _ps = []
        for (let [k, v] of this.viewObjects) {
            _ps.push(v.reload())
        }

        return Promise.all(_ps).then(m => {
            // console.log(m)
            let map = []
            for (var i = 0; i < m.length; i++) {
                let res = JSON.parse(m[i].toString())
                map.push(res)
            }
            return map
        })
    }

    initialize(options) {
        return this.show().then(() => {
            let _ps = []
            for (let k of Object.keys(options)) {
                // console.log('creating window for ', k)
                options[k].template = 'index.html'
                let cmd = {
                    command: 'create-window',
                    options: options[k]
                }
                _ps.push(this._postRequest(options[k].displayName, cmd))
            }
            return Promise.all(_ps)
        }).then(m => {
            let map = {}
            for (var i = 0; i < m.length; i++) {
                let res = m[i]
                // console.log('init:', res)
                map[res.windowName] = res
                this.displayWindows.set(res.windowName, new DisplayWindow(this.io, res))
            }
            this.io.store.addToHash('display:dc:' + this.name, 'displayWinObjMap', JSON.stringify(map))
            return map
        })
    }

    /**
    * gets a viewObject by id
    * @param {String} id - an uuid of the viewobject
    * @returns {ViewObject} returns the ViewObject instance
    */
    getViewObjectByIdSync(id) {
        return this.viewObjects.get(id)
    }

    /**
      * gets all viewObjects
      * @returns {Map.<String, ViewObject>} returns the collection of ViewObject instances
      */
    getViewObjectsSync() {
        return this.viewObjects
    }

    /**
     * gets a viewObject by id
     * @returns {Array.<Buffer>} returns an array of screenshot image buffer
     */
    captureDisplayWindows() {
        let _ps = []
        for (let [k, v] of this.displayWindows) {
            _ps.add(v.capture())
        }
        return Promise.all(_ps)
    }

    /**
     * Creates a view object
     * @param {Object} options - view object options
     * @param {String} [windowName='main'] - window name
     * @returns {ViewObject} returns the ViewObject instance
     */
    createViewObject(options, windowName = 'main') {
        options.displayContext = this.name
        if (this.displayWindows.has(windowName)) {
            return this.displayWindows.get(windowName).createViewObject(options).then(vo => {
                this.viewObjects.set(vo.view_id, vo)
                let map = {}
                for (let [k, v] of this.viewObjects) {
                    map[k] = v.windowName
                }
                this.io.store.addToHash('display:dc:' + this.name, 'viewObjDisplayMap', JSON.stringify(map))
                return vo
            })
        } else {
            return this.getWindowBounds().then(bounds => {
                for (let k of Object.keys(bounds)) {
                    if (bounds[k].displayName == undefined) {
                        bounds[k].displayName = k
                    }
                    bounds[k].windowName = k
                    bounds[k].template = 'index.html'
                    bounds[k].displayContext = this.name
                }
                return this.initialize(bounds)
            }).then(m => {
                return this.createViewObject(options, windowName)
            })
        }
    }

    /**
     * DisplayContext closed event
     * @param {displayContextClosedEventCallback} handler - event handler
     */
    onClosed(handler) {
        this.io.onTopic('display.displayContext.closed', (msg, headers) => {
            if (handler != null) {
                let m = JSON.parse(msg.toString())
                if (m.details.closedDisplayContext === this.name) {
                    handler(m, headers)
                }
            }
        })
    }

    /**
     * DisplayContext changed event
     * @param {displayContextChangedEventCallback} handler - event handler
     */
    onActivated(handler) {
        this.io.onTopic('display.displayContext.changed', (msg, headers) => {
            if (handler != null) {
                let m = JSON.parse(msg.toString())
                if (m.details.displayContext === this.name) {
                    handler(m, headers)
                }
            }
        })
    }

    /**
     * DisplayContext changed event
     * @param {displayContextChangedEventCallback} handler - event handler
     */
    onDeactivated(handler) {
        this.io.onTopic('display.displayContext.changed', (msg, headers) => {
            if (handler != null) {
                let m = JSON.parse(msg.toString())
                if (m.details.lastDisplayContext === this.name) {
                    handler(m, headers)
                }
            }
        })
    }
}

module.exports = DisplayContext
