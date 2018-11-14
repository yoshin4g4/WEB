# -*- coding: utf-8 -*-
from odoo import api, models, fields, registry
import json
import base64

class pos_bus(models.Model):
    _name = "pos.bus"

    name = fields.Char('Location Name', required=1)
    user_id = fields.Many2one('res.users', string='Sale admin')
    log_ids = fields.One2many('pos.bus.log', 'bus_id', string='Logs')

class pos_bus_log(models.Model):
    _name = "pos.bus.log"

    user_id = fields.Many2one('res.users', 'Client', required=1)
    bus_id = fields.Many2one('pos.bus', 'Bus', required=1)
    action = fields.Selection([
        ('selected_order', 'Change order'),
        ('new_order', 'Add order'),
        ('unlink_order', 'Remove order'),
        ('line_removing', 'Remove line'),
        ('set_client', 'Set customer'),
        ('trigger_update_line', 'Update line'),
        ('change_pricelist', 'Add pricelist'),
        ('sync_sequence_number', 'Sync sequence order'),
        ('lock_order', 'Lock order'),
        ('unlock_order', 'Unlock order'),
        ('set_line_note', 'Set note'),
        ('set_state', 'Set state'),
        ('order_transfer_new_table', 'Transfer to new table'),
        ('set_customer_count', 'Set guest'),
        ('request_printer', 'Request printer'),
        ('set_note', 'Set note'),
        ('paid_order', 'Paid order')
    ], string='Action', required=1)
    order_uid = fields.Char('Order UID', required=1)
    log = fields.Binary('Log')
    state = fields.Selection([
        ('still', 'Sill on POS'),
        ('done', 'Done'),
    ], default='still', string='State')

    @api.model
    def api_get_data(self, bus_id, user_id=None):
        datas = self.search([
            ('bus_id', '=', bus_id),
            ('state', '=', 'still')
        ])
        values = []
        for data in datas:
            values.append(json.loads(base64.decodestring(data.log).decode('utf-8')))
        return values
