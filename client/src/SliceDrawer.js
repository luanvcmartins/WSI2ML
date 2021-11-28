import OpenSeadragon from "openseadragon";
import _ from "lodash"

const freeDrawingDefaultKeyboardBehavior = function (func, e) {
    const drawer = this.instance
    switch (func) {
        case "keyDown":
            if (e.keyCode === 32) {
                this.drawer_panning = true
                // console.log("drawer_panning", this.drawer_panning)
                drawer.set_canvas_pan(true)
                if (drawer.currently_drawing != null)
                    drawer.currently_drawing.meta._enabled = false
            }
            break
        case "keyUp":
            if (e.keyCode === 13) {
                // User pressed ENTER, we will save the drawing
                drawer.set_canvas_pan(true)
                // Before saving, we remove the redundant points for this shape
                drawer.currently_drawing.geometry.points = optimizePath(drawer.currently_drawing.geometry.points)
                // Call the onFinishNewDrawing callback, which handles what happens to the shape
                drawer.callback.onFinishNewDrawing(drawer.currently_drawing.geometry)
                // Complete the drawing preview by resetting it
                drawer.currently_drawing = null
                if (drawer.stateRestorer != null) drawer.stateRestorer.cancel()
            }
            if (e.keyCode === 32) {
                this.drawer_panning = false
                // user released space, we will disable dragging
                drawer.set_canvas_pan(false)
            }
            if (e.keyCode === 27) {
                // User pressed ESC, we will reset the drawing
                drawer.currently_drawing = null
                if (drawer.stateRestorer != null) drawer.stateRestorer.cancel()
                drawer.set_canvas_pan(true)
            }
            break
    }
}

const lineFunction = function (point1, point2, point3) {
    const line1_slope = (point2.y - point1.y) / (point2.x - point1.x)
    const line2_slope = (point3.y - point2.y) / (point3.x - point2.x)
    const line1_b = point1.x * line1_slope - point1.y
    const line2_b = point3.x * line2_slope - point3.y
    return [
        {slope: line1_slope, b: line1_b},
        {slope: line2_slope, b: line2_b},
    ]
}

/**
 * A simple algorithm to detect and remove redundant points made in free draw. It returns an array of points
 * without the points that don't contribute to the shape.
 *
 * @param points the array of points
 * @returns {*}
 */
const optimizePath = function (points) {
    let toRemove = []
    do {
        console.log("New iteration")
        toRemove = []
        for (let i = 1; i < points.length - 1; i++) {
            const point1 = points[i - 1]
            const point2 = points[i]
            const point3 = points[i + 1]
            const lineFunc = lineFunction(point1, point2, point3)
            if (lineFunc[0].slope === lineFunc[1].slope && lineFunc[0].b === lineFunc[1].b) {
                // we could introduce a margin
                toRemove.push(i)
            }
        }

        for (let i = 1; i < points.length; i++) {
            const point1 = points[i - 1]
            const point2 = points[i]
            const distance1 = Math.hypot(point1.x - point2.x, point1.y - point2.y)
            if (distance1 < 3) {
                toRemove.push(i)
            }
        }

        console.log(toRemove.length, "points removed from", points.length, "(" + ((toRemove.length / points.length) * 100) + "%)")
        console.log("Size (before): ", points.length)
        points = points.filter((item, idx) => !toRemove.includes(idx))
        console.log("Size (after): ", points.length)

    } while (toRemove.length !== 0)
    // console.log(toRemove.length, "points removed from", points.length, "(" + ((toRemove.length / points.length) * 100) + "%)")
    // console.log("Size (before): ", points.length)
    // // for (let i = 0; i < toRemove.length; i++) {
    // //     points.splice(toRemove[i], 1)
    // // }
    // console.log("Size (after): ", points.length)
    return points
}

const nullTool = {
    name: "None",
    mouseEvent: function (func, e) {
    },
    keyboardEvent: function (func, e) {
    },
    init(instance) {
        return this
    }
}

const circleTool = {
    name: "circle",
    instance: null,
    geometry: null,
    mouseEvent(func, e) {
        const drawer = this.instance
        switch (func) {
            case "dblClick":
                if (this.geometry == null) {
                    const imagePosition = drawer._mousePointToImagePoint(e.position)
                    this.geometry = {
                        type: this.name,
                        points: [imagePosition, drawer._mousePointToImagePoint(e.position)],
                    }
                    drawer.currently_drawing = {
                        label: drawer.current_label,
                        geometry: this.geometry,
                        meta: {}
                    }
                    drawer.update()
                } else {
                    drawer.callback.onFinishNewDrawing(this.geometry)
                    drawer.currently_drawing = null
                    this.geometry = null
                    drawer.update()
                }
                break
            case "move":
                if (this.geometry != null) {
                    const imagePosition = drawer._mousePointToImagePoint(e.position)
                    this.geometry.points[1].x = imagePosition.x//-this.geometry.points[0].x
                    this.geometry.points[1].y = imagePosition.y //- this.geometry.points[0].y
                    drawer.update()
                }

                break
        }

    },
    keyboardEvent(func, e) {
        switch (func) {
            case 'keyUp':
                if (e.keyCode === 27) {
                    this.instance.currently_drawing = null
                    this.geometry = null
                    this.instance.update()
                }
                break
        }
    },
    init(instance) {
        this.instance = instance
        console.log("circle instantiated")
        return this
    }
}

