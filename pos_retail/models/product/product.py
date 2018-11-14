# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
import logging
from odoo.exceptions import UserError
import ast

_logger = logging.getLogger(__name__)

class product_template(models.Model):
    _inherit = 'product.template'

    pos_combo_item_ids = fields.One2many('pos.combo.item', 'product_combo_id', string='Combo items')
    is_combo = fields.Boolean('Is combo')
    combo_limit = fields.Integer('Combo item limit', help='Limit combo items can allow cashier add / combo')
    is_credit = fields.Boolean('Is credit', default=False)

    multi_category = fields.Boolean('Multi category')
    pos_categ_ids = fields.Many2many('pos.category', string='POS multi category')

    multi_uom = fields.Boolean('Multi unit of measure')
    price_uom_ids = fields.One2many('product.uom.price', 'product_tmpl_id', string='Units of measure')

    multi_variant = fields.Boolean('Multi variant')
    pos_variant_ids = fields.One2many('product.variant', 'product_tmpl_id', string='Product variants')

    cross_selling = fields.Boolean('Cross selling')
    cross_ids = fields.One2many('product.cross', 'product_tmpl_id', 'Cross selling')

    supplier_barcode = fields.Char(
        'Supplier Barcode', copy=False,
        help="Barcode of product from supplier.")

    barcode_ids = fields.One2many('product.barcode', 'product_tmpl_id', string='Barcodes')
    manufacturing_out_of_stock = fields.Boolean('Auto manufacturing',
                                                help='Auto create Manufacturing Order when qty on hand of product smaller than minimum quantity config')
    manufacturing_state = fields.Selection([
        ('manual', 'Manual'),
        ('auto', 'Auto Process')], string='Manufacturing State', default='auto')

    pos_min_qty = fields.Float('Minimum quantity POS', help='This is Minimum quantity made to manufacturing order')
    pos_manufacturing_quantity = fields.Float('Manufacturing quantity', help='This is quantity will manufacturing')
    bom_id = fields.Many2one('mrp.bom', string='Bill of material')

    suggestion_sale = fields.Boolean('Suggestion sale')
    suggestion_ids = fields.One2many('product.suggestion', 'product_tmpl_id', 'Suggests sale')
    pack_ids = fields.One2many('product.quantity.pack', 'product_tmpl_id', 'Quantities Pack')

    @api.multi
    def write(self, vals):
        res = super(product_template, self).write(vals)
        # if bomb product tmpl id not the same self product
        # raise error
        if vals.get('bom_id', False):
            for template in self:
                bom = self.env['mrp.bom'].browse(vals.get('bom_id'))
                if bom.product_tmpl_id.id != template.id:
                    raise UserError(_('Bom wrong, please select bom of this product'))
        for product_temp in self:
            products = self.env['product.product'].search([('product_tmpl_id', '=', product_temp.id)])
            for product in products:
                if product.sale_ok and product.available_in_pos:
                    product.sync()
        return res

    # if bomb product tmpl id not the same self product
    # raise error
    @api.model
    def create(self, vals):
        template = super(product_template, self).create(vals)
        if vals.get('bom_id', False):
            bom = self.env['mrp.bom'].browse(vals.get('bom_id'))
            if bom.product_tmpl_id.id != template.id:
                raise UserError(_('Bom wrong, please select bom of this product'))
        return template

    @api.multi
    def unlink(self):
        for product_temp in self:
            products = self.env['product.product'].search([('product_tmpl_id', '=', product_temp.id)])
            for product in products:
                data = product.get_data()
                self.env['pos.cache.database'].remove_record(data)
        return super(product_template, self).unlink()


class product_product(models.Model):
    _inherit = 'product.product'

    @api.multi
    def write(self, vals):
        res = super(product_product, self).write(vals)
        for product in self:
            if product and product.id != None and product.sale_ok and product.available_in_pos:
                product.sync()
            if product.available_in_pos == False:
                data = product.get_data()
                self.env['pos.cache.database'].remove_record(data)
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

    @api.model
    def create(self, vals):
        product = super(product_product, self).create(vals)
        if product.sale_ok and product.available_in_pos:
            product.sync()
        return product

    @api.multi
    def unlink(self):
        for product in self:
            data = product.get_data()
            self.env['pos.cache.database'].remove_record(data)
        return super(product_product, self).unlink()
