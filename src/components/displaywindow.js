
const ViewObject = require('./viewobject')
module.exports = class DisplayWindow {
     constructor(display, options){
        this.display = display
        this.window_id = options.window_id
        this.screenName = options.screenName
        this.appContext = options.appContext
        this.template = options.template
        this.display.displayWindows.set(this.window_id, this)
        this.eventHandlers = new Map()
        this.display.io.onTopic("display.window", (e)=>{
            const m = JSON.parse(e.toString())
            if(m.details.window_id == this.window_id && m.details.screenName == this.screenName){
                m.details.eventType = m.type
                if(this.eventHandlers.has(m.type)){
                    for(let h of this.eventHandlers.get(m.type)){
                        h(m.details)
                    }
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


    id(){
        return this.window_id
    }

    destroy(){
        this.display.displayWindows.delete(this.window_id)
        this.display = null
        this.window_id = null
        this.screenName = null
        this.appContext = null
        this.template = null
    }

    checkStatus(){
        if(!this.window_id)
            throw new Error("DisplayWindow is already deleted.")        
    }

    addToGrid(label, bounds, backgroundStyle){
        this.checkStatus()
        let cmd = {
            command : "add-to-grid",
            options : {
                window_id : this.window_id,
                label : label,
                bounds : bounds,
                style : backgroundStyle
            }
        }
        return this.display._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }



    /*
        returns the gridlayout

    */
    getGrid(){
        this.checkStatus()
        let cmd = {
            command : 'get-grid',
            options : {
                window_id : this.window_id
            }
        }
        return this.display._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    getUniformGridCellSize(){
        this.checkStatus()
        let cmd = {
            command : 'uniform-grid-cell-size',
            options : {
                window_id : this.window_id
            }
        }
        return this.display._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }


    // setting DisplayWindow cssText

    /*
        label is row|col or custom cell name
        js_css_style : http://www.w3schools.com/jsref/dom_obj_style.asp
    */
    setCellStyle(label, js_css_style, animation){
        this.checkStatus()
        let cmd = {
            command : 'cell-style',
            options : {
                window_id : this.window_id,
                label : label,
                style : js_css_style
            }
        }
        if(animation)
            cmd.options.animation_options = animation

        return this.display._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    setFontSize(px_string){
         let cmd = {
            command : 'set-displaywindow-font-size',
            options : {
                window_id : this.window_id,
                fontSize : px_string
            }
        }
        return this.display._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    /*
        hides the displayWindow
    */
    hide(){
        this.checkStatus()
        let cmd = {
            command : 'hide-window',
            options : {
                window_id : this.window_id
            }
        }
        return this.display._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    /*
        shows the displayWindow
    */
    show(){
        this.checkStatus()
        let cmd = {
            command : 'show-window',
            options : {
                window_id : this.window_id
            }
        }
        return this.display._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    /*
        permanently closes the displayWindow and destroys the viewobjects
    */
    close(){
        this.checkStatus()
        let cmd = {
            command : 'close-window',
            options : {
                window_id : this.window_id
            }
        }
        let s = this.display._postRequest(cmd)
        s.viewObjects.forEach( (v) => {
            let view = this.display.getViewObjectById(v)
            if(view)
                view.destroy()
        })
        this.destroy()
        return s
    }

    openDevTools(){
        this.checkStatus()
        let cmd = {
            command : 'window-dev-tools',
            options : {
                window_id : this.window_id,
                devTools : true
            }
        }
        return this.display._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    closeDevTools(){
        this.checkStatus()
        let cmd = {
            command : 'window-dev-tools',
            options : {
                window_id : this.window_id,
                devTools : false
            }
        }
        return this.display._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

     /*
        creates a new viewobject (webpage)
        options:
            - url
            - position (label or grid-top & grid-left)
            - width // in px or em 
            - height // in px or em 
            - cssText (string)
            - nodeintegration (boolean)
    */
    createViewObject(options){
        this.checkStatus()
        options.window_id = this.window_id
        options.appContext = this.appContext
        options.screenName = this.screenName
        let cmd = {
            command : 'create-viewobj',
            options : options
        }        
        
        return this.display._postRequest(cmd).then(m =>{
            let opt = JSON.parse(m.toString())
            opt.width = parseFloat(options.width)
            opt.height = parseFloat(options.height)
            return new ViewObject(this.display, opt)      
        })
    }
}