# -*- coding: utf-8 -*-
from odoo import api, fields, models, tools, _
from odoo.tools import float_is_zero
import logging
from odoo.exceptions import UserError
from datetime import datetime
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT
import json

_logger = logging.getLogger(__name__)


class mrp_production(models.Model):
    _inherit = "mrp.production"

    pos_id = fields.Many2one('pos.order', 'POS order', readonly=1)
    pos_user_id = fields.Many2one('res.users', 'POS User', readonly=1)