const rulerTool = {
    name: "Ruler",
    instance: null,
    startingPoint: null,
    endingPoint: null,
    active: false,
    perpendicular: 0,

    perpendicularLine(point1, point2) {
        const line1_slope = (point2.y - point1.y) / (point2.x - point1.x)
        const line1_b = point1.x * line1_slope - point1.y
        return {slope: -1 / line1_slope, b: -1 / line1_b}
    },

    mouseEvent(func, e) {
        const drawer = this.instance
        switch (func) {
            case "dblClick":
                if (!this.active && this.startingPoint != null && this.endingPoint != null) {
                    this.active = false
                    this.startingPoint = null
                    this.endingPoint = null
                } else if (this.startingPoint == null) {
                    this.startingPoint = drawer._mousePointToImagePoint(e.position)
                    this.active = true
                } else {
                    this.endingPoint = drawer._mousePointToImagePoint(e.position)
                    this.perpendicular = this.perpendicularLine(this.startingPoint, this.endingPoint)
                    this.active = false
                }
                drawer.update()
                break
            case "move":
                if (this.active) {
                    this.endingPoint = drawer._mousePointToImagePoint(e.position)
                    this.perpendicular = this.perpendicularLine(this.startingPoint, this.endingPoint)
                    drawer.update()
                }
                break

        }
    },
    keyboardEvent(func, e) {
        if (func === 'keyUp' && e.keyCode === 27) {
            this.active = false
            this.startingPoint = null
            this.endingPoint = null
            this.instance.update()
        }
    },

    draw(ctx) {
        if (this.startingPoint != null && this.endingPoint != null) {
            const drawer = this.instance
            const startPoint = drawer._imagePointToCanvasPoint(this.startingPoint.x, this.startingPoint.y)
            const endPoint = drawer._imagePointToCanvasPoint(this.endingPoint.x, this.endingPoint.y)
            const distance = Math.hypot(this.startingPoint.x - this.endingPoint.x, this.startingPoint.y - this.endingPoint.y)
            // const perpendicular = this.perpendicularLine(startPoint, endPoint)
            const ruler = new Path2D()
            ruler.moveTo(startPoint.x, startPoint.y)
            ruler.lineTo(endPoint.x, endPoint.y)

            // const angle = perpendicular.slope
            // const direction = [Math.sin(angle), Math.cos(angle)]
            // const direction = [perpendicular.slope, perpendicular.slope]
            // const m1X = ((startPoint.y - 30) - perpendicular.b) / perpendicular.slope
            // const m2X = ((startPoint.y + 30) - perpendicular.b) / perpendicular.slope
            /**
             * perpendicular = y=x*slope+b
             * startingPoint = (x0,y0)
             * distancia = 3 pixels
             * distancia^2 = (x1-x2)^2 + (y1-y2)^2 // y2 = x2*slope+b
             * (x2,y2) = perpendicular
             */
            // ruler.moveTo(startPoint.x - direction[0] * 30, startPoint.y - direction[1] * 30)
            // ruler.lineTo(startPoint.x + direction[0] * 30, startPoint.y + direction[1] * 30)
            ctx.lineWidth = 3
            ctx.setLineDash([5, 5])
            ctx.strokeStyle = "black"
            ctx.lineCap = "round"
            ctx.stroke(ruler)
            ctx.setLineDash([])
            ctx.lineWidth = 1
            ctx.strokeStyle = "white"
            ctx.font = "30px Arial"
            ctx.fillStyle = "black"
            const text = (distance * drawer.pixel_width).toFixed(2) + "µm"
            ctx.fillText(text, 30 + startPoint.x + ((endPoint.x - startPoint.x) / 2), startPoint.y + ((endPoint.y - startPoint.y) / 2))
            ctx.strokeText(text, 30 + startPoint.x + ((endPoint.x - startPoint.x) / 2), startPoint.y + ((endPoint.y - startPoint.y) / 2))
        }
    },
    init(instance) {
        this.instance = instance
        return this
    }
}

const polygonTool = {
    name: "polygon",
    instance: null,
    geometry: null,

    info(...help) {
        let info = []
        if (help.includes("start"))
            info.push("[db-Click] To put the first point")
        if (help.includes("start-2"))
            info.push("[db-Click] To put the second point")
        if (help.includes("save"))
            info.push("[Enter] To save annotation")
        if (help.includes("undo"))
            info.push("[Esc] To undo")
        if (help.includes("continue"))
            info.push("[Click] To continue dragging")
        if (help.includes("point"))
            info.push("[db-Click] To add a point")
        if (help.includes("cancel"))
            info.push("[Esc] To cancel")
        this.instance.callback.onInfoUpdate(info)
    },

    mouseEvent: function (func, e) {
        const drawer = this.instance
        const imagePosition = drawer._mousePointToImagePoint(e.position)
        switch (func) {
            case "dblClick":
                // On double click, we will create a new drawing if there none in the moment
                if (drawer.currently_drawing == null) {
                    this.geometry = {
                        type: "polygon",
                        points: [imagePosition, imagePosition]
                    }
                    drawer.currently_drawing = {
                        label: drawer.current_label,
                        geometry: this.geometry,
                        meta: {}
                    }

                    drawer.stateRestorer = StateRestorer.init(drawer, this.geometry)
                    this.info("start-2", "cancel")
                } else {
                    // On double click we will continue the drawing by adding the new
                    this.geometry.points.push(imagePosition)
                    drawer.stateRestorer.addRestorePoint("point")
                    this.info("save", "undo", "point")
                }
                break
            case "move":
                if (drawer.currently_drawing != null) {
                    // On mouse move we will update the preview if we currently drawing
                    this.geometry.points[this.geometry.points.length - 1] = imagePosition
                    drawer.update()
                }
                break
        }
    },

    keyboardEvent: function (func, e) {
        const drawer = this.instance
        // We are only interested in this events if we are drawing
        if (drawer.currently_drawing != null)
            switch (func) {
                case "keyUp":
                    if (e.keyCode === 13) {
                        // User pressed enter, we will complete the drawing
                        this.geometry.points.pop()
                        drawer.callback.onFinishNewDrawing(this.geometry)
                        drawer.currently_drawing = null
                        drawer.stateRestorer.cancel()
                        this.info("")
                    }
                    if (e.keyCode === 27) {
                        // User pressed ESC, undo the drawing
                        if (drawer.currently_drawing.geometry.points.length > 3) {
                            // Undo the last point added
                            this.geometry.points.splice(this.geometry.points.length - 2, 1)

                            this.info("save", "point", this.geometry.points.length > 3 ? "undo" : "cancel")
                        } else {
                            // Cancel the drawing
                            drawer.currently_drawing = null
                            drawer.stateRestorer.cancel()
                            this.info("")
                        }
                        drawer.update()
                    }
                    break
            }
    },

    init(instance) {
        this.instance = instance
        this.info("start")
        return this
    }
}

