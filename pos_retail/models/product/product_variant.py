# -*- coding: utf-8 -*-
from odoo import api, fields, models, _


class product_variant(models.Model):
    _name = "product.variant"
    _rec_name = "product_tmpl_id"

    product_tmpl_id = fields.Many2one('product.template', 'Product', required=1,
                                      domain=[('available_in_pos', '=', True)])
    product_id = fields.Many2one('product.product', 'Product stock',
                                 help='If choice, will made stock move, link to inventory and stock on hand of this product')
    uom_id = fields.Many2one('product.uom', 'Unit')
    quantity = fields.Float('Qty')
    value_id = fields.Many2one('product.attribute.value', string='Value', required=1)
    price_extra = fields.Float('Price extra', help='Price extra will include and base on product template', required=1)
