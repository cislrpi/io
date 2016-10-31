const DisplayWindow = require('./displaywindow')
const ViewObject = require('./viewobject')

module.exports = class DisplayContext {
    
    constructor(name,  options, io){
        this.io = io
        this.name = name
        this.displayWindows = new Map()
        this.viewObjects = new Map()
        this.io.getStore().addToSet("displayContexts", name)
        this.restoreFromStore(options)
        
        this.eventHandlers = new Map()
        this.io.onTopic("display.removed", m => {

            // clean up objects
            let closedDisplay = m.toString()
            let closedWindowObjId = this.displayWindows.get(closedDisplay) 
            this.displayWindows.delete(closedDisplay)
            let toRemove = []
            for( let [k,v] of this.viewObjects){
                if(v.displayName == closedDisplay)
                    toRemove.push(k)
            }
            
            for(let k = 0;k < toRemove.length; k++){
                this.viewObjects.delete(toRemove[k])
            }

            // call event handlers
            // let eventType = "displayRemoved"
            // let details = {
            //     type  :  eventType,
            //     displayName : closedDisplay,
            //     closedViewObjects : toRemove,
            //     closedWindowObjId : closedWindowObjId
            // }

            // if(this.eventHandlers.has( eventType )){
            //     for(let h of this.eventHandlers.get( eventType )){
            //         h(details)
            //     }
            // }

            //clear up the store
            this.io.getStore().getHash("dc." + this.name).then( m=>{
                 if( m != null) {
                    let mobj = JSON.parse(m.displayWinObjMap)
                    delete mobj[closedDisplay]
                    
                    let vobj = JSON.parse(m.viewObjDisplayMap)
                    for(let k = 0;k < toRemove.length; k++){
                        delete vobj[toRemove[k]]
                    }

                    this.io.getStore().addToHash("dc." + this.name, "displayWinObjMap", mobj)
                    this.io.getStore().addToHash("dc." + this.name, "viewObjDisplayMap", vobj)

                }
            })

        })

        this.io.onTopic("display.*", m => {
            console.log( m.toString() )
            // let openedDisplay = m.toString()
            // let eventType = "displayAdded"
            // let details = {
            //     type  :  eventType,
            //     displayName : openedDisplay
            // }

            // if(this.eventHandlers.has( eventType )){
            //     for(let h of this.eventHandlers.get( eventType )){
            //         h(details)
            //     }
            // }
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

    _postRequest( displayName, data ){
        return this.io.call('display-rpc-queue-' + displayName, JSON.stringify(data))
    }

    restoreFromStore(options){
        this.io.getStore().getHash("dc." + this.name ).then( m => {
            console.log(m)
            if( m == null) {
                console.log("initialize from options")
                if(options == undefined || Object.keys( options ).length === 0   ){
                    this.getDisplayBounds().then(  bounds => {
                        for( let k of Object.keys(bounds)){
                            bounds[k] = JSON.parse(bounds[k])
                            bounds[k].displayName = k
                            bounds[k].windowName = k
                            bounds[k].template = "index.html"
                            bounds[k].displayContext = this.name 
                        }
                        this.initialize(bounds) 
                    })
                }else{
                    for( let k of Object.keys(options)){
                        options[k].windowName = k
                        options[k].displayContext = this.name
                    }
                    this.initialize(options)
                }
            }else{
                console.log("restoring from store")
                this.displayWindows.clear()
                this.viewObjects.clear()

                if(m.displayWinObjMap){
                    let mobj = JSON.parse(m.displayWinObjMap)
                    // create WindowObjects based on  windowName , window_id
                    
                    for( let k of Object.keys(mobj)){
                        let opts = mobj[k]
                        this.displayWindows.set( k,  new DisplayWindow(this.io, opts))
                    }
                    
                    // create viewObjects based on view_id, windowName
                    if(m.viewObjDisplayMap){
                        let vobj = JSON.parse(m.viewObjDisplayMap)
                        for( let k of Object.keys(vobj)){
                            let wn = mobj[ vobj[k] ] 
                            let opts = {
                                "view_id" : k,
                                "window_id" : wn.window_id,
                                "displayName" : wn.displayName,
                                "displayContext" : this.name,
                                "windowName" : wn.windowName
                            }    
                            this.viewObjects.set( k,  new ViewObject(this.io, opts))
                        }
                    }
                }

                if(options['reset']){
                    console.log("making it active and reloading")
                    this.show().then( m => {
                        return this.reloadAll()
                    }).then( m=>{
                        console.log(m)
                    })
                }else{
                    console.log("making it active ")
                    this.show().then( m => {
                        return m
                    })
                }
            }
        })
    }

    // returns a map of displayName with bounds
    getDisplayBounds(){
        return this.io.getStore().getHash("display.displays")
    }

    // returns the window_object corresponding to the displayName
    getDisplayWindow(displayName){
        return this.displayWindows.get(displayName) 
    }

    getDisplayWindowById(window_id){
        for( let [k,v] of this.displayWindows){
            if(v.window_id === window_id)
                return v
        }
        return new Error( `Window id ${window_id} is not present`)
    }

    show(){
        let cmd = {
            command : "set-display-context",
            options : {
                context : this.name
            }
        }

        return this.getDisplayBounds().then( m => {
            let _ps = []
            for( let k of Object.keys(m)){
                _ps.push( this._postRequest(k, cmd) )
            }
            return Promise.all(_ps)
        })
    }

    hide() {
        let cmd = {
            command : "hide-display-context",
            options : {
                context : this.name
            }
        }
        return this.getDisplayBounds().then( m => {
            let _ps = []
            for( let k of Object.keys(m)){
                _ps.push( this._postRequest(k, cmd) )
            }
            return Promise.all(_ps)
        }).then( m => {
            return m
        })
    }

    close(){
        let cmd = {
            command : "close-display-context",
            options : {
                context : this.name
            }
        }
        return this.getDisplayBounds().then( m => {
            let _ps = []
            for( let k of Object.keys(m)){
                _ps.push( this._postRequest(k, cmd) )
            }
            return Promise.all(_ps)
        }).then( m => {
            console.log(m)
            let map = []
            for( var i = 0;i< m.length; i++){
                let res = JSON.parse(m[i].toString())
                map.push(res)                
            }
            console.log(map)
            this.displayWindows.clear()
            this.viewObjects.clear()
            this.io.getStore().delState('dc.' + this.name)
            this.io.getStore().removeFromSet("displayContexts", this.name)

            return map
        })          
    }

    reloadAll(){
        let _ps = []
        for( let [k,v] of this.viewObjects)
            _ps.push( v.reload() )
        
        return Promise.all(_ps).then( m => {
            console.log(m)
            let map = []
            for( var i = 0;i< m.length; i++){
                let res = JSON.parse(m[i].toString())
                map.push(res)                
            }
            console.log(map)
            return map
        })
    }
    
    /*
        initializes a displayWindow  for list of displays
        args:
         bounds : //(json object)
            {
                displayName1 : {
                     x : <int>,
                     y : <int>,
                     width : <int>,
                     height : <int>
                },
                displayName2 : ...
            }
         options : //(json object)
            {
                displayName1 : {
                    contentGrid : { //(for uniform grid)
                        row : <int>, // no of rows
                        col : <int>, // no of cols
                        rowHeight : < float array> , // height percent for each row - 0.0 to 1.0 )
                        colWidth : < float array>, // width percent for each col - 0.0 to 1.0 )
                        padding : <float> // in px or em
                        custom : [  // ( array of json Object)
                            { "label" : "cel-id-1",  left, top, width, height}, // in px or em or percent
                            { "label" : "cel-id-2",  left, top, width, height},
                            { "label" : "cel-id-3",  left, top, width, height},
                            ...
                        ],
                        gridBackground : {
                            "row|col" : "backgroundColor",
                            "cel-id-1" : "backgroundColor",
                            "cel-id-2" : "backgroundColor",
                        }
                },
                displayName2 : ...
            }
        
    */
    initialize( options ){
        return this.show().then( () => {
            let _ps = []
            for( let k of Object.keys(options)){
                let cmd = {
                    command : 'create-window',
                    options : options[k]
                }
                _ps.push( this._postRequest( k, cmd))
            }
            return Promise.all(_ps)
        }).then( m =>{
            console.log(m)
            let map = {}
            for( var i = 0;i< m.length; i++){
                let res = JSON.parse(m[i].toString())
                console.log(res)
                map[res.windowName] = res
                this.displayWindows.set(res.windowName , new DisplayWindow(this.io, res))
            }
            console.log(map)
            this.io.getStore().addToHash("dc." + this.name , "displayWinObjMap", JSON.stringify(map) )     
        })
    }

    getViewObjectById(id){
        return this.viewObjects.get(id)
    }

    getViewObjects(){
        return this.viewObjects
    }

    captureDisplayWindows(){
        let _ps = []
        for(let [k,v] of this.displayWindows ){
            _ps.add ( v.capture() )
        }
        return Promise.all(_ps)
    }

    createViewObject( windowName, options){
        return this.displayWindows.get(windowName).createViewObject(options).then( vo => {
            this.viewObjects.set( vo.view_id, vo)
            let map = {}
            for( let [ k,v] of this.viewObjects ){
                map[k] = v.windowName
            }
            this.io.getStore().addToHash("dc." + this.name , "viewObjDisplayMap", JSON.stringify(map) )
            return vo
        })
    }
}