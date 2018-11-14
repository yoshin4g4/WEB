# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.exceptions import UserError

class pos_combo_item(models.Model):
    _name = "pos.combo.item"
    _rec_name = "product_combo_id"

    product_id = fields.Many2one('product.product', 'Product', required=True, domain=[('available_in_pos', '=', True)])
    product_combo_id = fields.Many2one('product.template', 'Combo', required=True,
                                       domain=[('available_in_pos', '=', True)])
    uom_id = fields.Many2one('product.uom', 'Unit of measure')
    quantity = fields.Float('Quantity', required=1, default=1)
    default = fields.Boolean('Default selected', default=1)
    tracking = fields.Boolean('Tracking lot')

    @api.model
    def create(self, vals):
        if vals.get('quantity', 0) < 0:
            raise UserError('Quantity can not smaller 0')
        return super(pos_combo_item, self).create(vals)

    @api.multi
    def write(self, vals):
        if vals.get('quantity', 0) < 0:
            raise UserError('Quantity can not smaller 0')
        return super(pos_combo_item, self).write(vals)