const rectTool = {
    name: "rect",
    instance: null,
    geometry: null,

    info(...help) {
        let info = []
        if (help.includes("start"))
            info.push("[db-Click] To start rect")
        if (help.includes("save"))
            info.push("[db-Click] To finish and save")
        if (help.includes("cancel"))
            info.push("[Esc] To cancel")
        this.instance.callback.onInfoUpdate(info)
    },

    mouseEvent: function (func, e) {
        const drawer = this.instance
        const imagePosition = drawer._mousePointToImagePoint(e.position)
        switch (func) {
            case "dblClick":
                if (drawer.currently_drawing == null) {
                    // We will start the drawing
                    this.geometry = {
                        type: this.name,
                        points: [imagePosition, imagePosition]
                    }
                    drawer.currently_drawing = {
                        label: drawer.current_label,
                        geometry: this.geometry,
                        meta: {},
                    }
                    this.info("save", "cancel")
                } else {
                    // We will stop the drawing.
                    // We will assure point1 < point2
                    ['x', 'y'].map(dim => {
                        if (this.geometry.points[0][dim] > this.geometry.points[1][dim]) {
                            const temp = this.geometry.points[0][dim]
                            this.geometry.points[0][dim] = this.geometry.points[1][dim]
                            this.geometry.points[1][dim] = temp
                        }
                    })
                    // report the drawing is over
                    drawer.callback.onFinishNewDrawing(this.geometry)
                    drawer.currently_drawing = null
                    drawer.stateRestorer.cancel()
                    this.info("start")
                }
                drawer.update()
                break
            case "move":
                if (drawer.currently_drawing != null) {
                    drawer.currently_drawing.geometry.points[1] = imagePosition
                    drawer.update()
                }
                break
        }
    },
    keyboardEvent: function (func, e) {
        const drawer = this.instance
        switch (func) {
            case 'keyUp':
                if (e.keyCode === 27) {
                    // User pressed ESC, we will cancel the drawing
                    drawer.currently_drawing = null
                    drawer.update()
                    this.info("start")
                }
                break
        }
    },
    init(instance) {
        this.instance = instance
        this.info("start")
        return this
    }
}

const freeTool = {
    name: "free",
    instance: null,
    drawer_panning: false,
    geometry: null,

    info(...help) {
        let info = []
        if (help.includes("pan"))
            info.push("[Space] To drag the image")
        if (help.includes("start"))
            info.push("[Click] To start drawing")
        if (help.includes("save"))
            info.push("[Enter] To save annotation")
        if (help.includes("continue"))
            info.push("[Click] To continue drawing")
        if (help.includes("cancel"))
            info.push("[Esc] To cancel")
        this.instance.callback.onInfoUpdate(info)
    },

    mouseEvent: function (func, e) {
        const drawer = this.instance
        const imagePosition = drawer._mousePointToImagePoint(e.position)
        switch (func) {
            case "press":
                drawer.set_canvas_pan(false)
                if (!this.drawer_panning) {
                    if (drawer.currently_drawing == null) {
                        this.geometry = {
                            type: "polygon",
                            points: [imagePosition],
                        }
                        drawer.currently_drawing = {
                            label: drawer.current_label,
                            geometry: this.geometry,
                            meta: {_enabled: true}
                        }

                        drawer.stateRestorer = StateRestorer.init(drawer, this.geometry)
                    } else
                        drawer.currently_drawing.meta._enabled = true

                    this.info("pan")
                }
                // return true
                break
            case "move":
                if (!this.drawer_panning && drawer.currently_drawing != null && drawer.currently_drawing.meta._enabled) {
                    this.geometry.points.push(imagePosition)
                    drawer.stateRestorer.addRestorePoint("point")
                    // this.info("start", "pan")
                    // return true
                }
                break
            case "release":
                if (drawer.currently_drawing != null)
                    drawer.currently_drawing.meta._enabled = false
                this.info("continue", "pan", "save", "cancel")

                break
        }
        drawer.update()
    },
    keyboardEvent: freeDrawingDefaultKeyboardBehavior,
    init(instance) {
        this.instance = instance
        instance.set_canvas_pan(false)
        this.info("start", "pan")
        return this
    }
}


const brushTool = {
    name: "brush",
    instance: null,
    size: 500,
    drawer_panning: false,
    geometry: null,

    mouseEvent: function (func, e) {
        const drawer = this.instance
        const imagePosition = drawer._mousePointToImagePoint(e.position)
        switch (func) {
            case "press":
                if (this.drawer_panning) return
                drawer.set_canvas_pan(false)

                if (drawer.currently_drawing == null) {
                    this.geometry = {
                        type: "brush",
                        size: this.size,
                        points: [imagePosition]
                    }
                    drawer.currently_drawing = {
                        label: drawer.current_label,
                        geometry: this.geometry,
                        meta: {_enabled: true},
                    }
                    // drawer.stateRestorer = StateRestorer.init(drawer, this.geometry)
                }
                break
            case "move":
                if (!this.drawer_panning && drawer.currently_drawing != null && drawer.currently_drawing.meta._enabled)
                    this.geometry.points.push(imagePosition)
                break
            case "release":
                if (drawer.currently_drawing != null)
                    drawer.currently_drawing.meta._enabled = false
                drawer.set_canvas_pan(true)

                break
        }
        drawer.update()
    },

    keyboardEvent: freeDrawingDefaultKeyboardBehavior,


    init(instance) {
        this.instance = instance
        instance.set_canvas_pan(false)
        return this
    }
}

const PathMeshEraser = {
    editor: null,
    active: false,

    mouseEvent: function (func, e) {
        const editor = this.editor
        const drawer = editor.instance

        switch (func) {
            case "press":
                this.active = true
                drawer.set_canvas_pan(false)
                break
            case "release":
                this.active = false
                drawer.set_canvas_pan(true)
                break
            case "move":
                if (this.active === true) {
                    const mousePosition = drawer._mousePointToImagePoint(e.position)
                    // On the eraser mode, we will check if for intersection and remove those elements
                    editor.controls.some(control => {
                        if (editor.intersectsControl(mousePosition, control.point)) {
                            // We will remove this line
                            const index = editor.geometry.points.indexOf(control.point)
                            editor.geometry.points.splice(index, 1)
                            editor.controls.splice(index, 1)
                            editor.addRestorePoint("erased")
                            return true // stop iterating
                        }
                    })
                    drawer.update()
                }
                break
        }

    },

    init(editor) {
        this.editor = editor
        return this
    }
}

