
const EventEmitter = require('events')
const ViewObject = require('./viewobject')
module.exports = class DisplayWindow extends EventEmitter {
     constructor(display, options){
         super()
        this.display = display
        this.window_id = options.window_id
        this.screenName = options.screenName
        this.appContext = options.appContext
        this.template = options.template
        this.display.displayWindows.set(this.window_id, this)
        this.display.on('window_event', (data, flags) => {

        }) 
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

    //todo

    addToGrid(label, bounds){

    }


    // setting DisplayWindow cssText

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
        return this.display._postRequest(cmd)
    }

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

        return this.display._postRequest(cmd)
    }

    setCSSStyle(css_string){
         let cmd = {
            command : 'set-displaywindow-css-style',
            options : {
                window_id : this.window_id,
                cssText : css_string
            }
        }
        return this.display._postRequest(cmd)
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
        return this.display._postRequest(cmd)
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
        return this.display._postRequest(cmd)
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
        return this.display._postRequest(cmd)
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
        return this.display._postRequest(cmd)
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
        let s = this.display._postRequest(cmd)
        return new ViewObject(this.display, s)
    }
}