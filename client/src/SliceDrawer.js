/* eslint-disable prefer-destructuring */
import OpenSeadragon from 'openseadragon';
import _ from 'lodash';

const freeDrawingDefaultKeyboardBehavior = function (func, e) {
  const drawer = this.instance;
  switch (func) {
    case 'keyDown':
      if (e.keyCode === 32) {
        this.drawer_panning = true;
        // console.log("drawer_panning", this.drawer_panning)
        drawer.set_canvas_pan(true);
        if (drawer.currently_drawing != null) {
          drawer.currently_drawing.meta._enabled = false;
        }
      }
      break;
    case 'keyUp':
      if (e.keyCode === 13) {
        // User pressed ENTER, we will save the drawing
        drawer.set_canvas_pan(true);
        // Before saving, we remove the redundant points for this shape
        drawer.currently_drawing.geometry.points = optimizePath(drawer.currently_drawing.geometry.points);
        // Call the onFinishNewDrawing callback, which handles what happens to the shape
        drawer.callback.onFinishNewDrawing(drawer.currently_drawing.geometry);
        // Complete the drawing preview by resetting it
        drawer.currently_drawing = null;
        if (drawer.stateRestorer != null) drawer.stateRestorer.cancel();
      }
      if (e.keyCode === 32) {
        this.drawer_panning = false;
        // user released space, we will disable dragging
        drawer.set_canvas_pan(false);
      }
      if (e.keyCode === 27) {
        // User pressed ESC, we will reset the drawing
        drawer.currently_drawing = null;
        if (drawer.stateRestorer != null) drawer.stateRestorer.cancel();
        drawer.set_canvas_pan(true);
      }
      break;
  }
};

const lineFunction = function (point1, point2, point3) {
  const line1_slope = (point2.y - point1.y) / (point2.x - point1.x);
  const line2_slope = (point3.y - point2.y) / (point3.x - point2.x);
  const line1_b = point1.x * line1_slope - point1.y;
  const line2_b = point3.x * line2_slope - point3.y;
  return [
    {
      slope: line1_slope,
      b: line1_b,
    },
    {
      slope: line2_slope,
      b: line2_b,
    },
  ];
};

/**
 * A simple algorithm to detect and remove redundant points made in free draw. It returns an array of points
 * without the points that don't contribute to the shape.
 *
 * @param points the array of points
 * @returns {*}
 */
const optimizePath = function (points) {
  let toRemove = [];
  do {
    console.log('New iteration');
    toRemove = [];
    for (let i = 1; i < points.length - 1; i++) {
      const point1 = points[i - 1];
      const point2 = points[i];
      const point3 = points[i + 1];
      const lineFunc = lineFunction(point1, point2, point3);
      if (lineFunc[0].slope === lineFunc[1].slope && lineFunc[0].b === lineFunc[1].b) {
        // we could introduce a margin
        toRemove.push(i);
      }
    }

    for (let i = 1; i < points.length; i++) {
      const point1 = points[i - 1];
      const point2 = points[i];
      const distance1 = Math.hypot(point1.x - point2.x, point1.y - point2.y);
      if (distance1 < 5) {
        toRemove.push(i);
      }
    }

    console.log(toRemove.length, 'points removed from', points.length, `(${(toRemove.length / points.length) * 100}%)`);
    console.log('Size (before): ', points.length);
    points = points.filter((item, idx) => !toRemove.includes(idx));
    console.log('Size (after): ', points.length);
  } while (toRemove.length !== 0);
  // console.log(toRemove.length, "points removed from", points.length, "(" + ((toRemove.length / points.length) * 100) + "%)")
  // console.log("Size (before): ", points.length)
  // // for (let i = 0; i < toRemove.length; i++) {
  // //     points.splice(toRemove[i], 1)
  // // }
  // console.log("Size (after): ", points.length)
  return points;
};

class CircleAnnotationTool {
  constructor(drawer) {
    this.name = 'circle';
    this.drawer = drawer;
    this.newAnnotation = null;
    this.dragging = false;
    this.drawer.setPanningEnabled(false);
  }

  mouseEvent(func, e) {
    const drawer = this.drawer;
    switch (func) {
      case 'press':
        if (this.dragging === false) {
          const label = this.drawer.currentLabel;
          this.newAnnotation = new CircleAnnotation(this.drawer, {
            state: 'creating',
            geometry: {
              type: 'circle',
              points: [
                this.drawer.mousePointToImagePoint(e.position),
                this.drawer.mousePointToImagePoint(e.position)
              ]
            },
            label
          });

          this.dragging = true;
          this.drawer.update();
        }
        break;
      case 'move':
        if (this.newAnnotation != null && this.dragging) {
          const imagePosition = drawer.mousePointToImagePoint(e.position);
          this.newAnnotation.geometry.points[1].x = imagePosition.x;// -this.geometry.points[0].x
          this.newAnnotation.geometry.points[1].y = imagePosition.y; // - this.geometry.points[0].y
          drawer.update();
        }

        break;
      case 'release':
        this.dragging = false;
        break;
    }
  }

  keyboardEvent(func, e) {
    switch (func) {
      case 'keyUp':
        if (e.keyCode === 13) {
          this.newAnnotation.state = 'idle';
          this.newAnnotation.updateImageLocation();
          this.drawer.callback.onFinishNewDrawing(this.newAnnotation);
          this.newAnnotation = null;
          this.drawer.refresh();
        } else if (e.keyCode === 27) {
          // pressed ESC
          this.newAnnotation = null;
          this.drawer.refresh();
        }
        break;
    }
  }

  destroy() {
    this.newAnnotation = null;
    this.drawer.setPanningEnabled(true);
  }

  draw() {
    if (this.newAnnotation != null) {
      this.newAnnotation.draw();
    }
  }
}

class RulerTool {
  constructor(drawer) {
    this.drawer = drawer;
    this.name = 'ruler';
    this.startingPoint = null;
    this.endingPoint = null;
    this.active = false;
    this.perpendicular = 0;
  }

  perpendicularLine(point1, point2) {
    const line1_slope = (point2.y - point1.y) / (point2.x - point1.x);
    const line1_b = point1.x * line1_slope - point1.y;
    return {
      slope: -1 / line1_slope,
      b: -1 / line1_b,
    };
  }

  mouseEvent(func, e) {
    const drawer = this.drawer;
    switch (func) {
      case 'dblClick':
        if (!this.active && this.startingPoint != null && this.endingPoint != null) {
          this.active = false;
          this.startingPoint = null;
          this.endingPoint = null;
        } else if (this.startingPoint == null) {
          this.startingPoint = this.drawer.mousePointToImagePoint(e.position);
          this.active = true;
        } else {
          this.endingPoint = this.drawer.mousePointToImagePoint(e.position);
          this.perpendicular = this.perpendicularLine(this.startingPoint, this.endingPoint);
          this.active = false;
        }
        drawer.refresh();
        break;
      case 'move':
        if (this.active) {
          this.endingPoint = this.drawer.mousePointToImagePoint(e.position);
          this.perpendicular = this.perpendicularLine(this.startingPoint, this.endingPoint);
          drawer.refresh();
        }
        break;
    }
  }

  keyboardEvent(func, e) {
    if (func === 'keyUp' && e.keyCode === 27) {
      this.active = false;
      this.startingPoint = null;
      this.endingPoint = null;
      this.drawer.refresh();
    }
  }

  destroy() {
  }

  draw() {
    const ctx = this.drawer.ctx;
    if (this.startingPoint != null && this.endingPoint != null) {
      const drawer = this.drawer;
      const startPoint = drawer.imagePointToCanvasPoint(this.startingPoint.x, this.startingPoint.y);
      const endPoint = drawer.imagePointToCanvasPoint(this.endingPoint.x, this.endingPoint.y);
      const distance = Math.hypot(
        this.startingPoint.x - this.endingPoint.x,
        this.startingPoint.y - this.endingPoint.y
      );
      // const perpendicular = this.perpendicularLine(startPoint, endPoint)
      const ruler = new Path2D();
      ruler.moveTo(startPoint.x, startPoint.y);
      ruler.lineTo(endPoint.x, endPoint.y);

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
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'black';
      ctx.lineCap = 'round';
      ctx.stroke(ruler);
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'white';
      ctx.font = '30px Arial';
      ctx.fillStyle = 'black';
      const text = `${(distance * this.drawer.pixelWidth).toFixed(2)}µm`;
      ctx.fillText(text, 30 + startPoint.x + ((endPoint.x - startPoint.x) / 2), startPoint.y + ((endPoint.y - startPoint.y) / 2));
      ctx.strokeText(text, 30 + startPoint.x + ((endPoint.x - startPoint.x) / 2), startPoint.y + ((endPoint.y - startPoint.y) / 2));
    }
  }
}

