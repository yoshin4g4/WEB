# -*- coding: utf-8 -*-

from odoo import models, fields, api, _

class account_invoice_refund(models.TransientModel):
    _inherit = "account.invoice.refund"

    add_credit = fields.Boolean('Add credit')

    @api.multi
    def compute_refund(self, model='refund'):
        results = super(account_invoice_refund, self).compute_refund(model)
        if results.get('domain', []) and results.get('domain', [])[1]:
            invoice_id = results['domain'][1][2]
            for form in self:
                if form.add_credit:
                    invoice = self.env['account.invoice'].browse(invoice_id)
                    self.env['account.invoice'].browse(invoice_id).write({
                        'add_credit': True
                    })
                    invoice.partner_id.sync()
        return results

