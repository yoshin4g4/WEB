# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models


class report_pos_order(models.Model):
    _inherit = 'report.pos.order'

    margin = fields.Float('Margin')

    def _select(self):
        return super(report_pos_order, self)._select() + ", SUM(l.margin) AS margin"