const polygonTool = {
  name: 'polygon',
  instance: null,
  geometry: null,

  info(...help) {
    const info = [];
    if (help.includes('start')) {
      info.push('[db-Click] To put the first point');
    }
    if (help.includes('start-2')) {
      info.push('[db-Click] To put the second point');
    }
    if (help.includes('save')) {
      info.push('[Enter] To save annotation');
    }
    if (help.includes('undo')) {
      info.push('[Esc] To undo');
    }
    if (help.includes('continue')) {
      info.push('[Click] To continue dragging');
    }
    if (help.includes('point')) {
      info.push('[db-Click] To add a point');
    }
    if (help.includes('cancel')) {
      info.push('[Esc] To cancel');
    }
    this.instance.callback.onInfoUpdate(info);
  },

  mouseEvent(func, e) {
    const drawer = this.instance;
    const imagePosition = drawer._mousePointToImagePoint(e.position);
    switch (func) {
      case 'dblClick':
        // On double click, we will create a new drawing if there none in the moment
        if (drawer.currently_drawing == null) {
          this.geometry = {
            type: 'polygon',
            points: [imagePosition, imagePosition],
          };
          drawer.currently_drawing = {
            label: drawer.current_label,
            geometry: this.geometry,
            meta: {},
          };

          drawer.stateRestorer = StateRestorer.init(drawer, this.geometry);
          this.info('start-2', 'cancel');
        } else {
          // On double click we will continue the drawing by adding the new
          this.geometry.points.push(imagePosition);
          drawer.stateRestorer.addRestorePoint('point');
          this.info('save', 'undo', 'point');
        }
        break;
      case 'move':
        if (drawer.currently_drawing != null) {
          // On mouse move we will update the preview if we currently drawing
          this.geometry.points[this.geometry.points.length - 1] = imagePosition;
          drawer.update();
        }
        break;
    }
  },

  keyboardEvent(func, e) {
    const drawer = this.instance;
    // We are only interested in this events if we are drawing
    if (drawer.currently_drawing != null) {
      switch (func) {
        case 'keyUp':
          if (e.keyCode === 13) {
            // User pressed enter, we will complete the drawing
            this.geometry.points.pop();
            drawer.callback.onFinishNewDrawing(this.geometry);
            drawer.currently_drawing = null;
            drawer.stateRestorer.cancel();
            this.info('');
          }
          if (e.keyCode === 27) {
            // User pressed ESC, undo the drawing
            if (drawer.currently_drawing.geometry.points.length > 3) {
              // Undo the last point added
              this.geometry.points.splice(this.geometry.points.length - 2, 1);

              this.info('save', 'point', this.geometry.points.length > 3 ? 'undo' : 'cancel');
            } else {
              // Cancel the drawing
              drawer.currently_drawing = null;
              drawer.stateRestorer.cancel();
              this.info('');
            }
            drawer.update();
          }
          break;
      }
    }
  },

  init(instance) {
    this.instance = instance;
    this.info('start');
    return this;
  },
};

class PolygonAnnotationTool {
  constructor(drawer) {
    this.name = 'polygon';
    this.drawer = drawer;
    this.newAnnotation = null;
    this.dragging = false;
    drawer.setPanningEnabled(false);
    this.info('start', 'pan');
  }

  info(...help) {
    const info = [];
    if (help.includes('pan')) {
      info.push('[Space] To drag the image');
    }
    if (help.includes('start')) {
      info.push('[Click] To start drawing');
    }
    if (help.includes('save')) {
      info.push('[Enter] To save annotation');
    }
    if (help.includes('continue')) {
      info.push('[Click] To continue drawing');
    }
    if (help.includes('cancel')) {
      info.push('[Esc] To cancel');
    }
    this.drawer.callback.onInfoUpdate(info);
  }

  destroy() {
    this.drawer.setPanningEnabled(true);
    this.newAnnotation = null;
  }

  mouseEvent(func, e) {
    const imagePosition = this.drawer.mousePointToImagePoint(e.position);
    switch (func) {
      case 'press':
        this.dragging = true;
        if (this.newAnnotation == null) {
          const label = this.drawer.currentLabel;
          this.newAnnotation = new PolygonAnnotation(this.drawer, {
            state: 'creating',
            geometry: {
              type: 'polygon',
              points: [imagePosition, {
                x: imagePosition.x,
                y: imagePosition.y
              }]
            },
            label
          });
        } else {
          this.newAnnotation.geometry.points.push(imagePosition);
        }
        this.drawer.refresh();
        // if (!this.drawer_panning) {
        //   if (drawer.currently_drawing == null) {
        //     this.geometry = {
        //       type: 'polygon',
        //       points: [imagePosition],
        //     };
        //     drawer.currently_drawing = {
        //       label: drawer.current_label,
        //       geometry: this.geometry,
        //       meta: { _enabled: true },
        //     };
        //
        //     drawer.stateRestorer = StateRestorer.init(drawer, this.geometry);
        //   } else {
        //     drawer.currently_drawing.meta._enabled = true;
        //   }
        //
        //   this.info('pan');
        // }
        // return true
        break;
      case 'move':
        if (this.dragging && this.newAnnotation != null) {
          this.newAnnotation.geometry.points.push(imagePosition);
          this.drawer.refresh();
        }
        // if (!this.drawer_panning && drawer.currently_drawing != null && drawer.currently_drawing.meta._enabled) {
        //   this.geometry.points.push(imagePosition);
        //   drawer.stateRestorer.addRestorePoint('point');
        //   // this.info("start", "pan")
        //   // return true
        // }
        break;
      case 'release':
        this.dragging = false;
        this.info('continue', 'pan', 'save', 'cancel');
        break;
    }
  }

  keyboardEvent(func, e) {
    if (func === 'keyUp') {
      if (e.keyCode === 13) {
        // User pressed ENTER
        if (this.newAnnotation != null) {
          this.newAnnotation.state = 'idle';
          this.newAnnotation.geometry.points = optimizePath(this.newAnnotation.geometry.points);
          this.drawer.callback.onFinishNewDrawing(this.newAnnotation);
          this.newAnnotation = null;
          this.drawer.update();
        }
      } else if (e.keyCode === 27) {
        // User pressed ESC
        this.newAnnotation = null;
        this.drawer.refresh();
      }
    }
  }

  draw() {
    if (this.newAnnotation != null) {
      this.newAnnotation.draw();
    }
  }

  // keyboardEvent: freeDrawingDefaultKeyboardBehavior;
}

const brushTool = {
  name: 'brush',
  instance: null,
  size: 500,
  drawer_panning: false,
  geometry: null,

  mouseEvent(func, e) {
    const drawer = this.instance;
    const imagePosition = drawer._mousePointToImagePoint(e.position);
    switch (func) {
      case 'press':
        if (this.drawer_panning) return;
        drawer.set_canvas_pan(false);

        if (drawer.currently_drawing == null) {
          this.geometry = {
            type: 'brush',
            size: this.size,
            points: [imagePosition],
          };
          drawer.currently_drawing = {
            label: drawer.current_label,
            geometry: this.geometry,
            meta: { _enabled: true },
          };
          // drawer.stateRestorer = StateRestorer.init(drawer, this.geometry)
        }
        break;
      case 'move':
        if (!this.drawer_panning && drawer.currently_drawing != null && drawer.currently_drawing.meta._enabled) {
          this.geometry.points.push(imagePosition);
        }
        break;
      case 'release':
        if (drawer.currently_drawing != null) {
          drawer.currently_drawing.meta._enabled = false;
        }
        drawer.set_canvas_pan(true);

        break;
    }
    drawer.update();
  },

  keyboardEvent: freeDrawingDefaultKeyboardBehavior,

  init(instance) {
    this.instance = instance;
    instance.set_canvas_pan(false);
    return this;
  },
};

const PathMeshEraser = {
  editor: null,
  active: false,

  mouseEvent(func, e) {
    const { editor } = this;
    const drawer = editor.instance;

    switch (func) {
      case 'press':
        this.active = true;
        drawer.set_canvas_pan(false);
        break;
      case 'release':
        this.active = false;
        drawer.set_canvas_pan(true);
        break;
      case 'move':
        if (this.active === true) {
          const mousePosition = drawer._mousePointToImagePoint(e.position);
          // On the eraser mode, we will check if for intersection and remove those elements
          editor.controls.some((control) => {
            if (editor.intersectsControl(mousePosition, control.point)) {
              // We will remove this line
              const index = editor.geometry.points.indexOf(control.point);
              editor.geometry.points.splice(index, 1);
              editor.controls.splice(index, 1);
              editor.addRestorePoint('erased');
              return true; // stop iterating
            }
          });
          drawer.update();
        }
        break;
    }
  },

  init(editor) {
    this.editor = editor;
    return this;
  },
};

const PathMeshMover = {
  editor: null,
  control: null,

  mouseEvent(func, e) {
    const { editor } = this;
    const drawer = editor.instance;
    switch (func) {
      case 'press':
        const mousePosition = drawer._mousePointToImagePoint(e.position);
        // On the dragging mode, the node is dragged to the
        editor.controls.forEach((control) => {
          const position = control.point;
          const intersects = editor.intersectsControl(mousePosition, position);
          if (intersects) {
            // User is dragging with this element
            this.control = control;
            drawer.set_canvas_pan(false);
          }
        });

        break;
      case 'release':
        this.control = null;
        drawer.set_canvas_pan(true);
        editor.addRestorePoint('moved');
        break;
      case 'move':
        if (this.control != null) {
          const mousePosition = drawer._mousePointToImagePoint(e.position);
          this.control.point.x = mousePosition.x;
          this.control.point.y = mousePosition.y;
          drawer.update();
        }
        break;
    }
  },

  init(editor) {
    this.editor = editor;
    return this;
  },
};

