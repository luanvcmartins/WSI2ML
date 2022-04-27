/* eslint-disable prefer-destructuring */
import OpenSeadragon from 'openseadragon';
import _ from 'lodash';

function lineFunction(point1, point2, point3) {
  const line1Slope = (point2.y - point1.y) / (point2.x - point1.x);
  const line2Slope = (point3.y - point2.y) / (point3.x - point2.x);
  const line1B = point1.x * line1Slope - point1.y;
  const line2B = point3.x * line2Slope - point3.y;
  return [
    {
      slope: line1Slope,
      b: line1B,
    },
    {
      slope: line2Slope,
      b: line2B,
    },
  ];
}

/**
 * A simple algorithm to detect and remove redundant points made in free draw.
 * It returns an array of points without the points that don't contribute to the shape.
 *
 * @param points the array of points
 * @returns {*}
 */
function optimizePath(points) {
  let toRemove = [];
  do {
    toRemove = [];
    for (let i = 1; i < points.length - 1; i += 1) {
      const point1 = points[i - 1];
      const point2 = points[i];
      const point3 = points[i + 1];
      const lineFunc = lineFunction(point1, point2, point3);
      if (lineFunc[0].slope === lineFunc[1].slope && lineFunc[0].b === lineFunc[1].b) {
        toRemove.push(i);
      }
    }

    for (let i = 1; i < points.length; i += 1) {
      const point1 = points[i - 1];
      const point2 = points[i];
      const distance1 = Math.hypot(point1.x - point2.x, point1.y - point2.y);
      if (distance1 < 5) {
        toRemove.push(i);
      }
    }

    points = points.filter((item, idx) => !toRemove.includes(idx));
  } while (toRemove.length !== 0);
  return points;
}

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
                this.drawer.mousePointToImagePoint(e.position),
              ],
            },
            label,
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
      default:
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
      default:
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
    const line1Slope = (point2.y - point1.y) / (point2.x - point1.x);
    const line1B = point1.x * line1Slope - point1.y;
    return {
      slope: -1 / line1Slope,
      b: -1 / line1B,
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
      default:
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
        this.startingPoint.y - this.endingPoint.y,
      );
      // const perpendicular = this.perpendicularLine(startPoint, endPoint)
      const ruler = new Path2D();
      ruler.moveTo(startPoint.x, startPoint.y);
      ruler.lineTo(endPoint.x, endPoint.y);

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
      ctx.fillText(
        text,
        30 + startPoint.x + ((endPoint.x - startPoint.x) / 2),
        startPoint.y + ((endPoint.y - startPoint.y) / 2),
      );
      ctx.strokeText(
        text,
        30 + startPoint.x + ((endPoint.x - startPoint.x) / 2),
        startPoint.y + ((endPoint.y - startPoint.y) / 2),
      );
    }
  }
}

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
    this.stateRestorer.cancel();
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
                y: imagePosition.y,
              }],
            },
            label,
          });
          this.stateRestorer = new StateRestorer(this.drawer, this.newAnnotation);
        } else {
          this.newAnnotation.geometry.points.push(imagePosition);
          this.stateRestorer.addRestorePoint('Added point');
        }
        this.drawer.refresh();
        break;
      case 'move':
        if (this.dragging && this.newAnnotation != null) {
          this.newAnnotation.geometry.points.push(imagePosition);
          this.stateRestorer.addRestorePoint('Added point');
          this.drawer.refresh();
        }
        break;
      case 'release':
        this.dragging = false;
        this.info('continue', 'pan', 'save', 'cancel');
        break;
      default:
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
          this.newAnnotation.update();
          this.drawer.callback.onFinishNewDrawing(this.newAnnotation);
          this.newAnnotation = null;
          this.drawer.update();
        }
      } else if (e.keyCode === 27) {
        // User pressed ESC
        this.newAnnotation = null;
        this.drawer.refresh();
        this.stateRestorer.cancel();
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
    const areaRadius = ((drawer.currentViewport.bottom - drawer.currentViewport.top)
      / drawer.canvas.clientWidth) * 25;
    return mousePosition.x > position.x - areaRadius && mousePosition.x < position.x + areaRadius
      && mousePosition.y > position.y - areaRadius && mousePosition.y < position.y + areaRadius;
  }

  getIntersectingControl(position) {
    let intersectingControl = null;
    this.controls.forEach((control) => {
      if (this.intersectsControl(position, control.point)) {
        intersectingControl = control;
      }
    });
    return intersectingControl;
  }

  mouseEvent(func, e) {
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
        // Intersects no control, which means that if it intersects the item,
        // we should add a new node
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
    }
  }

  keyboardEvent(func, e) {
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
    for (let i = 1; i < points.length; i += 1) {
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
        this.annotation.feedback.geometry = this.annotation.geometry.points.map((point) => ({
          x: point.x,
          y: point.y,
        }));
      }
      // Not we will create the points based on the feedback data
      this.controls = this.annotation.feedback.geometry.map((point, index) => ({
        canvasPosition: null,
        index,
        point,
      }));
    } else {
      // This is a normal edit operation, we will interact with the original geometry
      this.controls = this.annotation.geometry.points.map((point, index) => ({
        canvasPosition: null,
        index,
        point,
      }));
    }
  }
}

