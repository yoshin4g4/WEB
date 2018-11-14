# -*- coding: utf-8 -*-
from odoo import api, fields, models
import logging

_logger = logging.getLogger(__name__)


class account_move_line(models.Model):
    _inherit = "account.move.line"

    @api.one
    def _prepare_analytic_line(self):
        analytic_line_value = super(account_move_line, self)._prepare_analytic_line()
        if analytic_line_value and analytic_line_value[0] and not analytic_line_value[0].get('name', None):
            analytic_line_value[0]['name'] = self.ref or self.move_id.ref
        return analytic_line_value[0]