const PathMeshCreator = {
  editor: null,
  cursor: null,
  instance: null,

  checkPathCreation(position) {
    const { points } = this.editor.geometry;
    for (let i = 1; i < points.length; i++) {
      const point1 = points[i - 1];
      const point2 = points[i];
      const left = Math.min(point1.x, point2.x) - 10;
      const right = Math.max(point1.x, point2.x) + 10;
      const top = Math.min(point1.y, point2.y) - 10;
      const bottom = Math.max(point1.y, point2.y) + 10;

      if (left < position.x && position.x < right
        && top < position.y && position.y < bottom) {
        return i;
      }
    }
    return null;
  },

  mouseEvent(func, e) {
    const { editor } = this;
    const drawer = editor.instance;
    const position = drawer._mousePointToImagePoint(e.position);
    switch (func) {
      case 'move':
        if (drawer.ctx.isPointInPath(editor.annotation.meta.path, e.position.x, e.position.y)) {
          const newIndex = this.checkPathCreation(position);
          // console.log("check", newIndex)
          if (newIndex != null) {
            this.cursor = {
              position,
              index: newIndex,
            };
          } else {
            this.cursor = null;
          }
          drawer.update();
        } else if (this.cursor != null) {
          this.cursor = null;
          drawer.update();
        }
        break;
      case 'click':
        if (drawer.ctx.isPointInPath(editor.annotation.meta.path, e.position.x, e.position.y)) {
          const { points } = editor.geometry;
          const newIndex = this.checkPathCreation(position);
          if (newIndex != null) {
            editor.addRestorePoint('created');
            points.splice(newIndex, 0, position);
          }
          console.log('Ended');
          editor.create_controls();
          drawer.update();
        }
        break;
    }
  },

  draw(ctx) {
    const { instance } = this;
    // Drawing the reference cursor where the new point will appear
    ctx.beginPath();
    if (this.cursor != null) {
      const { points } = this.editor.geometry;
      const position = instance._imagePointToCanvasPoint(this.cursor.position.x, this.cursor.position.y);
      ctx.ellipse(position.x, position.y, 5, 5, 0, 2 * Math.PI, 0, false);
      const prevPoint = instance._imagePointToCanvasPoint(points[this.cursor.index - 1].x, points[this.cursor.index - 1].y);
      const nextPoint = instance._imagePointToCanvasPoint(points[this.cursor.index].x, points[this.cursor.index].y);
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(position.x, position.y);
      ctx.lineTo(nextPoint.x, nextPoint.y);
      ctx.fill();
      ctx.stroke();
    }
  },

  init(editor) {
    this.editor = editor;
    this.instance = editor.instance;
    return this;
  },
};

const PathMeshFreeEditor = {
  currently_drawing: null,
  current_path: null,
  editor: null,
  editing: false,
  panning: false,
  mouseEvent(func, e) {
    const { editor } = this;
    const { annotation } = editor;
    const { instance } = editor;
    const position = editor.instance._mousePointToImagePoint(e.position);
    switch (func) {
      case 'press':
        if (this.currently_drawing == null) {
          if (editor.instance.ctx.isPointInPath(annotation.meta.path, e.position.x, e.position.y)) {
            this.currently_drawing = [];
            this.editing = true;
            instance.set_canvas_pan(false);
          }
        } else {
          this.editing = true;
          instance.set_canvas_pan(false);
        }
        break;
      case 'move':
        if (this.panning) return;
        if (this.currently_drawing != null && this.editing) {
          this.currently_drawing.push(position);
          editor.instance.update();
        }
        break;
      case 'release':
        this.editing = false;
        instance.set_canvas_pan(true);
        break;
    }
  },

  polygonOrientation(points) {
    let sum = 0;
    const li = points.length;
    for (let i = 1; i < li; i++) {
      sum += (points[i].x - points[i - 1].x) * (points[i].y + points[i - 1].y);
    }
    sum += (points[li - 1].x - points[li - 2].x) * (points[li - 1].y + points[li - 2].y);
    return sum > 0;
  },

  keyboardEvent(func, e) {
    const drawer = this.editor.instance;
    switch (func) {
      case 'keyUp':
        if (e.keyCode === 32) {
          drawer.set_canvas_pan(false);
          this.panning = false;
        } else if (e.keyCode === 27) {
          drawer.set_canvas_pan(true);
          this.currently_drawing = null;
          drawer.update();
        } else if (e.keyCode === 13) {
          drawer.set_canvas_pan(true);
          const intersects = (path, point) => {
            const canvasPoint = drawer._imagePointToCanvasPoint(point.x, point.y);
            return drawer.ctx.isPointInPath(path, canvasPoint.x, canvasPoint.y, 'nonzero');
          };
          const originalToRemove = this.editor.geometry.points.map((item, index) => {
            if (intersects(this.current_path, item)) return index;
          })
            .filter((item) => item != null);
          const additionToRemove = this.currently_drawing.map((item, index) => {
            if (intersects(this.editor.geometry.path, item)) return index;
          })
            .filter((item) => item != null);
          console.log('Original To Remove', originalToRemove, additionToRemove);
          const newOriginalPath = this.editor.geometry.points.filter((i, idx) => !originalToRemove.includes(idx));
          const newAdditionPath = this.currently_drawing.filter((i, idx) => !additionToRemove.includes(idx));
          console.log('newOriginalPath:', newOriginalPath);
          console.log('newAdditionPath:', newAdditionPath);

          const originalX = this.polygonOrientation(newOriginalPath);
          const additionX = this.polygonOrientation(newAdditionPath);
          console.log('Order:', originalX, additionX);
          if (additionX !== originalX) {
            console.log('Reversing array');
            // newAdditionPath.reverse()
          }

          let oIndex = 1;
          let aIndex = 0;
          const newPath = [newOriginalPath[0]];
          do {
            const cPoint = newPath[newPath.length - 1];
            const oPoint = newOriginalPath[oIndex];
            const aPoint = newAdditionPath[aIndex];

            const oDistance = oIndex < newOriginalPath.length ? Math.hypot(cPoint.x - oPoint.x, cPoint.y - oPoint.y) : -1;
            const aDistance = aIndex < newAdditionPath.length ? Math.hypot(cPoint.x - aPoint.x, cPoint.y - aPoint.y) : -1;

            console.log('Iteration | ', cPoint, oIndex, aIndex, '|', oDistance, aDistance);
            if (oDistance === -1 && aDistance === -1) {
              break;
            } else if (aDistance === -1 || (oDistance !== -1 && oDistance < aDistance)) {
              newPath.push(oPoint);
              oIndex++;
            } else if (oDistance === -1 || (aDistance !== -1 && oDistance > aDistance)) {
              newPath.push(aPoint);
              aIndex++;
            }
          } while (oIndex < newOriginalPath.length || aIndex < newAdditionPath.length);
          this.editor.geometry.points = optimizePath(newPath);
          this.editor.instance.update();
          return false;
          // const newToRemove =
        }
        break;
      case 'keyDown':
        if (e.keyCode === 32) {
          drawer.set_canvas_pan(true);
          this.panning = true;
        }
        break;
    }

    // We are going to handle the input
    return true;
  },

  draw(ctx) {
    const points = this.currently_drawing;
    if (points != null) {
      const path = new Path2D();
      const firstPosition = this.editor.instance._imagePointToCanvasPoint(points[0].x, points[0].y);
      ctx.beginPath();
      path.moveTo(firstPosition.x, firstPosition.y);

      points.forEach((point) => {
        const position = this.editor.instance._imagePointToCanvasPoint(point.x, point.y);
        path.lineTo(position.x, position.y);
      });
      path.closePath();
      this.current_path = path;
      ctx.stroke(path);
    }
  },

  init(editor) {
    this.editor = editor;
    this.currently_drawing = null;
    return this;
  },
};

class PathMeshEditor {

  constructor(annotation, drawer) {
    this.drawer = drawer;
    this.annotation = annotation;
    this.originalAnnotation = _.cloneDeep(annotation);
    if (this.annotation.state === 'feedback') {
      this.annotation.state = 'feedback-editing';
      this.annotation.drawFeedback = true;
    } else {
      this.annotation.state = 'editing';
    }
    this.controls = [];
    this.control = null;
    this.mode = null;
    this.dragging = false;
    this.hasMoved = false;
    this.createControls();
    // this.create_mode(mode);
  }

  intersectsControl(mousePosition, position) {
    const drawer = this.drawer;
    const areaRadius = ((drawer.currentViewport.bottom - drawer.currentViewport.top) / drawer.canvas.clientWidth) * 25;
    // console.log("intersects radius:", areaRadius, drawer._viewportLocation)
    return mousePosition.x > position.x - areaRadius && mousePosition.x < position.x + areaRadius
      && mousePosition.y > position.y - areaRadius && mousePosition.y < position.y + areaRadius;
  }

  getIntersectingControl(position) {
    let intersectingControl = null;
    this.controls.forEach(control => {
      if (this.intersectsControl(position, control.point)) {
        intersectingControl = control;
      }
    });
    return intersectingControl;
  }

