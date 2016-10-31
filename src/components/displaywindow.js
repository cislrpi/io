
const ViewObject = require('./viewobject')
module.exports = class DisplayWindow {
     constructor(io, options){
        this.io = io
        this.window_id = options.window_id
        this.windowName = options.windowName
        this.displayName = options.displayName
        this.displayContext = options.displayContext
        this.template = "index.html"
        this.x = options.x
        this.y = options.y
        this.width = options.width
        this.height = options.height
    }

    _postRequest( data ){
        return this.io.call('display-rpc-queue-' + this.displayName, JSON.stringify(data))
    }

    id(){
        return this.window_id
    }

    clearGrid(){
        let cmd = {
            command : "clear-grid",
            options : {
                window_id : this.window_id
            }
        }
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    clearContents(){
        let cmd = {
            command : "clear-contents",
            options : {
                window_id : this.window_id
            }
        }
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    /*
        args: options (json object)
            - contentGrid (json Object)
                (for uniform grid)
                - row (integer, no of rows)
                - col (integer, no of cols)
                - rowHeight ( float array, height percent for each row - 0.0 to 1.0 )
                - colWidth ( float array,  width percent for each col - 0.0 to 1.0 )
                - padding (float) // in px or em
                (for custom grid)
                - custom ( array of json Object)
                   [{ "label" : "cel-id-1",  left, top, width, height}, // in px or em or percent
                    { "label" : "cel-id-2",  left, top, width, height},
                    { "label" : "cel-id-3",  left, top, width, height},
                    ...
                    ]
            - gridBackground (json Object)
                {
                    "row|col" : "backgroundColor",
                    "cel-id-1" : "backgroundColor",
                    "cel-id-2" : "backgroundColor",
                }
    */

    createUniformGrid(options){
        options.window_id = this.window_id
        let cmd = {
            command : "create-grid",
            options : options
        }
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    addToGrid(label, bounds, backgroundStyle){
        let cmd = {
            command : "add-to-grid",
            options : {
                window_id : this.window_id,
                label : label,
                bounds : bounds,
                style : backgroundStyle
            }
        }
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    removeFromGrid(label){
        let cmd = {
            command : "remove-from-grid",
            options : {
                window_id : this.window_id,
                label : label
            }
        }
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }


    /*
        returns the gridlayout

    */
    getGrid(){
        let cmd = {
            command : 'get-grid',
            options : {
                window_id : this.window_id
            }
        }
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    getUniformGridCellSize(){
        let cmd = {
            command : 'uniform-grid-cell-size',
            options : {
                window_id : this.window_id
            }
        }
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }


    // setting DisplayWindow cssText

    /*
        label is row|col or custom cell name
        js_css_style : http://www.w3schools.com/jsref/dom_obj_style.asp
    */
    setCellStyle(label, js_css_style, animation){
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

        return this._postRequest(cmd).then(m=>{
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
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    /*
        hides the displayWindow
    */
    hide(){
        let cmd = {
            command : 'hide-window',
            options : {
                window_id : this.window_id
            }
        }
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    /*
        shows the displayWindow
    */
    show(){
        let cmd = {
            command : 'show-window',
            options : {
                window_id : this.window_id
            }
        }
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    /*
        permanently closes the displayWindow and destroys the viewobjects
    */
    close(){
        let cmd = {
            command : 'close-window',
            options : {
                window_id : this.window_id
            }
        }
        return this._postRequest(cmd).then( m => {
            m = JSON.parse(m.toString())
            m.viewObjects.forEach( (v) => {
                let view = this.getViewObjectById(v)
                if(view)
                    view.destroy()
            })
            this.destroy()
            return m  
        })
    }

    openDevTools(){
        let cmd = {
            command : 'window-dev-tools',
            options : {
                window_id : this.window_id,
                devTools : true
            }
        }
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    closeDevTools(){
        let cmd = {
            command : 'window-dev-tools',
            options : {
                window_id : this.window_id,
                devTools : false
            }
        }
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    capture(){
        let cmd = {
            command : 'capture-window',
            options : {
                window_id : this.window_id
            }
        }
        return this._postRequest(cmd)
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
        options.window_id = this.window_id
        options.displayContext = this.displayContext
        options.displayName = this.displayName
        options.windowName = this.windowName
        let cmd = {
            command : 'create-viewobj',
            options : options
        }        
        
        return this._postRequest(cmd).then(m =>{
            let opt = JSON.parse(m.toString())
            // opt.width = parseFloat(options.width)
            // opt.height = parseFloat(options.height)
            return new ViewObject(this.io, opt)      
        })
    }
}