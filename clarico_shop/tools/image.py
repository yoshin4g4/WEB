from odoo import api, fields, models, tools, _   
import base64
import codecs
import io
import logging
from PIL import Image
from PIL import ImageEnhance
from random import randrange

Image.preinit()
Image._initialized = 2

_logger = logging.getLogger(__name__)

from odoo.tools import pycompat
from odoo.tools import image as toolsImage

def image_get_resized_images(base64_source, return_big=False, return_medium=True, return_small=True,
    big_name='image', medium_name='image_medium', small_name='image_small',
    avoid_resize_big=True, avoid_resize_medium=False, avoid_resize_small=False):
    """ Standard tool function that returns a dictionary containing the
        big, medium and small versions of the source image. This function
        is meant to be used for the methods of functional fields for
        models using images.

        Default parameters are given to be used for the getter of functional
        image fields,  for example with res.users or res.partner. It returns
        only image_medium and image_small values, to update those fields.

        :param base64_source: base64-encoded version of the source
            image; if False, all returnes values will be False
        :param return_{..}: if set, computes and return the related resizing
            of the image
        :param {..}_name: key of the resized image in the return dictionary;
            'image', 'image_medium' and 'image_small' by default.
        :param avoid_resize_[..]: see avoid_if_small parameter
        :return return_dict: dictionary with resized images, depending on
            previous parameters.
    """
    _logger.info("\n**** EMIPRO EPT *** image_get_resized_images ****")
    return_dict = dict()
    if isinstance(base64_source, pycompat.text_type):
        base64_source = base64_source.encode('ascii')
    if return_big:
        return_dict[big_name] = toolsImage.image_resize_image_big(base64_source,size=(1024, 1024), avoid_if_small=avoid_resize_big)
    if return_medium:
        return_dict[medium_name] = toolsImage.image_resize_image_medium(base64_source,size=(600, 600), avoid_if_small=avoid_resize_medium)
    if return_small:
        return_dict[small_name] = toolsImage.image_resize_image_small(base64_source,size=(150, 150), avoid_if_small=avoid_resize_small)
    return return_dict

toolsImage.image_get_resized_images = image_get_resized_images
tools.image_get_resized_images = image_get_resized_images

