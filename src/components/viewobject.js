const EventEmitter = require('events')

module.exports = class ViewObject extends EventEmitter {
    constructor(display, options){
        super()
        this.display = display
        this.view_id = options.view_id
        this.screenName = options.screenName
        this.window_id = options.window_id
        this.display.viewObjects.set( this.view_id, this)
    }

    destroy(){
        this.display.viewObjects.delete(this.view_id)
        this.display = null
        this.view_id = null
        this.screenName = null
        this.window_id = null
    }   

    checkStatus(){
        if(!this.view_id)
            throw new Error("ViewObject is already deleted.")        
    }

    reload(){
        this.checkStatus()
        let cmd = {
            command : 'reload',
            options : {
                view_id : this.view_id
            }
        }
        return this.display._postRequest(cmd)
    }

    hide(){
        this.checkStatus()
         let cmd = {
            command : 'hide',
            options : {
                view_id : this.view_id
            }
        }
        return this.display._postRequest(cmd)
    }

    show(){
        this.checkStatus()
         let cmd = {
            command : 'show',
            options : {
                view_id : this.view_id
            }
        }
        return this.display._postRequest(cmd)
    }

    close(){
        this.checkStatus()
        let cmd = {
            command : 'close',
            options : {
                view_id : this.view_id
            }
        }
        let s = this.display._postRequest(cmd)
        if(s.status == "success"){
           this.destroy()
        }
        return s
    }

    setBounds(options){
        this.checkStatus()
        options.view_id = this.view_id
         let cmd = {
            command : 'set-bounds',
            options : options
        }
        return this.display._postRequest(cmd)
    }

    goBack(options){
        this.checkStatus()
        let cmd = {
            command : 'back',
            options : {
                view_id : this.view_id
            }
        }
        return this.display._postRequest(cmd)
    }

    goForward(){
        this.checkStatus()
        let cmd = {
            command : 'forward',
            options : {
                view_id : this.view_id,
            }
        }
        return this.display._postRequest(cmd)
    }

    openDevTools(){
        this.checkStatus()
        let cmd = {
            command : 'view-object-dev-tools',
            options : {
                view_id : this.view_id,
                devTools : true
            }
        }
        return this.display._postRequest(cmd)
    }

    closeDevTools(){
        this.checkStatus()
        let cmd = {
            command : 'view-object-dev-tools',
            options : {
                view_id : this.view_id,
                devTools : false
            }
        }
        return this.display._postRequest(cmd)
    }

   
}