const PathMeshMover = {
    editor: null,
    control: null,

    mouseEvent: function (func, e) {
        const editor = this.editor
        const drawer = editor.instance
        switch (func) {
            case "press":
                const mousePosition = drawer._mousePointToImagePoint(e.position)
                // On the dragging mode, the node is dragged to the
                editor.controls.forEach(control => {
                    const position = control.point
                    const intersects = editor.intersectsControl(mousePosition, position)
                    if (intersects) {
                        // User is dragging with this element
                        this.control = control
                        drawer.set_canvas_pan(false)
                    }
                })

                break
            case "release":
                this.control = null
                drawer.set_canvas_pan(true)
                editor.addRestorePoint("moved")
                break
            case "move":
                if (this.control != null) {
                    const mousePosition = drawer._mousePointToImagePoint(e.position)
                    this.control.point.x = mousePosition.x
                    this.control.point.y = mousePosition.y
                    drawer.update()
                }
                break
        }
    },

    init(editor) {
        this.editor = editor
        return this
    }
}

const PathMeshCreator = {
    editor: null,
    cursor: null,
    instance: null,

    checkPathCreation(position) {
        const points = this.editor.geometry.points
        for (let i = 1; i < points.length; i++) {
            const point1 = points[i - 1]
            const point2 = points[i]
            const left = Math.min(point1.x, point2.x) - 10
            const right = Math.max(point1.x, point2.x) + 10
            const top = Math.min(point1.y, point2.y) - 10
            const bottom = Math.max(point1.y, point2.y) + 10

            if (left < position.x && position.x < right &&
                top < position.y && position.y < bottom) {
                return i
            }
        }
        return null
    },

    mouseEvent: function (func, e) {
        const editor = this.editor
        const drawer = editor.instance
        const position = drawer._mousePointToImagePoint(e.position)
        switch (func) {
            case "move":
                if (drawer.ctx.isPointInPath(editor.annotation.meta.path, e.position.x, e.position.y)) {
                    const newIndex = this.checkPathCreation(position)
                    // console.log("check", newIndex)
                    if (newIndex != null) {
                        this.cursor = {position: position, index: newIndex}
                    } else {
                        this.cursor = null
                    }
                    drawer.update()
                } else {
                    if (this.cursor != null) {
                        this.cursor = null
                        drawer.update()
                    }
                }
                break
            case "click":
                if (drawer.ctx.isPointInPath(editor.annotation.meta.path, e.position.x, e.position.y)) {
                    const points = editor.geometry.points
                    const newIndex = this.checkPathCreation(position)
                    if (newIndex != null) {
                        editor.addRestorePoint("created")
                        points.splice(newIndex, 0, position)
                    }
                    console.log("Ended")
                    editor.create_controls()
                    drawer.update()
                }
                break
        }
    },

    draw(ctx) {
        const instance = this.instance
        // Drawing the reference cursor where the new point will appear
        ctx.beginPath()
        if (this.cursor != null) {
            const points = this.editor.geometry.points
            const position = instance._imagePointToCanvasPoint(this.cursor.position.x, this.cursor.position.y)
            ctx.ellipse(position.x, position.y, 5, 5, 0, 2 * Math.PI, 0, false)
            const prevPoint = instance._imagePointToCanvasPoint(points[this.cursor.index - 1].x, points[this.cursor.index - 1].y)
            const nextPoint = instance._imagePointToCanvasPoint(points[this.cursor.index].x, points[this.cursor.index].y)
            ctx.moveTo(prevPoint.x, prevPoint.y)
            ctx.lineTo(position.x, position.y)
            ctx.lineTo(nextPoint.x, nextPoint.y)
            ctx.fill()
            ctx.stroke()
        }
    },

    init(editor) {
        this.editor = editor
        this.instance = editor.instance
        return this
    }
}

