# -*- coding: utf-8 -*-
from odoo import api, fields, models, tools, _

class res_partner_credit(models.Model):
    _name = "res.partner.credit"

    name = fields.Char('Name', required=1)
    amount = fields.Float('Amount', required=1)
    type = fields.Selection([
        ('plus', 'Plus Amount'),
        ('redeem', 'Redeem Amount')
    ], required=1)
    partner_id = fields.Many2one('res.partner', 'Customer', domain=[('customer', '=', 1)], required=1)
    pos_order_id = fields.Many2one('pos.order', 'POS order')
    create_date = fields.Datetime('Created date', readonly=1)
    account_bank_statement_line_id = fields.Many2one('account.bank.statement.line', 'Statement line', readonly=1)
    active = fields.Boolean('Active', default=1)

    @api.model
    def create(self, vals):
        record = super(res_partner_credit, self).create(vals)
        record.partner_id.sync()
        return record

    @api.multi
    def write(self, vals):
        res = super(res_partner_credit, self).write(vals)
        for credit in self:
            credit.partner_id.sync()
        return res

    @api.multi
    def unlink(self):
        partners = []
        for credit in self:
            partners.append(credit.partner_id)
        res = super(res_partner_credit, self).unlink()
        for partner in partners:
            partner.sync()
        return res
