# -*- coding: utf-8 -*-
from odoo import api, fields, models
import logging
import ast
_logger = logging.getLogger(__name__)

class product_pricelist(models.Model):

    _inherit = "product.pricelist"

    def get_data(self):
        cache_obj = self.env['pos.cache.database']
        fields_sale_load = cache_obj.get_fields_by_model(self._inherit)
        data = self.read(fields_sale_load)[0]
        data['model'] = self._inherit
        return data

    @api.model
    def sync(self):
        data = self.get_data()
        self.env['pos.cache.database'].sync_to_pos(data)
        return True

    @api.model
    def create(self, vals):
        res = super(product_pricelist, self).create(vals)
        res.sync()
        return res

    @api.multi
    def write(self, vals):
        res = super(product_pricelist, self).write(vals)
        for pricelist in self:
            if pricelist and pricelist.id:
                pricelist.sync()
        return res

    @api.multi
    def unlink(self):
        for record in self:
            data = record.get_data()
            self.env['pos.cache.database'].remove_record(data)
        return super(product_pricelist, self).unlink()

class product_pricelist_item(models.Model):

    _inherit = "product.pricelist.item"

    @api.model
    def create(self, vals):
        item = super(product_pricelist_item, self).create(vals)
        item.sync()
        return item

    @api.multi
    def write(self, vals):
        res = super(product_pricelist_item, self).write(vals)
        for item in self:
            if item and item.id != None:
                item.sync()
        return res

    def get_data(self):
        cache_obj = self.env['pos.cache.database']
        fields_sale_load = cache_obj.get_fields_by_model(self._inherit)
        data = self.read(fields_sale_load)[0]
        data['model'] = self._inherit
        return data

    @api.model
    def sync(self):
        data = self.get_data()
        self.env['pos.cache.database'].sync_to_pos(data)
        return True

    @api.multi
    def unlink(self):
        for record in self:
            data = record.get_data()
            self.env['pos.cache.database'].remove_record(data)
        return super(product_pricelist_item, self).unlink()