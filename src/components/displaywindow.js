const ViewObject = require('./viewobject')
/**
 * Class representing DisplayWindow
 * @class DisplayWindow
 */
class DisplayWindow {
    constructor(io, options) {
        this.io = io
        this.window_id = options.window_id
        this.windowName = options.windowName
        this.displayName = options.displayName
        this.displayContext = options.displayContext
        this.template = 'index.html'
        this.x = options.x
        this.y = options.y
        this.width = options.width
        this.height = options.height
    }

    _postRequest(data) {
        return this.io.call('rpc-display-' + this.displayName, JSON.stringify(data)).then(msg => msg.content)
    }

    id() {
        return this.window_id
    }

    /**
     * Clears grid defined in the display window
     * @returns {display_rpc_result}
     */
    clearGrid() {
        let cmd = {
            command: 'clear-grid',
            options: {
                window_id: this.window_id
            }
        }
        return this._postRequest(cmd).then(m => {
            return JSON.parse(m.toString())
        })
    }

    /**
     * Clears contents (viewobjects) defined in the display window
     * @returns {display_rpc_result}
     */
    clearContents() {
        let cmd = {
            command: 'clear-contents',
            options: {
                window_id: this.window_id
            }
        }
        return this._postRequest(cmd).then(m => {
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
                   [{ 'label' : 'cel-id-1',  left, top, width, height}, // in px or em or percent
                    { 'label' : 'cel-id-2',  left, top, width, height},
                    { 'label' : 'cel-id-3',  left, top, width, height},
                    ...
                    ]
            - gridBackground (json Object)
                {
                    'row|col' : 'backgroundColor',
                    'cel-id-1' : 'backgroundColor',
                    'cel-id-2' : 'backgroundColor',
                }
    */

    /**
     * Creates a  simple grid layout in the display window
     * @example <caption> A sample options object </caption>
     * 'contentGrid': {
            'row': 2,
            'col': 2,
            'padding': 5,
            'rowHeight' : [ 0.5, 0.5] // ( float array, height percent for each row - 0.0 to 1.0 )
            'colWidth' : [ 0.4, 0.6] //( float array,  width percent for each col - 0.0 to 1.0 )
        },
        'gridBackground' : {
            '1|1' : 'white',
            '1|2' : 'grey',
            '2|1' : 'grey',
            '2|2' : 'white'
        }
     * @param {Object} options
     * @returns {display_rpc_result}
     */
    createUniformGrid(options) {
        options.window_id = this.window_id
        let cmd = {
            command: 'create-grid',
            options: options
        }
        return this._postRequest(cmd).then(m => {
            return JSON.parse(m.toString())
        })
    }

    /**
     * adds a cell to the grid
     * @param {String} label
     * @param {Object.<{left: String, top: String, width : String, height: String}>} bounds
     * @param {String} backgroundStyle
     * @returns {display_rpc_result}
     */
    addToGrid(label, bounds, backgroundStyle) {
        let cmd = {
            command: 'add-to-grid',
            options: {
                window_id: this.window_id,
                label: label,
                bounds: bounds,
                style: backgroundStyle
            }
        }
        return this._postRequest(cmd).then(m => {
            return JSON.parse(m.toString())
        })
    }

    /**
     * Removes a cell from the grid
     * @param {String} label - cell label
     * @returns {display_rpc_result}
     */
    removeFromGrid(label) {
        let cmd = {
            command: 'remove-from-grid',
            options: {
                window_id: this.window_id,
                label: label
            }
        }
        return this._postRequest(cmd).then(m => {
            return JSON.parse(m.toString())
        })
    }

    /*
        returns the gridlayout

    */
    /**
     * get the grid layout object
     * @returns {Object}
     */
    getGrid() {
        let cmd = {
            command: 'get-grid',
            options: {
                window_id: this.window_id
            }
        }
        return this._postRequest(cmd).then(m => {
            return JSON.parse(m.toString())
        })
    }

    /**
     * gets the cell size of the uniform content grid
     * @returns {{width : Number, height : Number }}
     */
    getUniformGridCellSize() {
        let cmd = {
            command: 'uniform-grid-cell-size',
            options: {
                window_id: this.window_id
            }
        }
        return this._postRequest(cmd).then(m => {
            return JSON.parse(m.toString())
        })
    }

    /**
     * setting DisplayWindow cssText
     * label is row|col or custom cell name
     * js_css_style : http://www.w3schools.com/jsref/dom_obj_style.asp
     * @param {String} label
     * @param {String} js_css_style - based on  http://www.w3schools.com/jsref/dom_obj_style.asp
     * @param {Object} animation - based on W3 animation API
     * @returns {display_rpc_result}
     */
    setCellStyle(label, js_css_style, animation) {
        let cmd = {
            command: 'cell-style',
            options: {
                window_id: this.window_id,
                label: label,
                style: js_css_style
            }
        }
        if (animation) {
            cmd.options.animation_options = animation
        }

        return this._postRequest(cmd).then(m => {
            return JSON.parse(m.toString())
        })
    }

    /**
     * Sets the font size of the display window object
     * @param {String} px_string - font size in pixels
     * @returns {display_rpc_result}
     */
    setFontSize(px_string) {
        let cmd = {
            command: 'set-displaywindow-font-size',
            options: {
                window_id: this.window_id,
                fontSize: px_string
            }
        }
        return this._postRequest(cmd).then(m => {
            return JSON.parse(m.toString())
        })
    }

    /**
     * Hides the display window
     * @returns {display_rpc_result}
     */
    hide() {
        let cmd = {
            command: 'hide-window',
            options: {
                window_id: this.window_id
            }
        }
        return this._postRequest(cmd).then(m => {
            return JSON.parse(m.toString())
        })
    }

    /**
     * shows the displayWindow
     * @returns {display_rpc_result}
     * @memberOf DisplayWindow
     */
    show() {
        let cmd = {
            command: 'show-window',
            options: {
                window_id: this.window_id
            }
        }
        return this._postRequest(cmd).then(m => {
            return JSON.parse(m.toString())
        })
    }

    /**
     * closes the displayWindow and destroys the viewobjects
     * @returns {display_rpc_result}
     */
    close() {
        let cmd = {
            command: 'close-window',
            options: {
                window_id: this.window_id
            }
        }
        return this._postRequest(cmd).then(m => {
            m = JSON.parse(m.toString())
            m.viewObjects.forEach((v) => {
                let view = this.getViewObjectById(v)
                if (view) {
                    view.destroy()
                }
            })
            this.destroy()
            return m
        })
    }

    /**
     * opens debug console
     * @returns {display_rpc_result}
     */
    openDevTools() {
        let cmd = {
            command: 'window-dev-tools',
            options: {
                window_id: this.window_id,
                devTools: true
            }
        }
        return this._postRequest(cmd).then(m => {
            return JSON.parse(m.toString())
        })
    }

    /**
     * closes the debug console
     * @returns {display_rpc_result}
     */
    closeDevTools() {
        let cmd = {
            command: 'window-dev-tools',
            options: {
                window_id: this.window_id,
                devTools: false
            }
        }
        return this._postRequest(cmd).then(m => {
            return JSON.parse(m.toString())
        })
    }

    /**
     * gets the screen grab of the display window
     * @returns {Promise.<Buffer>}
     */
    capture() {
        let cmd = {
            command: 'capture-window',
            options: {
                window_id: this.window_id
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
    /**
     * Creates a view object in the window
     * @param {Object} options
     * @param {String} options.url
     * @param {Object|String} [options.position]
     * @param {Number} options.position.grid-top
     * @param {Number} options.position.grid-left
     * @param {String} options.width - in pixels or em
     * @param {String} options.height - in pixels or em
     * @param {boolean} options.nodeintegration
     * @param {String} options.cssText
     * @param {boolean} options.uiDraggable
     * @param {boolean} options.uiClosable
     * @param {object} options.deviceEmulation
     * @param {Number} options.deviceEmulation.scale
     * @returns {ViewObject}
     */
    createViewObject(options) {
        options.window_id = this.window_id
        options.displayContext = this.displayContext
        options.displayName = this.displayName
        options.windowName = this.windowName
        let cmd = {
            command: 'create-viewobj',
            options: options
        }

        return this._postRequest(cmd).then(m => {
            let opt = JSON.parse(m.toString())
            // opt.width = parseFloat(options.width)
            // opt.height = parseFloat(options.height)
            return new ViewObject(this.io, opt)
        })
    }
}

module.exports = DisplayWindow
