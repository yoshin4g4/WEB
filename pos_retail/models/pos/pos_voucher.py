# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from datetime import datetime, timedelta
import logging

_logger = logging.getLogger(__name__)

class pos_voucher(models.Model):
    _name = "pos.voucher"
    _rec_name = 'code'
    _order = 'end_date'

    customer_id = fields.Many2one('res.partner', string='Customer', domain=[('customer', '=', True)])
    code = fields.Char('Code')
    start_date = fields.Datetime('Start date', required=1)
    end_date = fields.Datetime('End date', required=1)
    state = fields.Selection([
        ('active', 'Active'),
        ('used', 'Used'),
        ('removed', 'Removed')
    ], string='State', default='active')
    value = fields.Float('Value of voucher')
    apply_type = fields.Selection([
        ('fixed_amount', 'Fixed amount'),
        ('percent', 'Percent (%)'),
    ], string='Apply type', default='fixed_amount')
    method = fields.Selection([
        ('general', 'General'),
        ('special_customer', 'Special Customer'),
    ], string='Method', default='general')
    use_date = fields.Datetime('Use date')

    @api.model
    def create(self, vals):
        voucher = super(pos_voucher, self).create(vals)
        if not voucher.code:
            format_code = "%s%s%s" % ('999', voucher.id, datetime.now().strftime("%d%m%y%H%M"))
            code = self.env['barcode.nomenclature'].sanitize_ean(format_code)
            voucher.write({'code': code})
        return voucher

    @api.multi
    def remove_voucher(self):
        return self.write({
            'state': 'removed'
        })

    @api.model
    def create_voucher(self, vals):
        _logger.info('{create_voucher}: %s' % vals)
        datas_response = []
        today = datetime.today()
        products = self.env['product.product'].search([('name', '=', 'Voucher service')])
        for i in range(0, vals['total_available']):
            customer_id = None
            if vals.get('special_customer', None) == 'special_customer':
                customer_id = vals.get('customer_id', None)
            voucher_vals = {
                'apply_type': vals.get('apply_type', ''),
                'value': vals.get('value', 0),
                'method': vals.get('method'),
                'customer_id': customer_id,
                'start_date': fields.Datetime.now(),
                'end_date': today + timedelta(days=vals['period_days'])
            }
            if products:
                voucher_vals.update({'product_id': products[0].id})
            voucher = self.create(voucher_vals)
            format_code = "%s%s%s" % ('999', voucher.id, datetime.now().strftime("%d%m%y%H%M"))
            code = self.env['barcode.nomenclature'].sanitize_ean(format_code)
            voucher.write({'code': code})
            if voucher.method == 'special_customer':
                method = 'Special Customer'
            else:
                method = 'General'
            if voucher.apply_type == 'fixed_amount':
                apply_type = 'Fixed Amount'
            else:
                apply_type = 'Percent (%)'
            datas_response.append({
                'code': code,
                'partner_name': voucher.customer_id.name if voucher.customer_id else '',
                'method': method,
                'apply_type': apply_type,
                'value': voucher.value,
                'end_date': voucher.end_date,
                'id': voucher.id,
            })
        return datas_response

    @api.model
    def get_voucher_by_code(self, code):
        vouchers = self.env['pos.voucher'].search(
            [('code', '=', code), ('end_date', '>=', fields.Datetime.now()), ('state', '=', 'active')])
        if not vouchers:
            return -1
        else:
            return vouchers.read([])[0]
