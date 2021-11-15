import os
from io import BytesIO

_dll_path = "libs/openslide-win/"
if _dll_path is not None:
    if hasattr(os, 'add_dll_directory'):
        # Python >= 3.8
        with os.add_dll_directory(_dll_path):
            import openslide
    else:
        # Python < 3.8
        _orig_path = os.environ.get('PATH', '')
        os.environ['PATH'] = "libs/openslide-win/"
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


class Session:
    def __init__(self, slides, user_task) -> None:
        self._session_slides = {slide['id']: slide for slide in slides}
        default_slide = openslide.open_slide(slides[0]['file'])
        self._slides_instance = {slides[0]['id']: default_slide}
        self._slides_zoom = {slides[0]['id']: DeepZoomGenerator(default_slide)}
        self.user_task = user_task

    def get_info(self):
        return {k: {
            "filename": self._session_slides[k],
            "pixel_width": self._slides_instance[k].properties[openslide.PROPERTY_NAME_MPP_X],
            "pixel_height": self._slides_instance[k].properties[openslide.PROPERTY_NAME_MPP_Y]
        } for k in self._slides_instance}

    def load_slide(self, slide_id):
        slide = self._session_slides[slide_id]
        slide_file = openslide.open_slide(slide['file'])
        self._slides_instance = {slide['id']: slide_file}
        self._slides_zoom = {slide['id']: DeepZoomGenerator(slide_file)}

    def get_slide_info(self, slide_id):
        if slide_id not in self._slides_instance:
            self.load_slide(slide_id)
        return self._slides_zoom[slide_id].get_dzi(DEEPZOOM_FORMAT)

    def get_slide_tile(self, slide, level, address, format) -> BytesIO:
        """


        :param slide:
        :param level:
        :param address:
        :return:
        """
        if slide in self._slides_zoom:
            buf = BytesIO()
            tile = self._slides_zoom[slide].get_tile(level, address)
            tile.save(buf, format, quality=DEEPZOOM_TILE_QUALITY)
            return buf
