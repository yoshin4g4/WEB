# -*- coding: utf-8 -*-
from odoo import api, fields, models
import logging

_logger = logging.getLogger(__name__)

class account_payment(models.Model):

    _inherit = "account.payment"

    @api.model
    def create(self, vals):
        payment = super(account_payment, self).create(vals)
        _logger.info(vals)
        return payment