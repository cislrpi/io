
module.exports = class ViewObject {
    constructor(io, options){
        this.io = io
        this.view_id = options.view_id
        this.displayName = options.displayName
        this.window_id = options.window_id
        this.windowName = options.windowName
        this.displayContext = options.displayContext
    }

    _postRequest( data ){
        return this.io.call('rpc-display-' + this.displayName, JSON.stringify(data))
    } 

    setUrl(url){
        let cmd = {
            command : 'set-url',
            options : {
                view_id : this.view_id,
                url : url
            }
        }
        return this._postRequest(cmd)
    }

    getUrl(){
        let cmd = {
            command : 'get-url',
            options : {
                view_id : this.view_id
            }
        }
        return this._postRequest(cmd)
    }

    setCSSStyle(css_string){
        let cmd = {
            command : 'set-webview-css-style',
            options : {
                view_id : this.view_id,
                cssText : css_string
            }
        }
        return this._postRequest(cmd)
    }

    enableDeviceEmulation(options){
        let cmd = {
            command : 'enable-device-emulation',
            options : {
                view_id : this.view_id,
                parameters : options
            }
        }
        return this._postRequest(cmd)
    }

    disableDeviceEmulation(){
        let cmd = {
            command : 'disable-device-emulation',
            options : {
                view_id : this.view_id
            }
        }
        return this._postRequest(cmd)
    }

    reload(){
        let cmd = {
            command : 'reload',
            options : {
                view_id : this.view_id
            }
        }
        return this._postRequest(cmd)
    }

    hide(){
         let cmd = {
            command : 'hide',
            options : {
                view_id : this.view_id
            }
        }
        return this._postRequest(cmd)
    }

    show(){
         let cmd = {
            command : 'show',
            options : {
                view_id : this.view_id
            }
        }
        return this._postRequest(cmd)
    }

    close(){
        let cmd = {
            command : 'close',
            options : {
                view_id : this.view_id
            }
        }
        return this._postRequest(cmd)
    }

    setBounds(options){
        // if(options.scaleContent){
        //     let w = parseFloat(options.width)
        //     let h = parseFloat(options.height)
        //     let dia = Math.sqrt( Math.pow(w,2) + Math.pow(h,2) )
        //     options.scale = dia * 1.0 /this.o_diagonal
        // }
        options.view_id = this.view_id
         let cmd = {
            command : 'set-bounds',
            options : options
        }
        return this._postRequest(cmd)
    }

    getBounds(){
        let cmd = {
            command : 'get-bounds',
            options : {
                view_id : this.view_id
            }
        }
        return this._postRequest(cmd)
    }

    goBack(options){
        let cmd = {
            command : 'back',
            options : {
                view_id : this.view_id
            }
        }
        return this._postRequest(cmd)
    }

    goForward(){
        let cmd = {
            command : 'forward',
            options : {
                view_id : this.view_id,
            }
        }
        return this._postRequest(cmd)
    }

    openDevTools(){
        let cmd = {
            command : 'view-object-dev-tools',
            options : {
                view_id : this.view_id,
                devTools : true
            }
        }
        return this._postRequest(cmd)
    }

    closeDevTools(){
        let cmd = {
            command : 'view-object-dev-tools',
            options : {
                view_id : this.view_id,
                devTools : false
            }
        }
        return this._postRequest(cmd)
    }

    setAudioMuted(val ){
        let cmd = {
            command : 'set-audio-muted',
            options : {
                view_id : this.view_id,
                audio : val
            }
        }
        return this._postRequest(cmd)
    }
    
    isAudioMuted(){
        let cmd = {
            command : 'get-audio-muted',
            options : {
                view_id : this.view_id
            }
        }
        return this._postRequest(cmd)
    }

    _on(topic, handler) {
        this.io.onTopic(topic, (msg, headers)=> {
            let m = JSON.parse(msg.toString())
            if(handler != null && m.details.view_id == this.view_id)
                handler(m, headers)
        })
    }

    onHidden( handler ){
        this._on( `display.${this.displayContext}.viewObjectHidden.${this.view_id}`, handler )
    }

    onShown( handler ){
        this._on( `display.${this.displayContext}.viewObjectShown.${this.view_id}`, handler )
    }

    onClosed( handler ){
        this._on( `display.${this.displayContext}.viewObjectClosed.${this.view_id}`, handler )
    }

    onBoundsChanged ( handler ){
        this._on( `display.${this.displayContext}.viewObjectBoundsChanged.${this.view_id}`, handler )
    }

    onUrlChanged (handler){
        this._on( `display.${this.displayContext}.viewObjectUrlChanged.${this.view_id}`, handler )
    }

    onUrlReloaded (handler){
        this._on( `display.${this.displayContext}.viewObjectUrlChanged.${this.view_id}`, handler )
    }

    onCrashed( handler ){
        this._on( `display.${this.displayContext}.viewObjectCrashed.${this.view_id}`, handler )
    }

    onGPUCrashed( handler ){
        this._on( `display.${this.displayContext}.viewObjectGPUCrashed.${this.view_id}`, handler )
    }

    onPluginCrashed( handler ){
        this._on( `display.${this.name}.viewObjectPluginCrashed.${this.view_id}`, handler )
    }
   

}
