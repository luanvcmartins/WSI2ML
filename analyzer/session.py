import os
from io import BytesIO

_dll_path = "libs/openslide-win64-20231011/bin/"
if _dll_path is not None:
    if hasattr(os, 'add_dll_directory'):
        # Python >= 3.8
        with os.add_dll_directory(os.path.abspath(_dll_path)):
            import openslide
    else:
        # Python < 3.8
        _orig_path = os.environ.get('PATH', '')
        os.environ['PATH'] = "libs/openslide-win64-20231011/"
        import openslide

        os.environ['PATH'] = _orig_path
from openslide import OpenSlide, OpenSlideError, ImageSlide
from openslide.deepzoom import DeepZoomGenerator

DEEPZOOM_SLIDE = None
DEEPZOOM_FORMAT = 'jpeg'
DEEPZOOM_TILE_SIZE = 254
DEEPZOOM_OVERLAP = 1
DEEPZOOM_LIMIT_BOUNDS = True
DEEPZOOM_TILE_QUALITY = 75


def put_optional(property_list, slide, property_alias, property_name):
    if property_name in slide.properties:
        property_list[property_alias] = slide.properties[property_name]
    return property_list


def get_slide_properties(filename):
    slide = openslide.open_slide(filename)

    properties = {}
    put_optional(properties, slide, "quickhash", openslide.PROPERTY_NAME_QUICKHASH1)
    put_optional(properties, slide, "height", openslide.PROPERTY_NAME_BOUNDS_HEIGHT)
    put_optional(properties, slide, "width", openslide.PROPERTY_NAME_BOUNDS_WIDTH)
    put_optional(properties, slide, "pixel_width", openslide.PROPERTY_NAME_MPP_X)
    put_optional(properties, slide, "pixel_height", openslide.PROPERTY_NAME_MPP_Y)
    put_optional(properties, slide, "vendor", openslide.PROPERTY_NAME_VENDOR)
    put_optional(properties, slide, "background_color", openslide.PROPERTY_NAME_BACKGROUND_COLOR)
    put_optional(properties, slide, "comment", openslide.PROPERTY_NAME_COMMENT)
    put_optional(properties, slide, "object_power", openslide.PROPERTY_NAME_OBJECTIVE_POWER)
    slide.close()

    return properties


def get_metadata(slide_properties, key, default="0"):
    if key in slide_properties:
        return slide_properties[key]
    else:
        return default


class Session:
    def __init__(self, slide_file) -> None:
        self._session_slide = slide_file
        default_slide = openslide.open_slide(slide_file)
        self._slides_instance = default_slide
        self._slides_zoom = DeepZoomGenerator(default_slide)

    def get_info(self):
        return {
            "filename": self._session_slide,
            "pixel_width": float(get_metadata(self._slides_instance.properties, openslide.PROPERTY_NAME_MPP_X)),
            "pixel_height": float(get_metadata(self._slides_instance.properties, openslide.PROPERTY_NAME_MPP_Y))
        }


    def get_slide_info(self, slide_id="default"):
        return self._slides_zoom.get_dzi(DEEPZOOM_FORMAT)

    def get_slide_tile(self, slide, level, address, format) -> BytesIO:
        """


        :param slide:
        :param level:
        :param address:
        :return:
        """
        buf = BytesIO()
        tile = self._slides_zoom.get_tile(level, address)
        tile.save(buf, format, quality=DEEPZOOM_TILE_QUALITY)
        return buf