  mouseEvent(func, e) {
    // todo all at once
    if (this.annotation == null) return;
    const points = this.annotation.state === 'feedback-editing'
      ? this.annotation.feedback.geometry : this.annotation.geometry.points;
    if (func === 'press') {
      this.hasMoved = false;
      this.drawer.setPanningEnabled(false);
      this.dragging = true;
      this.control = this.getIntersectingControl(this.drawer.mousePointToImagePoint(e.position));
      if (this.control == null) {
        // check if clicked on edge
        // Intersects no control, which means that if it intersects the item, we should add a new node
        if (this.annotation instanceof PolygonAnnotation) {
          // it only makes sense to edit polygons; in the future we could change items to polygon
          if (this.annotation.intersects(e.position)) {
            const imagePosition = this.drawer.mousePointToImagePoint(e.position);
            // We will create a new point
            const newPointIndex = this.checkPathCreation(imagePosition);
            if (newPointIndex != null) {
              // We are ready to add a new point on the index of interest
              points.splice(newPointIndex, 0, imagePosition);
              this.createControls();
              this.control = this.controls[newPointIndex];
              this.drawer.refresh();
            }
          }
        }
      }
    } else if (func === 'release') {

      if (this.hasMoved === false) {
        // True click, as no movement was done between press and release
        if (this.control != null) {
          // Clicking on a control removes it
          points.splice(this.control.index, 1);
          this.createControls();
          this.annotation.update();
          this.drawer.refresh();
        }
      }
      this.dragging = false;
      this.control = null;
      // if the panning is disabled, we will enable on release:
      if (!this.drawer.isPanningEnabled) {
        this.drawer.setPanningEnabled(true);
      }
    } else if (func === 'move') {
      this.hasMoved = true;
      if (this.dragging && this.control != null) {
        const mousePosition = this.drawer.mousePointToImagePoint(e.position);
        this.control.point.x = mousePosition.x;
        this.control.point.y = mousePosition.y;
        if (this.annotation instanceof RectAnnotation) {
          this.annotation.updateImageLocation();
        }
        this.drawer.update();
      }
    } else if (func === 'click') {

    }
  }

  keyboardEvent(func, e) {
    const drawer = this.drawer;

    console.log(func, e);
    switch (func) {
      case 'keyUp':
        if (e.keyCode === 27) {
          // User pressed ESC. The edition is cancelled and the shape must be restored
          this.cancel();
        } else if (e.keyCode === 13) {
          // Notify the editing has ended with changes
          this.conclude();
        }
        break;
    }
  }

  checkPathCreation(position) {
    const { points } = this.annotation.geometry;
    for (let i = 1; i < points.length; i++) {
      const point1 = points[i - 1];
      const point2 = points[i];
      const left = Math.min(point1.x, point2.x) - 10;
      const right = Math.max(point1.x, point2.x) + 10;
      const top = Math.min(point1.y, point2.y) - 10;
      const bottom = Math.max(point1.y, point2.y) + 10;

      if (left < position.x && position.x < right
        && top < position.y && position.y < bottom) {
        return i;
      }
    }
    return null;
  }

  cancel() {
    const drawer = this.drawer;
    if (this.annotation.state === 'editing') {
      this.annotation.state = 'idle';
      this.annotation.geometry = this.originalAnnotation.geometry;
      this.annotation.label = this.originalAnnotation.label;
    } else {
      this.annotation.state = 'feedback';
      this.annotation.feedback.geometry = this.originalAnnotation.geometry.points;
    }
    this.annotation.title = this.originalAnnotation.title;
    this.annotation.description = this.originalAnnotation.description;
    // this.geometry.points = this.original_points;
    // this.geometry.color = this.original_color;

    // Notify the editing has ended without changes
    drawer.callback.onFinishedEditing(false, this.annotation);
    this.annotation = null;

    drawer.update();
    this.controls = [];
  }

  conclude() {
    if (this.annotation.state === 'editing') {
      this.annotation.state = 'idle';
    } else {
      this.annotation.state = 'feedback';
    }
    this.annotation.updateViewport();
    this.controls = [];
    this.drawer.callback.onFinishedEditing(true, this.annotation);
    this.drawer.update();
    this.annotation = null;
  }

  destroy() {
    if (this.annotation != null && this.annotation.state !== 'idle' && this.annotation.state !== 'feedback') {
      this.cancel();
    }
    this.drawer.update();
  }

  draw() {
    this.drawer.ctx.lineWidth = 1;
    // We will draw the controls we have:
    this.controls.forEach((control) => {
      this.drawer.ctx.beginPath();
      const position = this.drawer.imagePointToCanvasPoint(control.point.x, control.point.y);
      this.drawer.ctx.ellipse(position.x, position.y, 5, 5, 0, 2 * Math.PI, 0, false);

      this.drawer.ctx.setLineDash([]);
      this.drawer.ctx.fillStyle = 'rgb(255,255,255)';
      this.drawer.ctx.fill();
      this.drawer.ctx.strokeStyle = 'black';
      this.drawer.ctx.stroke();
      control.canvasPosition = position;
    });

    // this.annotation.draw();
  }

  createControls() {
    // When creating controls, we will differentiate the annotation state:
    if (this.annotation.state === 'feedback-editing') {
      // On feedback annotations, we will edit the feedback geometry instead of the original's
      if (this.annotation.feedback.geometry == null) {
        // There is no feedback data currently, we will instantiate based on the original
        this.annotation.feedback.geometry = this.annotation.geometry.points.map(point => {
          return {
            x: point.x,
            y: point.y
          };
        });
      }
      // Not we will create the points based on the feedback data
      this.controls = this.annotation.feedback.geometry.map((point, index) => ({
        canvasPosition: null,
        index,
        point
      }));
    } else {
      // This is a normal edit operation, we will interact with the original geometry
      this.controls = this.annotation.geometry.points.map((point, index) => ({
        canvasPosition: null,
        index,
        point
      }));
    }
  }

  // create_mode(mode) {
  //   if (mode === 'eraser') {
  //     this.mode = PathMeshEraser.init(this);
  //   } else if (mode === 'mover') {
  //     this.mode = PathMeshMover.init(this);
  //   } else if (mode === 'creator') {
  //     this.mode = PathMeshCreator.init(this);
  //   } else if (mode === 'free') {
  //     this.mode = PathMeshFreeEditor.init(this);
  //   }
  // },
}

/* the conversion from pixel to shape may be done with a search algorithm.
The points are the pixels which were unable to find add one of its side to the search */

const StateRestorer = {
  instance: null,
  geometry: null,
  states: [],
  current_state_point: 0,

  addRestorePoint(event) {
    if (this.states.length > 0 && this.current_state_point !== this.states.length - 1) {
      // We are overriding the past, we will clear the states
      this.states.splice(this.current_state_point, this.states.length - this.current_state_point);
      console.log('clearing future:', this.states.length);
    }
    this.states.push({
      type: event,
      points: this.geometry.points.map((item) => // todo not all elements have points
        ({
          x: item.x,
          y: item.y,
        })),
    });
    this.current_state_point = this.states.length - 1;
    this.instance.callback.onStateRestorerEvent(this);
    // todo report state changed
  },

  restoreToPoint(value) {
    console.log('restoreToPoint', value);
    this.geometry.points = this.states[value].points;
    this.instance.update();
    this.current_state_point = value;
    this.instance.callback.onStateRestorerEvent(this);
  },
  cancel() {
    this.instance.stateRestorer = null;
    this.states = null;
    this.instance.callback.onStateRestorerEvent(null);
  },
  init(instance, geometry) {
    this.instance = instance;
    this.geometry = geometry;
    this.states = [];
    instance.callback.onStateRestorerEvent(this);
    return this;
  },
};

class Annotation {
  constructor(drawer, annotation) {
    this.drawer = drawer;

    // Annotation data:
    this.id = annotation.id;
    this.geometry = annotation.geometry;
    this.label = annotation.label;
    this.slideId = annotation.slide_id;
    this.title = annotation.title;
    this.description = annotation.description;
    this.properties = annotation.properties;
    this.currentlyImporting = false;
    this.feedback = null;
    this.drawFeedback = false;

    // Feedback data:
    if (annotation.feedback != null) {
      this.feedback = annotation.feedback;
      this.state = 'feedback';
    } else {
      this.state = annotation.state == null ? 'idle' : annotation.state;
    }

    // Annotation meta data:
    this.isHovering = false;
    this.currentViewport = {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    };
    this.imageLocation = {
      top: Number.MAX_VALUE, // assuming higher value to calculate actual value
      left: Number.MAX_VALUE, // assuming higher value to calculate actual value
      bottom: 0,
      right: 0,
    };
  }

  setHovering(hovering) {
    this.isHovering = hovering;
  }

  /**
   * Checks if the user should be able to see this elements from its viewport AND
   * it isn't filtered out.
   * @param userViewport the user's viewport
   * @returns {boolean} true if this element should be visible
   */
  shouldBeVisible(userViewport) {
    const offScreen = this.imageLocation.bottom < userViewport.top
      || this.imageLocation.right < userViewport.left
      || this.imageLocation.left > userViewport.right
      || this.imageLocation.top > userViewport.bottom;
    const { filtering } = this.drawer;
    const notFilteredOut = filtering[this.label.name] || this.state === 'importing';
    return !offScreen && notFilteredOut;
  }

  /**
   * Checks if the current annotation intersects with the reference position
   * @param position the position being checked
   * @returns {boolean} true if intersects
   */
  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  intersects(position) {
  }

