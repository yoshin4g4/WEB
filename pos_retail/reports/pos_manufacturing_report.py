# -*- coding: utf-8 -*-
from odoo import api, fields, models, tools

class pos_manufacturing_report(models.Model):
    _name = "pos.manufacturing.report"
    _auto = False
    _order = 'date desc'

    move_date = fields.Datetime(string='Move date', readonly=1)
    order_id = fields.Many2one('pos.order', string='Order', readonly=1)
    mrp_id = fields.Many2one('mrp.production', string='Manufacturing order', readonly=1)
    move_id = fields.Many2one('stock.move', 'Move', readonly=1)
    product_id = fields.Many2one('product.product', string='Product', readonly=1)
    pos_user_id = fields.Many2one('res.users', string='Salesperson', readonly=1)
    product_uom = fields.Many2one('product.uom', 'Unit of measure', readonly=1)
    product_qty = fields.Integer(string='Product Quantity', readonly=1)
    location_src_id = fields.Many2one(
        'stock.location', 'Raw Materials Location',
        readonly=1)
    location_dest_id = fields.Many2one(
        'stock.location', 'Finished Products Location',
        readonly=1,
        help="Location where the system will stock the finished products.")


    def _query(self):
        return """
            select  sm.id AS id,
                    sm.date as move_date,
                    po.id as order_id, 
                    mp.id as mrp_id,
                    sm.id as move_id, 
                    pp.id as product_id, 
                    mp.pos_user_id as pos_user_id,
                    pu.id as product_uom, 
                    sm.product_qty as product_qty,
                    mp.location_src_id as location_src_id,
                    mp.location_dest_id as location_dest_id
                from
                    stock_move as sm,
                    mrp_production as mp,
                    pos_order as po,
                    product_product as pp,
                    product_template as pt,
                    product_uom as pu
                WHERE
                    pu.id=sm.product_uom
                    and pt.id=pp.product_tmpl_id
                    and po.id=mp.pos_id
                    and sm.raw_material_production_id=mp.id
                    and sm.product_id=pp.id
                    and mp.pos_id is not Null
                order by po.id
        """


    @api.model_cr
    def init(self):
        tools.drop_view_if_exists(self._cr, self._table)
        self._cr.execute("""
                    CREATE OR REPLACE VIEW %s AS (
                        %s
                    )
                """ % (self._table, self._query()))
