# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
# from twilio.rest import Client


class pos_sms(models.Model):
    _name = "pos.sms.server"

    _rec_name = 'your_number'

    your_number = fields.Char('Twilio number', required=1)
    account = fields.Char('Account', required=1)
    token = fields.Char('Token', required=1)


class pos_sms_template(models.Model):
    _name = "pos.sms.template"

    name = fields.Char('Name')
    body = fields.Html('Body')
    model_id = fields.Many2one('ir.model', 'Applies to', help="The type of document this template can be used with")
    server_id = fields.Many2one('pos.sms.server', 'Server', required=1)

    @api.model
    def send_sms(self, order_id, phone=None):
        # MailTemplate = self.env['mail.template']
        # body = MailTemplate.render_template(self.body, self.model_id.model, order_id)
        # if phone:
        #     try:
        #         client = Client(self.server_id.account, self.server_id.token)
        #         send_to = self.env['phone.validation.mixin'].phone_format(phone, self.env.user.country_id)
        #         send_from = self.server_id.your_number
        #         client.messages.create(to=send_to, from_=send_from, body=body)
        #     except:
        #         pass
        return True

class pos_sms_message(models.Model):
    _name = "pos.sms.message"
    _rec_name = 'phone'

    partner_id = fields.Many2one('res.partner', 'Partner')
    phone = fields.Char('Send to', required=1)
    body = fields.Char('Body', required=1)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('done', 'Done'),
        ('error', 'Error')
    ], string='State', default='draft', required=1)
    server_id = fields.Many2one('pos.sms.server', 'Server', required=1)