  serialize() {
    const {
      geometry,
      label,
      slideId,
      title,
      description,
      properties,
      feedback,
      id,
    } = this;
    return {
      geometry,
      label,
      id,
      feedback,
      'properties': properties,
      'slide_id': slideId,
      'title': title,
      'description': description,
    };
  }

  // setSlideId(slideId) {
  //   this.slideId = slideId;
  // }

  getColor() {
    const { style } = this.drawer;
    const { color } = this.label;
    return {
      color: `${color[0]},${color[1]},${color[2]}`,
      opacity: this.isHovering ? '0.9' : style.fillOpacity,
    };
  }

  update() {
  }

  updateViewport() {
    const topLeft = this.drawer.imagePointToCanvasPoint(this.imageLocation.left, this.imageLocation.top);
    const bottomRight = this.drawer.imagePointToCanvasPoint(this.imageLocation.right, this.imageLocation.bottom);
    this.currentViewport.left = topLeft.x;
    this.currentViewport.top = topLeft.y;
    this.currentViewport.bottom = bottomRight.y;
    this.currentViewport.right = bottomRight.x;
  }

  draw() {
  }
}

class RectAnnotation extends Annotation {
  constructor(drawer, annotation) {
    super(drawer, annotation);

    this.updateImageLocation();
  }

  updateImageLocation() {
    const { points } = this.geometry;
    this.imageLocation.top = points[0].y;
    this.imageLocation.left = points[0].x;
    this.imageLocation.right = points[1].x;
    this.imageLocation.bottom = points[1].y;
  }

  intersects(position) {
    return position.y > this.currentViewport.top && position.y < this.currentViewport.bottom
      && position.x > this.currentViewport.left && position.x < this.currentViewport.right;
  }

  draw() {
    const {
      color,
      opacity,
    } = super.getColor();
    const ctx = this.drawer.ctx;
    const style = this.drawer.style;
    const imageToCanvas = this.drawer.imagePointToCanvasPoint.bind(this.drawer);
    const points = !this.drawFeedback ? this.geometry.points : this.feedback.geometry;
    // shaping:
    const point0 = imageToCanvas(points[0].x, points[0].y);
    const point1 = imageToCanvas(points[1].x, points[1].y);
    ctx.beginPath();
    ctx.rect(
      point0.x,
      point0.y,
      point1.x - point0.x,
      point1.y - point0.y,
    );

    // stylizing:
    if (this.drawFeedback) {
      ctx.setLineDash([2, 2]);
      ctx.font = '18px Arial';
      ctx.fillStyle = `black`;
      ctx.fillText('Feedback version', point0.x, point0.y);
    } else if (this.state === 'editing' || this.state === 'feedback-editing') {
      ctx.setLineDash([10, 5]);
      ctx.lineWidth = style.lineWidth + 2;
      ctx.font = '30px Arial';
      if (this.state === 'creating') {
        ctx.fillText('Preview, press ENTER to save', point0.x, point0.y);
      }
    } else if (this.state === 'idle') {
      ctx.setLineDash([]);
      ctx.lineWidth = style.lineWidth;
    }
    ctx.fillStyle = `rgba(${color}, ${opacity})`;
    ctx.strokeStyle = `rgb(${color})`;

    // drawing:
    ctx.fill();
    ctx.stroke();
  }
}

class RectAnnotationTool {
  constructor(drawer) {
    this.name = 'rect';
    this.drawer = drawer;
    this.newAnnotation = null;
    this.dragging = false;

    this.drawer.setPanningEnabled(false);

    this.info('start');
  }

  destroy() {
    this.newAnnotation = null;
    this.drawer.setPanningEnabled(true);
  }

  info(...help) {
    const info = [];
    if (help.includes('start')) {
      info.push('[db-Click] To start rect');
    }
    if (help.includes('save')) {
      info.push('[db-Click] To finish and save');
    }
    if (help.includes('cancel')) {
      info.push('[Esc] To cancel');
    }
    this.drawer.callback.onInfoUpdate(info);
  }

  mouseEvent(func, e) {
    const imagePosition = this.drawer.mousePointToImagePoint(e.position);

    switch (func) {
      case 'press':
        if (this.dragging === false) {
          const label = this.drawer.currentLabel;
          this.newAnnotation = new RectAnnotation(this.drawer, {
            state: 'creating',
            geometry: {
              type: 'rect',
              points: [
                this.drawer.mousePointToImagePoint(e.position),
                this.drawer.mousePointToImagePoint(e.position),
              ],
            },
            label,
          });
          this.info('save', 'cancel');
          this.dragging = true;
        } else {
          // We will assure point1 < point2

          //   ['x', 'y'].forEach((dim) => {
          //
          //   }
          //     .bind(this);
          // )
          //   ;
          // report the drawing is over
          // drawer.callback.onFinishNewDrawing(this.geometry);
          // drawer.currently_drawing = null;
          // drawer.stateRestorer.cancel();
          this.info('start');
        }
        this.drawer.refresh();
        break;
      case 'move':
        if (this.newAnnotation != null && this.dragging) {
          this.newAnnotation.geometry.points[1] = imagePosition;
          this.drawer.refresh();
        }
        break;
      case 'release':
        this.dragging = false;
        break;
    }
  }

  keyboardEvent(func, e) {
    const drawer = this.drawer;
    switch (func) {
      case 'keyUp':
        if (e.keyCode === 27) {
          // User pressed ESC, we will cancel the drawing
          this.newAnnotation = null;
          drawer.update();
          this.info('start');
          drawer.setPanningEnabled(false);
        } else if (e.keyCode === 13) {
          // User pressed enter, we will complete the drawing

          if (this.newAnnotation != null) {
            if (this.newAnnotation.geometry.points[0].x
              > this.newAnnotation.geometry.points[1].x) {
              const temp = this.newAnnotation.geometry.points[0].x;
              this.newAnnotation.geometry.points[0].x = this.newAnnotation.geometry.points[1].x;
              this.newAnnotation.geometry.points[1].x = temp;
            }
            if (this.newAnnotation.geometry.points[0].y
              > this.newAnnotation.geometry.points[1].y) {
              const temp = this.newAnnotation.geometry.points[0].y;
              this.newAnnotation.geometry.points[0].y = this.newAnnotation.geometry.points[1].y;
              this.newAnnotation.geometry.points[1].y = temp;
            }
          }

          this.newAnnotation.state = 'idle';
          this.newAnnotation.updateImageLocation();
          drawer.update();
          drawer.callback.onFinishNewDrawing(this.newAnnotation);
          this.newAnnotation = null;
          // todo drawer.stateRestorer.cancel();
          this.info('start');
        }
        break;
    }
  }

  draw() {
    if (this.newAnnotation != null) {
      this.newAnnotation.draw();
    }
  }
}

class CircleAnnotation extends Annotation {
  constructor(drawer, annotation) {
    super(drawer, annotation);
    this.updateImageLocation();
  }

  updateImageLocation() {
    const { points } = this.geometry;
    const horizontalRadius = Math.abs(points[0].x - points[1].x);
    const verticalRadius = Math.abs(points[0].y - points[1].y);
    this.imageLocation.left = points[0].x - horizontalRadius;
    this.imageLocation.right = points[0].x + horizontalRadius;
    this.imageLocation.top = points[0].y - verticalRadius;
    this.imageLocation.bottom = points[0].y + verticalRadius;
  }

  intersects(position) {
    return position.y > this.currentViewport.top && position.y < this.currentViewport.bottom
      && position.x > this.currentViewport.left && position.x < this.currentViewport.right;
  }

  draw() {
    const {
      color,
      opacity,
    } = super.getColor();
    const { style } = this.drawer;
    const { points } = this.geometry;

    const position = this.drawer.imagePointToCanvasPoint(points[0].x, points[0].y);
    const radius = this.drawer.imagePointToCanvasPoint(points[1].x, points[1].y);
    const radiusX = Math.abs(position.x - radius.x);
    const radiusY = Math.abs(position.y - radius.y);

    // Drawing:
    this.drawer.ctx.beginPath();
    this.drawer.ctx.ellipse(position.x, position.y, radiusX, radiusY, 0, 2 * Math.PI, 0, false);

    // stylizing:
    this.drawer.ctx.fillStyle = `rgba(${color}, ${opacity})`;
    this.drawer.ctx.strokeStyle = `rgb(${color})`;
    this.drawer.ctx.lineWidth = style.lineWidth;

    // drawing:
    this.drawer.ctx.fill();
    this.drawer.ctx.stroke();
  }
}

class PolygonAnnotation extends Annotation {
  constructor(drawer, annotation) {
    super(drawer, annotation);
    annotation.geometry.points.forEach((point) => {
      if (this.imageLocation.left > point.x) {
        this.imageLocation.left = point.x;
      }
      if (this.imageLocation.right < point.x) {
        this.imageLocation.right = point.x;
      }
      if (this.imageLocation.top > point.y) {
        this.imageLocation.top = point.y;
      }
      if (this.imageLocation.bottom < point.y) {
        this.imageLocation.bottom = point.y;
      }
    });
  }

  intersects(position) {
    return this.drawer.ctx.isPointInPath(this.path, position.x, position.y, 'nonzero');
  }

