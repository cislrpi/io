
module.exports = class ViewObject {
    constructor(io, options){
        this.io = io
        this.view_id = options.view_id
        this.screenName = options.screenName
        this.window_id = options.window_id
    }

    _postRequest( data ){
        return this.io.call('display-rpc-queue-' + this.screenName, JSON.stringify(data))
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

   
}
