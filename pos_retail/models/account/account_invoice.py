# -*- coding: utf-8 -*-
from odoo import api, fields, models
import logging

_logger = logging.getLogger(__name__)


class account_invoice(models.Model):
    _inherit = 'account.invoice'

    @api.model
    def pos_validate_invoice(self, invoice_id):
        invoice = self.browse(invoice_id)
        return invoice.action_invoice_open()

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
    def send_email_invoice(self, order):
        # try:
        #     pdf = self.env.ref('account.account_invoices').sudo().render_qweb_pdf([self.id])[0]
        # except IndexError:
        #     pdf = False
        self.ensure_one()
        template = self.env.ref('account.email_template_edi_invoice', False)
        ctx = dict(
            default_model='account.invoice',
            default_res_id=self.id,
            default_use_template=bool(template),
            default_template_id=template and template.id or False,
            default_composition_mode='comment',
            mark_invoice_as_sent=True,
            custom_layout="account.mail_template_data_notification_email_account_invoice",
            force_email=True
        )
        mail = self.env['mail.compose.message'].with_context(ctx).create({
            'email_from': order.email
        })
        values = mail.onchange_template_id(template.id, 'comment', 'account.invoice', self.id)
        mail.write(values.get('value'))
        try:
            mail.write(values.get('value'))
            mail.send_mail()
        except:
            pass
        return True

    @api.model
    def pos_register_amount(self, invoice_id, pay_amount):
        invoice = self.env['account.invoice'].browse(invoice_id)
        if invoice.residual > 0:
            return invoice.pay_and_reconcile(invoice.journal_id, pay_amount=pay_amount)
        else:
            return False

    @api.multi
    def write(self, vals):
        res = super(account_invoice, self).write(vals)
        for inv in self:
            inv.sync()
        return res

    @api.multi
    def unlink(self):
        for record in self:
            data = record.get_data()
            self.env['pos.cache.database'].remove_record(data)
        return super(account_invoice, self).unlink()


class account_invoice_line(models.Model):
    _inherit = "account.invoice.line"

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
        line = super(account_invoice_line, self).create(vals)
        line.sync()
        return line

    @api.multi
    def write(self, vals):
        res = super(account_invoice_line, self).write(vals)
        for line in self:
            line.sync()
        return res

    @api.multi
    def unlink(self):
        for record in self:
            data = record.get_data()
            self.env['pos.cache.database'].remove_record(data)
        return super(account_invoice_line, self).unlink()