  update() {
    const points = !this.drawFeedback ? this.geometry.points : this.feedback.geometry;
    const path = new Path2D();
    const startPoint = this.drawer.imagePointToCanvasPoint(points[0].x, points[0].y);
    path.moveTo(startPoint.x, startPoint.y);
    points.forEach((point) => {
      const canvasPos = this.drawer.imagePointToCanvasPoint(point.x, point.y);
      path.lineTo(canvasPos.x, canvasPos.y);
    });
    path.lineTo(startPoint.x, startPoint.y);
    this.path = path;
  }

  draw() {
    const {
      color,
      opacity,
    } = super.getColor();
    const { style } = this.drawer;

    if (this.id == null) {
      this.update();
    }

    // stylizing:
    if (this.drawFeedback) {
      const points = this.feedback.geometry;
      const startPoint = this.drawer.imagePointToCanvasPoint(points[0].x, points[0].y);
      this.drawer.ctx.setLineDash([2, 2]);
      this.drawer.ctx.font = '18px Arial';
      this.drawer.ctx.fillStyle = `black`;
      this.drawer.ctx.fillText('Feedback version', startPoint.x, startPoint.y);
    } else if (this.state === 'editing' || this.state === 'feedback-editing') {
      this.drawer.ctx.setLineDash([10, 5]);
      this.drawer.ctx.lineWidth = style.lineWidth + 2;
    } else if (this.state === 'idle') {
      this.drawer.ctx.setLineDash([]);
      this.drawer.ctx.lineWidth = style.lineWidth;
    }
    this.drawer.ctx.fillStyle = `rgba(${color}, ${opacity})`;
    this.drawer.ctx.strokeStyle = `rgb(${color})`;
    this.drawer.ctx.lineWidth = style.lineWidth;

    // drawing:
    this.drawer.ctx.fill(this.path);
    this.drawer.ctx.stroke(this.path);
  }
}

class AnnotationDrawer {
  constructor(Viewer, callback) {
    // Installing canvas for drawing on top of OpenSeadragon:
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.left = 0;
    canvas.style.top = 0;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    Viewer.canvas.appendChild(canvas);

    // Defining references that will be used throughout this library
    this.viewer = Viewer;
    this.canvas = canvas;
    this.callback = callback;
    this.ctx = canvas.getContext('2d');
    this.annotations = [];
    this.currentlyDrawing = null;
    // this.currentlyEditing = null;
    this.currentLabel = null;
    this.currentTool = null;
    this.elementsOnScreen = [];
    this.filtering = [];
    this.isPanningEnabled = true;
    this.isPanningMode = false;
    this.isCurrentlyHoveringAnnotation = false;
    this.pixelWidth = 0;
    this.isDrawingEnabled = true;
    this.style = {
      fillOpacity: 0.6,
    };
    this.currentViewport = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };

    // Defining function that keeps track of screen updates:
    this.viewer.addHandler('update-viewport', this.updateViewport.bind(this));

    // Setting resize events to handle the annotation canvas size:
    this.viewer.addHandler('resize', () => {
      this.canvas.width = this.viewer.canvas.clientWidth;
      this.canvas.height = this.viewer.canvas.clientHeight;
    });

    // Setup all interaction
    this.mouseTracking = new OpenSeadragon.MouseTracker({
      element: this.viewer.canvas, // .container
      nonPrimaryReleaseHandler: () => {
      },
      releaseHandler: (e) => {
        // no interactions on panning mode or if tools are disabled
        if (this.isToolUsageEnabled()) {
          this.currentTool.mouseEvent('release', e);
        }
        // if (this.isPanningMode || !this.isCurrentlyHoveringAnnotation) return;
        // if (this.currentTool != null) {
        //
        // }
      },
      pressHandler: (e) => {
        // no interactions on panning mode
        if (this.isToolUsageEnabled()) {
          this.currentTool.mouseEvent('press', e);
        }
        // if (this.isPanningMode || !this.isCurrentlyHoveringAnnotation) return;
        // if (this.currentTool != null) {
        //   this.currentTool.mouseEvent('press', e);
        // }
      },
      clickHandler: (e) => {
        if (this.isToolUsageEnabled()) {
          this.currentTool.mouseEvent('click', e);
        } else {
          this.elementsOnScreen.forEach((element) => {
            if (element.isHovering) {
              this.callback.onClick(element);
            }
          });
        }
        // if (this.isPanningMode) return; // no interactions on panning mode
        //
        // if (this.currentTool != null) {
        //   this.currentTool.mouseEvent('click', e);
        // }
        // this.elementsOnScreen.forEach((element) => {
        //   if (element.isHovering) {
        //     this.callback.onClick(element);
        //   }
        // });
      },
      dblClickHandler: (e) => {
        // no interactions on panning mode or tool
        if (this.isToolUsageEnabled()) {
          this.currentTool.mouseEvent('dblClick', e);
        }
        // if (this.isPanningMode || !this.isCurrentlyHoveringAnnotation) return;
        // if (this.currentTool != null) {
        //   this.currentTool.mouseEvent('dblClick', e);
        // }
      },
      moveHandler: (e) => {
        if (this.isToolUsageEnabled()) {
          if (this.currentTool.mouseEvent('move', e)) return;
        }
        // if (this.isPanningMode) return; // no interactions on panning mode
        // if (this.isCurrentlyHoveringAnnotation) {
        //   // Tool interaction is enabled:
        //   if (this.currentTool != null && this.currentTool.mouseEvent('move', e)) return;
        // }

        // When not drawing, we will check for collision with the mouse pointer for interactivity
        let hovering = 0;
        // We only check for interaction when not in editing mode.
        let updateRequired = false;
        this.elementsOnScreen.forEach((annotation) => {
          const intersects = annotation.intersects(e.position);
          const statusUpdateRequired = annotation.isHovering !== intersects;
          updateRequired = updateRequired
            || (intersects && statusUpdateRequired)
            || statusUpdateRequired;

          // Handling element interaction listeners:
          if (statusUpdateRequired) {
            if (intersects) {
              callback.onHover(annotation);
              hovering += 1;
            } else {
              callback.onLeave(annotation);
            }
          }

          annotation.setHovering(intersects);
        });

        if (updateRequired) {
          if (hovering > 0) {
            // When hovering one or more elements, the cursor is a pointer and no tool interaction
            this.canvas.style.cursor = 'pointer';
            this.isCurrentlyHoveringAnnotation = true;
          } else {
            // No elements are being hovered, return interaction
            this.canvas.style.cursor = 'default';
            this.isCurrentlyHoveringAnnotation = false;
          }
          this.refresh();
        }
      },
      keyDownHandler: (e) => {
        // On keydown we will check if user is switching to panning mode (pressing SPACE)
        if (!this.isPanningEnabled) {
          if (e.keyCode === 32) { // SPACE key
            this.viewer.panHorizontal = true;
            this.viewer.panVertical = true;
            this.panningMode = true;
            return;
          }
        }
        if (this.currentTool != null) {
          this.currentTool.keyboardEvent('keyDown', e);
        }
      },
      keyUpHandler: (e) => {
        // On keyup we will check if users wants to leave panning mode (releasing SPACE)
        if (!this.isPanningEnabled) {
          if (e.keyCode === 32) {
            this.viewer.panHorizontal = false;
            this.viewer.panVertical = false;
            this.panningMode = false;
            return;
          }
        }

        if (this.currentTool != null) {
          this.currentTool.keyboardEvent('keyUp', e);
        }
      },
    });

    this.canvas.width = this.viewer.canvas.clientWidth;
    this.canvas.height = this.viewer.canvas.clientHeight;
  }

  /**
   * Sets the current tool. The tool must be the class of the tool, which will be instantiated
   * by the function.
   * @param value The class of the AnnotationTool
   */
  set tool(value) {
    if (this.currentTool != null) {
      this.currentTool.destroy();
    }
    const tools = {
      'rect': RectAnnotationTool,
      'polygon': PolygonAnnotationTool,
      'circle': CircleAnnotationTool,
      'ruler': RulerTool
    };

    // We will instantiate the tool:
    if (value != null && value in tools) {
      this.currentTool = new tools[value](this);
    } else {
      this.currentTool = null;
    }
  }

  get tool() {
    if (this.currentTool != null) {
      return this.currentTool.name;
    } else {
      return 'none';
    }
  }

  set label(value) {
    if (this.currentTool != null) {
      // Label was changed, we need to refresh the screen
      this.refresh();
    }
    this.currentLabel = value;
  }

  set panningMode(value) {
    if (value) {
      this.canvas.style.cursor = 'grab';
    } else {
      if (!this.isCurrentlyHoveringAnnotation) {
        // We will assume the user is currently on a blank space:
        this.canvas.style.cursor = 'default';
      } else {
        // Just for continuity, we will assume the user is hovering over an annotation:
        this.canvas.style.cursor = 'pointer';
      }
    }
    this.isPanningMode = value;
  }

  /**
   * Starts the editing process of an annotation
   * @param annotation
   */
  editAnnotation(annotation) {
    if (this.currentTool != null) {
      this.currentTool.destroy();
    }
    this.currentTool = new PathMeshEditor(annotation, this);
    this.refresh();
    // Finally, we save the first state as a restoration point for the user
    // this.currently_editing.addRestorePoint('editing');
  }

  cancelEdit() {
    if (this.currentTool instanceof PathMeshEditor) {
      this.tool = null;
    }
    this.update();
  }

  concludeEdit() {
    if (this.currentTool instanceof PathMeshEditor) {
      this.currentTool.conclude();
      this.tool = null;
    }
  }

  //   concludeEdit() {
