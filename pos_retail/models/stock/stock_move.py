# -*- coding: utf-8 -*-
from odoo import fields, api, models
import logging

_logger = logging.getLogger(__name__)


class stock_move(models.Model):
    _inherit = "stock.move"

    @api.model
    def create(self, vals):
        """
        if move create from pos order line
        and pol have uom ID and pol uom ID difference with current move
        we'll re-update product_uom of move
        FOR linked stock on hand of product
        """
        move = super(stock_move, self).create(vals)
        order_lines = self.env['pos.order.line'].search([
            ('name', '=', move.name),
            ('product_id', '=', move.product_id.id),
            ('qty', '=', move.product_uom_qty)
        ])
        for line in order_lines:
            if line.uom_id and line.uom_id != move.product_uom:
                move.write({
                    'product_uom': line.uom_id.id
                })
        return move

    @api.multi
    def write(self, vals):
        """
        Method: rebuild stock on hand for product
        """
        res = super(stock_move, self).write(vals)
        sessions = self.env['pos.session'].sudo().search([
            ('state', '=', 'opened'),
        ])
        if vals.get('state', False) == 'done':
            for move in self:
                if move.product_id:
                    data = move.product_id.get_data()
                    for session in sessions:
                        if session.config_id.stock_location_id:
                            data['model'] = 'product.product'
                            product = move.product_id.with_context(location=session.config_id.stock_location_id.id)
                            qty_available = product.qty_available
                            data['qty_available'] = qty_available
                            self.env['pos.cache.database'].sync_to_pos(data)
        return res
