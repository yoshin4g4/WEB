# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from datetime import datetime, timedelta

class stock_production_lot(models.Model):
    _inherit = 'stock.production.lot'

    barcode = fields.Char('Barcode')
    replace_product_public_price = fields.Boolean('Replace public price of product')
    public_price = fields.Float('Sale price')

    @api.model
    def create(self, vals):
        lot = super(stock_production_lot, self).create(vals)
        if not lot.barcode:
            format_code = "%s%s%s" % ('888', lot.id, datetime.now().strftime("%d%m%y%H%M"))
            code = self.env['barcode.nomenclature'].sanitize_ean(format_code)
            lot.write({'barcode': code})
        return lot

    @api.multi
    def update_ean(self, vals):
        for lot in self:
            format_code = "%s%s%s" % ('888', lot.id, datetime.now().strftime("%d%m%y%H%M"))
            code = self.env['barcode.nomenclature'].sanitize_ean(format_code)
            lot.write({'barcode': code})
        return True