//     // Disable the editing tool and update view
//     console.log('concludeEdit:', this.currently_editing.geometry);
//     this.callback.onFinishedEditing(true, this.currently_editing.geometry);
//     this.currently_editing = null;
//     this.update();
//   },

  /**
   * Load the annotations and instantiate the drawers.
   * @param annotations the list of annotations to load
   */
  loadAnnotations(annotations) {
    if (annotations == null) return;
    const instantiators = {
      rect: (annotation) => new RectAnnotation(this, annotation),
      circle: (annotation) => new CircleAnnotation(this, annotation),
      polygon: (annotation) => new PolygonAnnotation(this, annotation),
    };
    this.annotations = annotations.map((annotation) => {
      const { type } = annotation.geometry;
      return instantiators[type](annotation);
    });
    this.update();
    return this.annotations;
  }

  /**
   * Checks if interactions such as mouse ou keyboard events should be passed to the current tool.
   * In some cases, such as when in panning mode or if the interaction is disabled, we don't wa
   * @returns {boolean|*|boolean}
   */
  isToolUsageEnabled() {
    if (this.isPanningMode) {
      // No tools are allowed when in panning mode (when pressing SPACE):
      return false;
    } else if (this.currentTool != null) {
      // Only makes sense if there is a current tool
      if (this.currentTool instanceof PathMeshEditor) {
        // if current tool is the PathMeshEditor (for editing), we want to bypass hovering locks
        return true;
      }
      // Tool interaction is only allowed when not hovering a annotation
      return !this.isCurrentlyHoveringAnnotation;
    }

    // There is no tool, so no:
    return false;
  }

  setPanningEnabled(isEnabled) {
    this.viewer.panHorizontal = isEnabled;
    this.viewer.panVertical = isEnabled;
    this.isPanningEnabled = isEnabled;
    this.panningMode = false;
  }

  /**
   * Updates the current viewport (portion of the image the user is looking)
   * and returns whether it changed
   * @returns {boolean} true if the viewport has changed
   */
  calculateViewport() {

    const { ctx } = this;
    const viewportMin = this.viewer.viewport.windowToImageCoordinates(
      new OpenSeadragon.Point(0, 0),
    );
    const viewportMax = this.viewer.viewport.windowToImageCoordinates(
      new OpenSeadragon.Point(ctx.canvas.width, ctx.canvas.height),
    );

    const updateRequired = (viewportMin.x !== this.currentViewport.left
      || viewportMin.y !== this.currentViewport.bottom
      || viewportMax.x !== this.currentViewport.right
      || viewportMax.y !== this.currentViewport.top);

    this.currentViewport.top = viewportMin.y;
    this.currentViewport.bottom = viewportMax.y;
    this.currentViewport.left = viewportMin.x;
    this.currentViewport.right = viewportMax.x;

    return updateRequired;
  }

  updateViewport() {
    // The viewport has updated:
    if (this.calculateViewport()) {
      // Viewport has changed, we will make the required modifications
      this.callback.onViewportChanged(this.currentViewport);
      this.update();
    }
  }

  mousePointToImagePoint(mouseEvent) {
    const viewportPoint = this.viewer.viewport.pointFromPixel(mouseEvent);
    const coordinates = this.viewer.viewport.viewportToImageCoordinates(viewportPoint.x, viewportPoint.y);
    return {
      x: coordinates.x,
      y: coordinates.y,
    };
  }

  imagePointToCanvasPoint(x, y) {
    const point = new OpenSeadragon.Point(x, y);
    return this.viewer.viewport.imageToViewerElementCoordinates(point);
  }

  peep(annotation) {
    const viewer = this.viewer;
    const imageLocation = annotation.imageLocation;
    const annotationWidth = imageLocation.right - imageLocation.left;
    const annotationHeight = imageLocation.bottom - imageLocation.top;
    const horizontalCenter = annotationWidth / 2;
    const verticalCenter = annotationHeight / 2;
    const panTo = viewer.viewport.imageToViewportCoordinates(
      imageLocation.left + horizontalCenter,
      imageLocation.top + verticalCenter
    );
    viewer.viewport.panTo(panTo, false);
    const tiledImage = viewer.world.getItemAt(0);
    const yZoom = tiledImage.source.dimensions.y / annotationHeight;
    const xZoom = tiledImage.source.dimensions.x / annotationWidth;
    const zoom = (yZoom < xZoom ? yZoom : xZoom);
    viewer.viewport.zoomTo(zoom - (zoom * 0.5), false);
  }

  /**
   * Updates the elements on the screen, usually when there is panning or zooming
   */
  update() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    const self = this;
    self.elementsOnScreen = [];
    if (this.annotations != null) {
      this.annotations.forEach((annotation) => {
        // Checking if annotation should be visible
        annotation.updateViewport(); // for collision checks
        if (annotation.shouldBeVisible(self.currentViewport)) {
          // Annotation would be visible on the screen, does the user want to see it?
          if (self.filtering[annotation.label.name]) {
            // This annotation must be drawn:
            annotation.update();
            annotation.draw();
            self.elementsOnScreen.push(annotation);
          }
        }
      });
    }
    if (this.currentTool != null) {
      this.currentTool.draw();
    }
  }

  /**
   * Refreshes the elements on screen, when no changes to the objects are required
   */
  refresh() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    this.elementsOnScreen.forEach((annotation) => {
      if (annotation.shouldBeVisible(this.currentViewport)) {
        annotation.draw();
      }
    });

    if (this.currentTool != null) {
      this.currentTool.draw();
    }
  }
}

function loadAnnotations(rawAnnotations, drawer) {
  const instantiators = {
    rect: RectAnnotation,
    circle: CircleAnnotation,
    polygon: PolygonAnnotation,
  };

  const drawerInstance = drawer;
  const annotations = {};
  Object.entries(rawAnnotations)
    .forEach(([slideId, slideAnnotations]) => {
      annotations[slideId] = slideAnnotations.map(annotation => {
        const { type } = annotation.geometry;
        return new instantiators[type](drawerInstance, annotation);
      });
    });
  return annotations;
}

export {
  AnnotationDrawer,
  RectAnnotationTool,
  PolygonAnnotationTool,
  Annotation,
  optimizePath,
  loadAnnotations
};

