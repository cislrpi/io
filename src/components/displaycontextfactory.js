const DisplayContext = require('./displaycontext')

module.exports = class DisplayContextFactory {

    constructor(io) {
        this.io = io
    }

    getDisplays() {
        return this.io.store.getHash('display:displays')
    }

    getList() {
        return this.io.store.getSet('display:displayContexts')
    }

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

    setActive(appname, reset) {
        console.log('requested app name : ', appname)
        this.io.store.getState('display:activeDisplayContext').then(name => {
            console.log('app name in store : ', name)
            if (name != appname) {
                this.io.store.setState('display:activeDisplayContext', appname);
                (new DisplayContext(appname, {}, this.io)).restoreFromStore(reset)
            } else {
                console.log('app name : ', appname, 'is already active')
            }
        })
    }

    create(ur_app_name, window_settings) {
        let _dc = new DisplayContext(ur_app_name, window_settings, this.io)
        return _dc.restoreFromStore().then(m => {
            return _dc
        })
    }

    hideAll() {
        let cmd = {
            command: 'hide-all-windows'
        }
        this.getDisplays().then(m => {
            let _ps = []
            for (let k of Object.keys(m)) {
                _ps.push(this.io.call('rpc-display-' + k, JSON.stringify(cmd)))
            }
            return Promise.all(_ps)
        }).then(m => {
            return m
        })
    }

    getFocusedDisplayWindow(displayName = 'main') {
        let cmd = {
            command: 'get-focus-window'
        }
        return this.io.call('rpc-display-' + k, JSON.stringify(cmd)).then(m => { return JSON.parse(m.toString()) })
    }

    getFocusedDisplayWindows() {
        let cmd = {
            command: 'get-focus-window'
        }
        return this.getDisplays().then(m => {
            let _ps = []
            for (let k of Object.keys(m)) {
                _ps.push(this.io.call('rpc-display-' + k, JSON.stringify(cmd)))
            }
            return Promise.all(_ps)
        }).then(m => {
            for (var i = 0; i < m.length; i++) {
                m[i] = JSON.parse(m[i].toString())
            }

            return m
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

    OnViewObjectHidden(handler) {
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
