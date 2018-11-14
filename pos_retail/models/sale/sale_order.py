# -*- coding: utf-8 -*-
from odoo import models, fields, _, api
import logging
import odoo
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class sale_order(models.Model):
    _inherit = "sale.order"

    signature = fields.Binary('Signature', readonly=1)
    book_order = fields.Boolean('Book order')
    delivery_date = fields.Datetime('Delivery date')
    delivered_date = fields.Datetime('Delivered date')
    delivery_address = fields.Char('Delivery address')
    delivery_phone = fields.Char('Delivery phone', help='Phone of customer for delivery')
    payment_partial_amount = fields.Float('Payment partial amount')
    payment_partial_journal_id = fields.Many2one('account.journal', string='Payment journal')
    insert = fields.Boolean('Insert', default=0)

    @api.multi
    def action_validate_picking(self):
        picking_name = ''
        for sale in self:
            for picking in sale.picking_ids:
                if picking.state in ['assigned', 'waiting', 'confirmed']:
                    for move_line in picking.move_line_ids:
                        move_line.write({'qty_done': move_line.product_uom_qty})
                    for move_line in picking.move_lines:
                        move_line.write({'quantity_done': move_line.product_uom_qty})
                    picking.button_validate()
                    picking_name = picking.name
        return picking_name

    @api.model
    def pos_create_sale_order(self, vals, sale_order_auto_confirm, sale_order_auto_invoice, sale_order_auto_delivery):
        _logger.info('->> {pos_create_sale_order} starting')
        version_info = odoo.release.version_info
        for line in vals['order_line']:
            line = line[2]
            product_id = line.get('product_id')
            product = self.env['product.product'].browse(product_id)
            if product.tracking != 'none':
                if not line.get('pack_lot_ids', None):
                    raise UserError(u'Missing lot name (number) of %s' % product.name)
                else:
                    for lot_name in line.get('pack_lot_ids'):
                        lots = self.env['stock.production.lot'].sudo().search([('name', '=', lot_name), ('product_id', '=', product_id)])
                        if not lots:
                            raise UserError(u'Wrong or have not this lot name (number) of %s' % product.name)
                        else:
                            lot_id = lots[0].id
                            line['lot_id'] = lot_id
                del line['pack_lot_ids']
        sale = self.create(vals)
        sale.order_line._compute_tax_id()
        if sale_order_auto_confirm:
            sale.action_confirm()
            sale.action_done()
            _logger.info('->> {pos_create_sale_order} confirmed')
        if sale_order_auto_delivery and sale.picking_ids:
            _logger.info('->> {pos_create_sale_order} delivered start')
            for picking in sale.picking_ids:
                if version_info and version_info[0] == 11:
                    for move_line in picking.move_line_ids:
                        move_line.write({'qty_done': move_line.product_uom_qty})
                    for move_line in picking.move_lines:
                        move_line.write({'quantity_done': move_line.product_uom_qty})
                    picking.button_validate()
                # only support v11
            _logger.info('->> {pos_create_sale_order} delivered')
        _logger.info('->> {pos_create_sale_order} end')
        if sale_order_auto_confirm and sale_order_auto_invoice:
            sale.action_invoice_create()
            for invoice in sale.invoice_ids:
                invoice.action_invoice_open()
                invoice.invoice_validate()
            _logger.info('->> {pos_create_sale_order} invoiced')
        return {'name': sale.name, 'id': sale.id}

    @api.model
    def booking_order(self, vals):
        _logger.info('{booking_order} begin')
        so = self.create(vals)
        _logger.info('{booking_order} end')
        return {'name': so.name, 'id': so.id}

    @api.model
    def create(self, vals):
        sale = super(sale_order, self).create(vals)
        sale.sync()
        if not sale.delivery_address:
            if sale.partner_shipping_id:
                sale.delivery_address = sale.partner_shipping_id.contact_address
            else:
                sale.delivery_address = sale.partner_id.contact_address
        for line in sale.order_line:
            line.sync()
        return sale

    @api.multi
    def write(self, vals):
        res = super(sale_order, self).write(vals)
        for sale in self:
            if not sale.delivery_address:
                if sale.partner_shipping_id:
                    sale.delivery_address = sale.partner_shipping_id.contact_address
                else:
                    sale.delivery_address = sale.partner_id.contact_address
            sale.sync()
            for line in sale.order_line:
                line.sync()
        return res

    @api.multi
    def unlink(self):
        for record in self:
            data = record.get_data()
            self.env['pos.cache.database'].remove_record(data)
        return super(sale_order, self).unlink()

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


class sale_order_line(models.Model):
    _inherit = "sale.order.line"
    _order ='parent_id'

    insert = fields.Boolean('Insert', default=0)
    parent_id = fields.Many2one('sale.order.line', 'Parent')
    lot_id = fields.Many2one('stock.production.lot', 'Lot')

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
        return super(sale_order_line, self).unlink()

    @api.model
    def create(self, vals):
        line = super(sale_order_line, self).create(vals)
        if line.insert:
            _logger.info('Insert is correct')
            line.order_id.write({'insert': True})
        return line

    @api.multi
    def insert_line(self):
        self.ensure_one()
        vals = {
            'order_id': self.order_id.id,
            'line_id': self.id,
        }
        wiz = self.env['sale.order.line.insert'].create(vals)
        return {
            'name': "Insert line",
            'view_mode': 'form',
            'view_id': False,
            'view_type': 'form',
            'res_model': 'sale.order.line.insert',
            'res_id': wiz.id,
            'type': 'ir.actions.act_window',
            'nodestroy': True,
            'target': 'new',
        }