//
// export default {
//   annotations: [],
//
//   current_label: null,
//
//   /**
//    * When false, SliceDrawer doesn't allow any drawing
//    */
//   enabled: true,
//
//   /**
//    * Elements currently being rendering are added to this list. This list is mostly used to check
//    * mouse interaction with the elements.
//    */
//   elementsOnScreen: [],
//
//   stateRestorer: null,
//
//   /**
//    * The current drawing tool
//    */
//   set tool(name) {
//     this.new_tool = this.tools[name]();
//     this.set_canvas_pan(true);
//     this.viewer.canvas.focus();
//   },
//   get tool() {
//     if (this.new_tool != null) {
//       return this.new_tool.name;
//     }
//     return 'none';
//   },
//
//   set editorMode(name) {
//     this.currently_editing.create_mode(name);
//     this.viewer.canvas.focus();
//   },
//   get editorMode() {
//     return '';
//   },
//
//   /**
//    *
//    */
//   pixel_width: 0,
//
//   tools: {},
//
//   drawingStyle: {
//     region_opacity: 0.3,
//     line_weight: 1,
//   },
//
//   /**
//    * Elements can be filtered so it won't render.
//    * Label => boolean
//    */
//   filtering: {},
//
//   /**
//    * The element being currently edited.
//    * We may be able to join two paths by checking if a given point intersects the other shape. Points from
//    * both shapes that intersects another are added to a list for removal. Once we have a list, we remove the elements.
//    * The new shape is created by joining the points from the two path in the index of the first removed element.
//    * Arbitrary shapes (brush, rect) may be converted to path (by sampling and optimizing) before being joined.
//    * The shapes may be joined after the drawing.
//    */
//   currently_editing: null,
//
//   new_tool: null,
//
//   /**
//    * The polygon currently being draw
//    */
//   currently_drawing: null,
//
//   /**
//    * Throttle behavior for improving performance when there are too many elements to draw
//    */
//   _lastUpdate: 0,
//
//   /**
//    * Keeps track of the viewport in image pixels. This is used to notify when the
//    * canvas is dirty and needs to be redraw.
//    */
//   _viewportLocation: {
//     min: [],
//     max: [],
//   },
//
//   editElement(annotation) {
//     this.currently_editing = PathMeshEditor.init(this, annotation, 'mover');
//     this.update();
//     // Finally, we save the first state as a restoration point for the user
//     this.currently_editing.addRestorePoint('editing');
//   },
//
//   concludeEdit() {
//     // Disable the editing tool and update view
//     console.log('concludeEdit:', this.currently_editing.geometry);
//     this.callback.onFinishedEditing(true, this.currently_editing.geometry);
//     this.currently_editing = null;
//     this.update();
//   },
//
//   cancelEdit() {
//     this.currently_editing.cancel();
//     this.currently_editing = null;
//     this.update();
//   },
//
//   resize() {
//
//   },
//
//   _mousePointToImagePoint(mouseEvent) {
//     const viewportPoint = this.viewer.viewport.pointFromPixel(mouseEvent);
//     const coordinates = this.viewer.viewport.viewportToImageCoordinates(viewportPoint.x, viewportPoint.y);
//     return {
//       x: coordinates.x,
//       y: coordinates.y,
//     };
//   },
//
//   _imagePointToCanvasPoint(x, y) {
//     const point = new OpenSeadragon.Point(x, y);
//     return this.viewer.viewport.imageToViewerElementCoordinates(point);
//   },
//
//   update() {
//     // console.log("update called", this.annotations)
//     if (this.ctx == null) return;
//
//     const { ctx } = this;
//     if (this._lastUpdate > Date.now() - (this.elementsOnScreen.length / 5)) {
//       return;
//     }
//     ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
//     if (this.annotations == null) {
//       return;
//     }
//
//     const viewportMin = this._viewportLocation.min;
//     const viewportMax = this._viewportLocation.max;
//     this.elementsOnScreen = [];
//     this.annotations.forEach((annotation) => {
//       if (this.filtering[annotation.label.name] && annotation.geometry != null) {
//         // We will only draw when the label of the element isn't filter out
//         const firstPoint = annotation.geometry.points[0];
//         if ((firstPoint.x > viewportMin.x && firstPoint.x < viewportMax.x)
//           && (firstPoint.y > viewportMin.y && firstPoint.y < viewportMax.y)) {
//           this._draw_annotation(annotation);
//           this.elementsOnScreen.push(annotation);
//         }
//       }
//     });
//     if (this.currently_drawing != null) {
//       this._draw_annotation(this.currently_drawing);
//     }
//
//     // We are editing a element, let's draw the controls
//     if (this.currently_editing != null) {
//       this.currently_editing.draw(ctx);
//     }
//
//     if (typeof this.new_tool.draw === 'function') {
//       this.new_tool.draw(ctx);
//     }
//
//     this._lastUpdate = Date.now();
//   },
//
//   _draw_annotation(annotation) {
//     switch (annotation.geometry.type) {
//       case 'polygon':
//         this._update_polygon(annotation);
//         break;
//       case 'rect':
//         this._update_rect(annotation);
//         break;
//       case 'circle':
//         this._update_circle(annotation);
//         break;
//       case 'brush':
//         this._update_brush(annotation);
//         break;
//     }
//   },
//
//   _gen_color(rgb) {
//     return `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
//   },
//
//   _update_polygon(annotation, color) {
//     const { ctx } = this;
//     const { points } = annotation.geometry;
//     const color_code = this._gen_color(color == null ? annotation.label.color : color);
//     const path = this._update_path(points);
//
//     const startPoint = this._imagePointToCanvasPoint(points[0].x, points[0].y);
//     path.lineTo(startPoint.x, startPoint.y);
//     annotation.meta.path = path;
//     ctx.fillStyle = `rgba(${color_code}, ${annotation.meta.is_hover ? '0.6' : this.drawingStyle.region_opacity})`;
//     ctx.strokeStyle = `rgb(${color_code})`;
//     ctx.lineWidth = this.drawingStyle.line_weight;
//     ctx.fill(path);
//     ctx.stroke(path);
//   },
//
//   _update_rect(annotation, color) {
//     // console.log(rect_data)
//     const { ctx } = this;
//     const position = this._imagePointToCanvasPoint(annotation.geometry.points[0].x, annotation.geometry.points[0].y);
//     const limits = this._imagePointToCanvasPoint(annotation.geometry.points[1].x, annotation.geometry.points[1].y);
//     const color_code = this._gen_color(color == null ? annotation.label.color : color);
//     ctx.beginPath();
//     ctx.rect(position.x, position.y, limits.x - position.x, limits.y - position.y);
//     annotation.meta._canvas_points = [position, limits];
//     // console.log("_update_rect", position.x, position.y, position.x - limits.x, position.y - limits.y)
//     ctx.fillStyle = `rgba(${color_code}, ${annotation.meta.is_hover ? '0.6' : this.drawingStyle.region_opacity})`;
//     ctx.strokeStyle = `rgb(${color_code})`;
//     ctx.lineWidth = this.drawingStyle.line_weight;
//     ctx.fill();
//     ctx.stroke();
//   },
//
//   _update_circle(annotation) {
//     const { ctx } = this;
//     const color_code = this._gen_color(annotation.label.color);
//     ctx.beginPath();
//     const position = this._imagePointToCanvasPoint(annotation.geometry.points[0].x, annotation.geometry.points[0].y);
//     const radius = this._imagePointToCanvasPoint(annotation.geometry.points[1].x, annotation.geometry.points[1].y);
//     const radiusX = Math.abs(position.x - radius.x);
//     const radiusY = Math.abs(position.y - radius.y);
//     annotation.meta._canvas_points = [
//       {
//         x: position.x - radiusX,
//         y: position.y - radiusY,
//       },
//       {
//         x: position.x + radiusX,
//         y: position.y + radiusY,
//       },
//     ];
//     ctx.ellipse(position.x, position.y, radiusX, radiusY, 0, 2 * Math.PI, 0, false);
//     ctx.fillStyle = `rgba(${color_code}, ${annotation.meta.is_hover ? '0.6' : this.drawingStyle.region_opacity})`;
//     ctx.strokeStyle = `rgb(${color_code})`;
//     ctx.lineWidth = this.drawingStyle.line_weight;
//     ctx.fill();
//     ctx.stroke();
//   },
//
//   _update_path(points) {
//     const path = new Path2D();
//     const startPoint = this._imagePointToCanvasPoint(points[0].x, points[0].y);
//     path.moveTo(startPoint.x, startPoint.y);
//     points.forEach((point) => {
//       const canvasPos = this._imagePointToCanvasPoint(point.x, point.y);
//       path.lineTo(canvasPos.x, canvasPos.y);
//     });
//     // path.closePath()
//     return path;
//   },
//
//   _update_brush(annotation) {
//     const { ctx } = this;
//     const { points } = annotation.geometry;
//     const color_code = this._gen_color(annotation.label.color);
//     // console.log("lineWidth", lineWidth)
//     ctx.lineWidth = this._imagePointToCanvasPoint(annotation.geometry.size, 0).x - this._imagePointToCanvasPoint(0, 0).x;
//     ctx.lineCap = 'round';
//     ctx.lineJoin = 'round';
//     ctx.strokeStyle = `rgba(${color_code}, ${annotation.meta.is_hover ? '0.6' : this.drawingStyle.region_opacity})`;
//
//     const path = this._update_path(points);
//
//     annotation.meta.path = path;
//     ctx.stroke(path);
//   },
//
//   set_canvas_pan(enabled) {
//     this.viewer.panHorizontal = enabled;
//     this.viewer.panVertical = enabled;
//   },
//
//   peep(annotation) {
//     const { viewer } = this;
//     let xmin = 10000000;
//     let xmax = -1;
//     let ymin = 10000000;
//     let ymax = -1;
//     annotation.geometry.points.forEach((coord) => {
//       if (coord.x < xmin) xmin = coord.x;
//       if (coord.x > xmax) xmax = coord.x;
//       if (coord.y < ymin) ymin = coord.y;
//       if (coord.y > ymax) ymax = coord.y;
//     });
//     const panTo = viewer.viewport.imageToViewportCoordinates((xmax + xmin) / 2, (ymax + ymin) / 2);
//     console.log('panTo:', panTo, ' | ', xmin, xmax, ymin, ymax);
//     viewer.viewport.panTo(panTo, false);
//     const tiledImage = viewer.world.getItemAt(0);
//     const yZoom = tiledImage.source.dimensions.y / (ymax - ymin);
//     // const xZoom = viewer.viewport.getContainerSize().x / (xmax - xmin)
//     const xZoom = tiledImage.source.dimensions.x / (xmax - xmin);
//     const zoom = (yZoom < xZoom ? yZoom : xZoom);
//     viewer.viewport.zoomTo(zoom - (zoom * 0.5), false);
//     // console.log("targetZoom:", targetZoom, tiledImage.source.dimensions.x, "|", viewer.viewport.getContainerSize().x)
//   },
//
//   /**
//    * Instantiate a SliceDrawer for the OpenSeadragon viewer.
//    * Object interaction events can be listened using the callback parameter by passing a object as such:
//    * {
//    *     onHover: (element) => {} // mouse over element
//    *     onLeave: (element) => {} // mouse left the element
//    *     onClick: (element) => {} // mouse click on a element
//    *     newElementDrawn: (element) => {} // new element was drawn
//    * }
//    *
//    * @param Viewer the OpenSeadragon viewer instance
//    * @param callback a object containing the required callbacks
//    */
//   init(Viewer, callback) {
//     // Drawing canvas creation
//
//     // Create references:
//
//     this.tools = {
//       polygon: () => polygonTool.init(this),
//       free: () => freeTool.init(this),
//       rect: () => rectTool.init(this),
//       circle: () => circleTool.init(this),
//       brush: () => brushTool.init(this),
//       ruler: () => rulerTool.init(this),
//       none: () => nullTool.init(this),
//     };
//     this.tool = this.enabled ? 'polygon' : 'none';
//
//     this.resize(Viewer.canvas.width, Viewer.canvas.height);
//   },
// };