const PathMeshFreeEditor = {
    currently_drawing: null,
    current_path: null,
    editor: null,
    editing: false,
    panning: false,
    mouseEvent(func, e) {
        const editor = this.editor
        const annotation = editor.annotation
        const instance = editor.instance
        const position = editor.instance._mousePointToImagePoint(e.position)
        switch (func) {
            case "press":
                if (this.currently_drawing == null) {
                    if (editor.instance.ctx.isPointInPath(annotation.meta.path, e.position.x, e.position.y)) {
                        this.currently_drawing = []
                        this.editing = true
                        instance.set_canvas_pan(false)
                    }
                } else {
                    this.editing = true
                    instance.set_canvas_pan(false)
                }
                break
            case "move":
                if (this.panning) return
                if (this.currently_drawing != null && this.editing) {
                    this.currently_drawing.push(position)
                    editor.instance.update()
                }
                break
            case "release":
                this.editing = false
                instance.set_canvas_pan(true)
                break
        }
    },

    polygonOrientation(points) {
        let sum = 0
        const li = points.length
        for (let i = 1; i < li; i++)
            sum += (points[i].x - points[i - 1].x) * (points[i].y + points[i - 1].y)
        sum += (points[li - 1].x - points[li - 2].x) * (points[li - 1].y + points[li - 2].y)
        return sum > 0
    },

    keyboardEvent: function (func, e) {
        const drawer = this.editor.instance
        switch (func) {
            case "keyUp":
                if (e.keyCode === 32) {
                    drawer.set_canvas_pan(false)
                    this.panning = false
                } else if (e.keyCode === 27) {
                    drawer.set_canvas_pan(true)
                    this.currently_drawing = null
                    drawer.update()
                } else if (e.keyCode === 13) {
                    drawer.set_canvas_pan(true)
                    const intersects = (path, point) => {
                        const canvasPoint = drawer._imagePointToCanvasPoint(point.x, point.y)
                        return drawer.ctx.isPointInPath(path, canvasPoint.x, canvasPoint.y, "nonzero")
                    }
                    const originalToRemove = this.editor.geometry.points.map((item, index) => {
                        if (intersects(this.current_path, item)) return index
                    }).filter(item => item != null)
                    const additionToRemove = this.currently_drawing.map((item, index) => {
                        if (intersects(this.editor.geometry.path, item)) return index
                    }).filter(item => item != null)
                    console.log("Original To Remove", originalToRemove, additionToRemove)
                    const newOriginalPath = this.editor.geometry.points.filter((i, idx) => !originalToRemove.includes(idx))
                    const newAdditionPath = this.currently_drawing.filter((i, idx) => !additionToRemove.includes(idx))
                    console.log("newOriginalPath:", newOriginalPath)
                    console.log("newAdditionPath:", newAdditionPath)

                    const originalX = this.polygonOrientation(newOriginalPath)
                    const additionX = this.polygonOrientation(newAdditionPath)
                    console.log("Order:", originalX, additionX)
                    if (additionX !== originalX) {
                        console.log("Reversing array")
                        // newAdditionPath.reverse()
                    }

                    let oIndex = 1, aIndex = 0
                    const newPath = [newOriginalPath[0]]
                    do {
                        const cPoint = newPath[newPath.length - 1]
                        const oPoint = newOriginalPath[oIndex]
                        const aPoint = newAdditionPath[aIndex]

                        const oDistance = oIndex < newOriginalPath.length ? Math.hypot(cPoint.x - oPoint.x, cPoint.y - oPoint.y) : -1
                        const aDistance = aIndex < newAdditionPath.length ? Math.hypot(cPoint.x - aPoint.x, cPoint.y - aPoint.y) : -1

                        console.log("Iteration | ", cPoint, oIndex, aIndex, "|", oDistance, aDistance)
                        if (oDistance === -1 && aDistance === -1) {
                            break
                        } else if (aDistance === -1 || (oDistance !== -1 && oDistance < aDistance)) {
                            newPath.push(oPoint)
                            oIndex++
                        } else if (oDistance === -1 || (aDistance !== -1 && oDistance > aDistance)) {
                            newPath.push(aPoint)
                            aIndex++
                        }
                    } while (oIndex < newOriginalPath.length || aIndex < newAdditionPath.length)
                    this.editor.geometry.points = optimizePath(newPath)
                    this.editor.instance.update()
                    return false
                    // const newToRemove =
                }
                break
            case "keyDown":
                if (e.keyCode === 32) {
                    drawer.set_canvas_pan(true)
                    this.panning = true
                }
                break
        }

        // We are going to handle the input
        return true
    },


    draw(ctx) {
        const points = this.currently_drawing
        if (points != null) {
            const path = new Path2D()
            const firstPosition = this.editor.instance._imagePointToCanvasPoint(points[0].x, points[0].y)
            ctx.beginPath()
            path.moveTo(firstPosition.x, firstPosition.y)

            points.forEach(point => {
                const position = this.editor.instance._imagePointToCanvasPoint(point.x, point.y)
                path.lineTo(position.x, position.y)
            })
            path.closePath()
            this.current_path = path
            ctx.stroke(path)
        }
    },

    init(editor) {
        this.editor = editor
        this.currently_drawing = null
        return this
    }
}

const PathMeshEditor = {
    annotation: null,
    geometry: null,
    controls: [],
    instance: null,
    mode: null,
    current_history_point: 0,
    history: [],

    addRestorePoint: function (event) {
        if (this.history.length > 0 && this.current_history_point !== this.history.length - 1) {
            // We are overriding the past, we will clear the states
            console.log("clearing future:", this.history.length)
            this.history.splice(this.current_history_point, this.history.length - this.current_history_point)
            console.log("clearing future:", this.history.length)
        }
        this.history.push({
            type: event,
            points: this.geometry.points.map(item => {
                return {x: item.x, y: item.y}
            })
        })
        this.current_history_point = this.history.length - 1
        this.instance.callback.onEditingEvent()
    },

    restoreState: function (value) {
        console.log("restoreState", value, this.history)
        this.geometry.points = this.history[value].points
        this.create_controls()
        this.instance.update()
        this.current_history_point = value
    },

    intersectsControl: function (mousePosition, position) {
        const drawer = this.instance
        const areaRadius = (drawer._viewportLocation.max.y - drawer._viewportLocation.min.y) / drawer.canvas.clientWidth * 25
        // console.log("intersects radius:", areaRadius, drawer._viewportLocation)
        return mousePosition.x > position.x - areaRadius && mousePosition.x < position.x + areaRadius &&
            mousePosition.y > position.y - areaRadius && mousePosition.y < position.y + areaRadius
    },

    mouseEvent: function (func, e) {
        this.mode.mouseEvent(func, e)
    },

    keyboardEvent: function (func, e) {
        const drawer = this.instance

        if (typeof this.mode.keyboardEvent === "function") {
            if (this.mode.keyboardEvent(func, e))
                return
        }

        console.log(func, e)
        switch (func) {
            case "keyUp":
                if (e.keyCode === 27) {
                    // User pressed ESC. The edition is cancelled and the shape must be restored
                    this.geometry.points = this.original_points
                    this.geometry.color = this.original_color
                    // Notify the editing has ended without changes
                    drawer.callback.onFinishedEditing(false, this.geometry)
                    // Disable the editing tool and update view
                    drawer.currently_editing = null
                    drawer.update()
                } else if (e.keyCode === 13) {
                    // Notify the editing has ended with changes
                    drawer.callback.onFinishedEditing(true, this.geometry)
                    // Disable the editing tool and update view
                    drawer.currently_editing = null
                    drawer.update()
                }
                break
        }
    },

    cancel() {
        const drawer = this.instance
        this.geometry.points = this.original_points
        this.geometry.color = this.original_color
        // Notify the editing has ended without changes
        drawer.callback.onFinishedEditing(false, this.geometry)
        // Disable the editing tool and update view
        drawer.currently_editing = null
        drawer.update()
    },

    draw(ctx) {
        const drawer = this.instance
        ctx.lineWidth = 1
        // We will draw the controls we have:
        this.controls.forEach(control => {
            ctx.beginPath()
            const position = drawer._imagePointToCanvasPoint(control.point.x, control.point.y)
            ctx.ellipse(position.x, position.y, 5, 5, 0, 2 * Math.PI, 0, false)

            ctx.fillStyle = "rgb(255,255,255)"
            ctx.fill()
            ctx.strokeStyle = "black"
            ctx.stroke()
            control._canvas_pos = position
        })


        if (typeof this.mode.draw === "function")
            this.mode.draw(ctx)
    },

    create_controls: function () {
        this.controls = this.geometry.points.map(point => {
            return {point: point}
        })
    },

    create_mode: function (mode) {
        if (mode === "eraser") {
            this.mode = PathMeshEraser.init(this)
        } else if (mode === "mover") {
            this.mode = PathMeshMover.init(this)
        } else if (mode === "creator") {
            this.mode = PathMeshCreator.init(this)
        } else if (mode === "free") {
            this.mode = PathMeshFreeEditor.init(this)
        }
    },


    init(instance, annotation, mode) {
        this.instance = instance
        this.annotation = annotation
        const geometry = annotation.geometry
        this.geometry = geometry
        this.original_points = geometry.points.map(point => {
            return {x: point.x, y: point.y}
        })
        this.original_color = geometry.color != null ? geometry.color.map(color => color) : [0, 0, 0]
        this.geometry = geometry
        this.create_controls()
        this.create_mode(mode)
        this.history = []
        return this
    }
}


