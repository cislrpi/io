
const uuid = require('uuid')
const DisplayWindow = require('./displaywindow')


module.exports = class Display  {
    constructor (io) {
        this.io = io
        this.conf = io.display
        this.client_id = uuid.v1()
        this.displayWindows = new Map()
        this.viewObjects = new Map()
        this.eventHandlers = new Map()
        // display route is display.window.viewobject
        this.io.onTopic("display.#.#", (e)=>{
            const m = JSON.parse(e.toString())
            m.details.eventType = m.type
            if(this.eventHandlers.has(m.type)){
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


    _postRequest( data ){
        data.client_id = this.client_id
        return this.io.call('display-rpc-queue', JSON.stringify(data))
    }

    /*
        returns an array of screen details 
            - screenName
            - x
            - y
            - width
            - height
            - touchSupport
    */
    getScreens(){
        let cmd = {
            command : "get-screens"
        }
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }


    /*
        returns the active app context  as string
    */
    getActiveAppContext(){
        let cmd = {
            command : "get-active-app-context"
        }
        return this._postRequest(cmd).then(m=>{
            return m.toString()
        })
    }

    /*
        set the active app context  
        args: context (string)
    */
    setAppContext(context){
        let cmd = {
            command : "set-app-context",
            options : {
                context : context
            }
        }
        this.activeContext = context
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    /*
        closes an app context  
        args: context (string)
    */
    closeAppContext(context) {
        let cmd = {
            command : "close-app-context",
            options : {
                context : context
            }
        }
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

        /*
        hides an app context  
        args: context (string)
    */
    hideAppContext(context) {
        let cmd = {
            command : "hide-app-context",
            options : {
                context : context
            }
        }
        return this._postRequest(cmd).then(m=>{
            return JSON.parse(m.toString())
        })
    }

    /*
        creates a displayWindow 
        args: options (json object)
            - screenName (string)
            - appContext (string)
            - template (string - relative path to the template file)
            - x
            - y
            - width
            - height
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
    createWindow(options){
        if(!options.template)
            options.template = "index.html"

        let cmd = {
            command : 'create-window',
            options : options
        }

        return this._postRequest(cmd).then(m =>{
            // console.log(m.toString())
            let opt = JSON.parse(m.toString())
            return new DisplayWindow(this, opt)      
        })
    }
    
    getAllContexts(){
        let cmd = {
            command : 'get-all-contexts'
        }

        return this._postRequest(cmd).then(m =>{
            return JSON.parse(m.toString()) 
        })
    }

    getWindowById(id){
        return this.displayWindows.get(id)
    }

    getAllWindowIds(){
        return Object.keys(this.displayWindows)
    }

    getAllWindowIdsByContext(context){
        let cmd = {
            command : 'get-all-windows-by-context',
            options : {
                context : context
            }
        }

        return this._postRequest(cmd).then(m =>{
            return JSON.parse(m.toString()) 
        })
    }

    getViewObjectById(id){
        return this.viewObjects.get(id)
    }

    getAllViewObjectIds(){
        return Object.keys(this.viewObjects)
    }

    getAllViewObjectIdsByWindowId( w_id ){
        let ids = []
        this.viewObjects.forEach( (v,k)=>{
            if(v.window_id == w_id)
                ids.push(k)
        })
        return ids
    }

    closeAllWindows(){
        let cmd = {
            command : 'close-all-windows'
        }

        return this._postRequest(cmd).then(m =>{
            return JSON.parse(m.toString()) 
        })
    }
    
}