/* the conversion from pixel to shape may be done with a search algorithm.
The points are the pixels which were unable to find add one of its side to the search */

class StateRestorer {
  constructor(instance, annotation) {
    this.instance = instance;
    this.annotation = annotation;
    this.states = [];
    this.currentStatePoint = 0;
    this.instance.callback.onStateRestorerEvent(this);
  }

  addRestorePoint(event) {
    if (this.states.length > 0 && this.currentStatePoint !== this.states.length - 1) {
      // We are overriding the past, we will clear the states
      this.states.splice(this.currentStatePoint, this.states.length - this.currentStatePoint);
    }
    this.states.push({
      type: event,
      points: this.annotation.geometry.points.map((item) => ({
        x: item.x,
        y: item.y,
      })),
    });
    this.currentStatePoint = this.states.length - 1;
    this.instance.callback.onStateRestorerEvent(this);
    // todo report state changed
  }

  restoreToPoint(value) {
    console.log('restoreToPoint', value);
    this.annotation.geometry.points = this.states[value].points;
    this.instance.update();
    this.currentStatePoint = value;
    this.instance.callback.onStateRestorerEvent(this);
  }

  cancel() {
    this.instance.stateRestorer = null;
    this.states = null;
    this.instance.callback.onStateRestorerEvent(null);
  }
}

class Annotation {
  constructor(drawer, annotation) {
    this.drawer = drawer;

    // Annotation data:
    this.id = annotation.id;
    this.geometry = annotation.geometry;
    this.label = annotation.label;
    this.slideId = annotation.slide_id;
    this.title = annotation.title == null ? null : annotation.title;
    this.description = annotation.description == null ? null : annotation.description;
    this.properties = annotation.properties == null ? null : annotation.properties;
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
      properties,
      slide_id: slideId,
      title,
      description,
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
      opacity: this.isHovering ? style.hoverOpacity : style.fillOpacity,
    };
  }

  update() {
  }

  updateViewport() {
    const topLeft = this.drawer
      .imagePointToCanvasPoint(this.imageLocation.left, this.imageLocation.top);
    const bottomRight = this.drawer
      .imagePointToCanvasPoint(this.imageLocation.right, this.imageLocation.bottom);
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
      ctx.fillStyle = 'black';
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
      default:
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
      default:
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
    this.updateImageLocation();
  }

  updateImageLocation() {
    this.geometry.points.forEach((point) => {
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
      this.drawer.ctx.fillStyle = 'black';
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
    this.viewer.addHandler('update-viewport', _.throttle(this.updateViewport.bind(this)));

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
      },
      dblClickHandler: (e) => {
        // no interactions on panning mode or tool
        if (this.isToolUsageEnabled()) {
          this.currentTool.mouseEvent('dblClick', e);
        }
      },
      moveHandler: (e) => {
        if (this.isToolUsageEnabled()) {
          if (this.currentTool.mouseEvent('move', e)) return;
        }

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
      rect: RectAnnotationTool,
      polygon: PolygonAnnotationTool,
      circle: CircleAnnotationTool,
      ruler: RulerTool,
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
    }
    return 'none';
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
    } else if (!this.isCurrentlyHoveringAnnotation) {
      // We will assume the user is currently on a blank space:
      this.canvas.style.cursor = 'default';
    } else {
      // Just for continuity, we will assume the user is hovering over an annotation:
      this.canvas.style.cursor = 'pointer';
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

  /**
   * Load the annotations and instantiate the drawers.
   * @param annotations the list of annotations to load
   */
  loadAnnotations(annotations) {
    if (annotations == null) return [];
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
    }
    if (this.currentTool != null) {
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
    const coordinates = this.viewer.viewport
      .viewportToImageCoordinates(viewportPoint.x, viewportPoint.y);
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
      imageLocation.top + verticalCenter,
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
          if (self.filtering[annotation.label.name]
            || (annotation.state === 'importing' && self.style.showImporting)) {
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
      annotations[slideId] = slideAnnotations.map((annotation) => {
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
  loadAnnotations,
};
