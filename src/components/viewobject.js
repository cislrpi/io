
module.exports = class ViewObject {
    constructor(display, options){
        this.display = display
        this.view_id = options.view_id
        this.screenName = options.screenName
        this.window_id = options.window_id
        this.display.viewObjects.set( this.view_id, this)
        this.eventHandlers = new Map()
        this.display.io.onTopic("display.window.viewobject", (e)=>{
            const m = JSON.parse(e.toString())
            if(m.details.view_id == this.view_id){
                m.details.eventType = m.type
                for(let h of this.eventHandlers.get(m.type)){
                    h(m.details)
                }
                    
            }
        })
    }

    addEventListener(type, handler){
        if(this.eventHandlers.has(type)){
            this.eventHandlers.get(type).add(handler)
        }else{
            let ws = new Set()
            ws.add(handler)
            this.eventHandlers.set(type, ws)
        }
    }

    removeEventListener(type, handler){
        if(this.eventHandlers.has(type)){
            this.eventHandlers.get(type).delete(handler)
        }
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

    setUrl(url){
        let cmd = {
            command : 'set-url',
            options : {
                view_id : this.view_id,
                url : url
            }
        }
        return this.display._postRequest(cmd)
    }

    setCSSStyle(css_string){
         let cmd = {
            command : 'set-webview-css-style',
            options : {
                view_id : this.view_id,
                cssText : css_string
            }
        }
        return this.display._postRequest(cmd)
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
