# -*- coding: utf-8 -*-
from odoo import api, fields, models, _

class product_suggestion(models.Model):

    _name = "product.suggestion"

    product_tmpl_id = fields.Many2one('product.template', 'Product', required=1)
    product_id = fields.Many2one('product.product', 'Product', required=1, domain=[('available_in_pos', '=', True)])
    list_price = fields.Float('List price', required=1)
    quantity = fields.Float('Quantity', default=1)

    @api.onchange('product_id')
    def on_change_product_id(self):
        if self.product_id:
            self.list_price = self.product_id.list_price