/* the conversion from pixel to shape may be done with a search algorithm.
The points are the pixels which were unable to find add one of its side to the search*/

const StateRestorer = {
    instance: null,
    geometry: null,
    states: [],
    current_state_point: 0,

    addRestorePoint(event) {
        if (this.states.length > 0 && this.current_state_point !== this.states.length - 1) {
            // We are overriding the past, we will clear the states
            this.states.splice(this.current_state_point, this.states.length - this.current_state_point)
            console.log("clearing future:", this.states.length)
        }
        this.states.push({
            type: event,
            points: this.geometry.points.map(item => { // todo not all elements have points
                return {x: item.x, y: item.y}
            })
        })
        this.current_state_point = this.states.length - 1
        this.instance.callback.onStateRestorerEvent(this)
        // todo report state changed
    },

    restoreToPoint(value) {
        console.log("restoreToPoint", value)
        this.geometry.points = this.states[value].points
        this.instance.update()
        this.current_state_point = value
        this.instance.callback.onStateRestorerEvent(this)
    },
    cancel() {
        this.instance.stateRestorer = null
        this.states = null
        this.instance.callback.onStateRestorerEvent(null)
    },
    init(instance, geometry) {
        this.instance = instance
        this.geometry = geometry
        this.states = []
        instance.callback.onStateRestorerEvent(this)
        return this
    }
}

