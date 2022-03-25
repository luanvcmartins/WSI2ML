from shapely.affinity import scale
from shapely.geometry import Polygon, box, Point


def annotation_stats(annotations):
    counts = {}
    for annotation in annotations:
        annotation_label = annotation.label
        annotation_type = annotation.data["type"]
        points = annotation.data["points"]
        if annotation_type == "polygon":
            area = Polygon([(point['x'], point['y']) for point in points]).area
        elif annotation_type == "rect":
            point1, point2 = points
            area = box(point1['x'], point1['y'], point2['x'], point2['y']).area
        elif annotation_type == "circle":
            point1, point2 = points
            circle = Point((point1['x'], point1['y'])).buffer(1)
            circle = scale(circle, point1['x'] - point2['x'], point1['y'] - point2['y'])
            area = circle.area
        else:
            area = 0
        if annotation_label.name not in counts:
            counts[annotation_label.name] = {
                'count': 0,
                'area': 0,
                'certain_area': 0,
                'desc': 0,
                'color': annotation_label.color
            }
        counts[annotation_label.name]['count'] += 1
        counts[annotation_label.name]['area'] += area
        if annotation.description != "" and annotation.description is not None:
            # this annotation has a description, it might not be 100% trustworthy
            counts[annotation_label.name]['desc'] += 1
        else:
            # this annotation has no description, we most likely will be using it
            counts[annotation_label.name]['certain_area'] += area

    return counts