export default {
    annotations: [],

    current_label: null,

    /**
     * When false, SliceDrawer doesn't allow any drawing
     */
    enabled: true,

    /**
     * Elements currently being rendering are added to this list. This list is mostly used to check
     * mouse interaction with the elements.
     */
    elementsOnScreen: [],

    stateRestorer: null,

    /**
     * The current drawing tool
     */
    set tool(name) {
        this.new_tool = this.tools[name]()
        this.set_canvas_pan(true)
        this.viewer.canvas.focus()
    },
    get tool() {
        if (this.new_tool != null)
            return this.new_tool.name
        else return "none"
    },

    set editorMode(name) {
        this.currently_editing.create_mode(name)
        this.viewer.canvas.focus()
    },
    get editorMode() {
        return ""
    },

    /**
     *
     */
    pixel_width: 0,

    tools: {},

    drawingStyle: {
        region_opacity: 0.3,
        line_weight: 1
    },

    /**
     * Elements can be filtered so it won't render.
     * Label => boolean
     */
    filtering: {},

    /**
     * The element being currently edited.
     * We may be able to join two paths by checking if a given point intersects the other shape. Points from
     * both shapes that intersects another are added to a list for removal. Once we have a list, we remove the elements.
     * The new shape is created by joining the points from the two path in the index of the first removed element.
     * Arbitrary shapes (brush, rect) may be converted to path (by sampling and optimizing) before being joined.
     * The shapes may be joined after the drawing.
     */
    currently_editing: null,

    new_tool: null,

    /**
     * The polygon currently being draw
     */
    currently_drawing: null,

    /**
     * Throttle behavior for improving performance when there are too many elements to draw
     */
    _lastUpdate: 0,

    /**
     * Keeps track of the viewport in image pixels. This is used to notify when the
     * canvas is dirty and needs to be redraw.
     */
    _viewportLocation: {min: [], max: []},

    editElement(annotation) {
        this.currently_editing = PathMeshEditor.init(this, annotation, "mover")
        this.update()
        // Finally, we save the first state as a restoration point for the user
        this.currently_editing.addRestorePoint("editing")
    },

    concludeEdit() {
        // Disable the editing tool and update view
        console.log("concludeEdit:", this.currently_editing.geometry)
        this.callback.onFinishedEditing(true, this.currently_editing.geometry)
        this.currently_editing = null
        this.update()
    },

    cancelEdit() {
        this.currently_editing.cancel()
        this.currently_editing = null
        this.update()
    },

    resize: function () {
        this.canvas.width = this.viewer.canvas.clientWidth
        this.canvas.height = this.viewer.canvas.clientHeight
    },

    _mousePointToImagePoint(mouseEvent) {
        const viewportPoint = this.viewer.viewport.pointFromPixel(mouseEvent)
        const coordinates = this.viewer.viewport.viewportToImageCoordinates(viewportPoint.x, viewportPoint.y)
        return {x: coordinates.x, y: coordinates.y}
    },

    _imagePointToCanvasPoint(x, y) {
        const point = new OpenSeadragon.Point(x, y)
        return this.viewer.viewport.imageToViewerElementCoordinates(point)
    },

    update: function () {
        // console.log("update called", this.annotations)
        if (this.ctx == null) return

        const ctx = this.ctx
        if (this._lastUpdate > Date.now() - (this.elementsOnScreen.length / 5)) {
            return
        }
        ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
        if (this.annotations == null) {
            return
        }

        const viewportMin = this._viewportLocation.min
        const viewportMax = this._viewportLocation.max
        this.elementsOnScreen = []
        this.annotations.forEach(annotation => {
            if (this.filtering[annotation.label.name] && annotation.geometry != null) {
                // We will only draw when the label of the element isn't filter out
                const firstPoint = annotation.geometry.points[0]
                if ((firstPoint.x > viewportMin.x && firstPoint.x < viewportMax.x)
                    && (firstPoint.y > viewportMin.y && firstPoint.y < viewportMax.y)) {
                    this._draw_annotation(annotation)
                    this.elementsOnScreen.push(annotation)
                }
            }
        })
        if (this.currently_drawing != null)
            this._draw_annotation(this.currently_drawing)

        // We are editing a element, let's draw the controls
        if (this.currently_editing != null)
            this.currently_editing.draw(ctx)

        if (typeof this.new_tool.draw === "function")
            this.new_tool.draw(ctx)

        this._lastUpdate = Date.now()
    },

    _draw_annotation: function (annotation) {
        switch (annotation.geometry.type) {
            case "polygon":
                this._update_polygon(annotation)
                break
            case "rect":
                this._update_rect(annotation)
                break
            case "circle":
                this._update_circle(annotation)
                break
            case "brush":
                this._update_brush(annotation)
                break
        }
    },

    _gen_color(rgb) {
        return `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`
    },

    _update_polygon: function (annotation, color) {
        const ctx = this.ctx
        const points = annotation.geometry.points
        const color_code = this._gen_color(color == null ? annotation.label.color : color)
        const path = this._update_path(points)

        const startPoint = this._imagePointToCanvasPoint(points[0].x, points[0].y)
        path.lineTo(startPoint.x, startPoint.y)
        annotation.meta.path = path
        ctx.fillStyle = `rgba(${color_code}, ${annotation.meta.is_hover ? '0.6' : this.drawingStyle.region_opacity})`
        ctx.strokeStyle = `rgb(${color_code})`
        ctx.lineWidth = this.drawingStyle.line_weight
        ctx.fill(path)
        ctx.stroke(path)
    },

    _update_rect: function (annotation, color) {
        // console.log(rect_data)
        const ctx = this.ctx
        const position = this._imagePointToCanvasPoint(annotation.geometry.points[0].x, annotation.geometry.points[0].y)
        const limits = this._imagePointToCanvasPoint(annotation.geometry.points[1].x, annotation.geometry.points[1].y)
        const color_code = this._gen_color(color == null ? annotation.label.color : color)
        ctx.beginPath()
        ctx.rect(position.x, position.y, limits.x - position.x, limits.y - position.y)
        annotation.meta._canvas_points = [position, limits]
        // console.log("_update_rect", position.x, position.y, position.x - limits.x, position.y - limits.y)
        ctx.fillStyle = `rgba(${color_code}, ${annotation.meta.is_hover ? '0.6' : this.drawingStyle.region_opacity})`
        ctx.strokeStyle = `rgb(${color_code})`
        ctx.lineWidth = this.drawingStyle.line_weight
        ctx.fill()
        ctx.stroke()
    },

    _update_circle: function (annotation) {
        const ctx = this.ctx
        const color_code = this._gen_color(annotation.label.color)
        ctx.beginPath()
        const position = this._imagePointToCanvasPoint(annotation.geometry.points[0].x, annotation.geometry.points[0].y)
        const radius = this._imagePointToCanvasPoint(annotation.geometry.points[1].x, annotation.geometry.points[1].y)
        const radiusX = Math.abs(position.x - radius.x), radiusY = Math.abs(position.y - radius.y)
        annotation.meta._canvas_points = [
            {x: position.x - radiusX, y: position.y - radiusY},
            {x: position.x + radiusX, y: position.y + radiusY}
        ]
        ctx.ellipse(position.x, position.y, radiusX, radiusY, 0, 2 * Math.PI, 0, false)
        ctx.fillStyle = `rgba(${color_code}, ${annotation.meta.is_hover ? '0.6' : this.drawingStyle.region_opacity})`
        ctx.strokeStyle = `rgb(${color_code})`
        ctx.lineWidth = this.drawingStyle.line_weight
        ctx.fill()
        ctx.stroke()
    },

    _update_path: function (points) {
        const path = new Path2D()
        const startPoint = this._imagePointToCanvasPoint(points[0].x, points[0].y)
        path.moveTo(startPoint.x, startPoint.y)
        points.forEach(point => {
            const canvasPos = this._imagePointToCanvasPoint(point.x, point.y)
            path.lineTo(canvasPos.x, canvasPos.y)
        })
        // path.closePath()
        return path
    },

    _update_brush: function (annotation) {
        const ctx = this.ctx
        const points = annotation.geometry.points
        const color_code = this._gen_color(annotation.label.color)
        // console.log("lineWidth", lineWidth)
        ctx.lineWidth = this._imagePointToCanvasPoint(annotation.geometry.size, 0).x - this._imagePointToCanvasPoint(0, 0).x
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.strokeStyle = `rgba(${color_code}, ${annotation.meta.is_hover ? '0.6' : this.drawingStyle.region_opacity})`

        const path = this._update_path(points)

        annotation.meta.path = path
        ctx.stroke(path)
    },

    _check_intersects: function (annotation, mousePosition) {
        if (annotation.geometry.type === "rect" || annotation.geometry.type === "circle") {
            const point1 = annotation.meta._canvas_points[0]
            const point2 = annotation.meta._canvas_points[1]
            return mousePosition.x > point1.x && mousePosition.x < point2.x &&
                mousePosition.y > point1.y && mousePosition.y < point2.y
        } else if (annotation.geometry.type === "polygon" || annotation.geometry.type === "brush") {
            return this.ctx.isPointInPath(annotation.meta.path, mousePosition.x, mousePosition.y, "nonzero")
        }
    },

    set_canvas_pan(enabled) {
        this.viewer.panHorizontal = enabled
        this.viewer.panVertical = enabled
    },

    peep(annotation) {
        const viewer = this.viewer
        let xmin = 10000000, xmax = -1, ymin = 10000000, ymax = -1
        annotation.geometry.points.forEach(coord => {
            if (coord.x < xmin) xmin = coord.x
            if (coord.x > xmax) xmax = coord.x
            if (coord.y < ymin) ymin = coord.y
            if (coord.y > ymax) ymax = coord.y
        })
        const panTo = viewer.viewport.imageToViewportCoordinates((xmax + xmin) / 2, (ymax + ymin) / 2)
        console.log("panTo:", panTo, " | ", xmin, xmax, ymin, ymax)
        viewer.viewport.panTo(panTo, false)
        const tiledImage = viewer.world.getItemAt(0)
        const yZoom = tiledImage.source.dimensions.y / (ymax - ymin)
        // const xZoom = viewer.viewport.getContainerSize().x / (xmax - xmin)
        const xZoom = tiledImage.source.dimensions.x / (xmax - xmin)
        const zoom = (yZoom < xZoom ? yZoom : xZoom)
        viewer.viewport.zoomTo(zoom - (zoom * 0.5), false)
        // console.log("targetZoom:", targetZoom, tiledImage.source.dimensions.x, "|", viewer.viewport.getContainerSize().x)
    },

    /**
     * Instantiate a SliceDrawer for the OpenSeadragon viewer.
     * Object interaction events can be listened using the callback parameter by passing a object as such:
     * {
     *     onHover: (element) => {} // mouse over element
     *     onLeave: (element) => {} // mouse left the element
     *     onClick: (element) => {} // mouse click on a element
     *     newElementDrawn: (element) => {} // new element was drawn
     * }
     *
     * @param Viewer the OpenSeadragon viewer instance
     * @param callback a object containing the required callbacks
     */
    init: function (Viewer, callback) {
        // Drawing canvas creation
        const canvas = document.createElement("canvas")
        canvas.style.position = 'absolute'
        canvas.style.left = 0
        canvas.style.top = 0
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        Viewer.canvas.appendChild(canvas)

        // Create references:
        this.viewer = Viewer
        this.canvas = canvas
        this.callback = callback
        this.ctx = canvas.getContext("2d")


        this.viewer.addHandler('update-viewport', () => {
            const ctx = this.ctx
            const viewportMin = this.viewer.viewport.windowToImageCoordinates(new OpenSeadragon.Point(0, 0))
            const viewportMax = this.viewer.viewport.windowToImageCoordinates(new OpenSeadragon.Point(ctx.canvas.width, ctx.canvas.height))

            if (viewportMin.x !== this._viewportLocation.min.x ||
                viewportMin.y !== this._viewportLocation.min.y ||
                viewportMax.x !== this._viewportLocation.max.x ||
                viewportMax.y !== this._viewportLocation.max.y) {
                // The viewport was changed, a update is needed
                this.callback.onViewportChanged(this._viewportLocation)
                this.update()
            }

            this._viewportLocation.max = viewportMax
            this._viewportLocation.min = viewportMin
        });
        this.viewer.addHandler('resize', () => {
            this.resize()
        });

        new OpenSeadragon.MouseTracker({
            element: this.viewer.canvas,//.container
            nonPrimaryReleaseHandler: (e) => {
            },
            releaseHandler: (e) => {
                if (this.currently_editing == null) {
                    this.new_tool.mouseEvent('release', e)
                } else {
                    this.currently_editing.mouseEvent('release', e)
                }
            },
            pressHandler: (e) => {
                if (this.currently_editing == null) {
                    this.new_tool.mouseEvent('press', e)
                } else {
                    // During editing mode, press means drag a control
                    this.currently_editing.mouseEvent('press', e)
                }
            },
            clickHandler: (e) => {
                if (this.currently_editing != null)
                    this.currently_editing.mouseEvent('click', e)
                else {
                    this.elementsOnScreen.forEach((element) => {
                        if (element.meta.is_hover) {
                            this.callback.onClick(element)
                        }
                    })
                }
            },
            dblClickHandler: (e) => {
                this.new_tool.mouseEvent('dblClick', e)
            },
            moveHandler: (e) => {
                if (this.currently_editing == null) {
                    if (this.new_tool.mouseEvent('move', e)) return
                } else {
                    if (this.currently_editing.mouseEvent('move', e)) return
                }

                // When not drawing, we will check for collision with the mouse pointer for interactivity
                if (this.currently_editing == null) {
                    // We only check for interaction when not in editing mode.
                    let updateRequired = false
                    this.elementsOnScreen.forEach((annotation) => {
                        const intersects = this._check_intersects(annotation, e.position)
                        const statusUpdateRequired = annotation.meta.is_hover !== intersects
                        updateRequired = updateRequired || (intersects && statusUpdateRequired) || statusUpdateRequired

                        // Handling element interaction listeners:
                        if (statusUpdateRequired)
                            if (intersects)
                                callback.onHover(annotation)
                            else
                                callback.onLeave(annotation)

                        annotation.meta.is_hover = intersects
                    })

                    if (updateRequired) {
                        this.viewer.canvas.style.cursor = "hand"
                        this.update()
                    }
                }
            },
            keyDownHandler: (e) => {
                if (this.currently_editing == null)
                    this.new_tool.keyboardEvent('keyDown', e)
                else
                    this.currently_editing.keyboardEvent('keyDown', e)
            },
            keyUpHandler: (e) => {
                if (this.currently_editing == null)
                    this.new_tool.keyboardEvent('keyUp', e)
                else
                    this.currently_editing.keyboardEvent('keyUp', e)
            }
        })

        this.tools = {
            "polygon": () => polygonTool.init(this),
            "free": () => freeTool.init(this),
            "rect": () => rectTool.init(this),
            "circle": () => circleTool.init(this),
            "brush": () => brushTool.init(this),
            "ruler": () => rulerTool.init(this),
            "none": () => nullTool.init(this)
        }
        this.tool = this.enabled ? "polygon" : "none"

        this.resize(Viewer.canvas.width, Viewer.canvas.height)
    }
}
export {optimizePath}