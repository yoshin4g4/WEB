from odoo import tools
from odoo import api, fields, models


class pos_tracking_client(models.Model):
    _name = "pos.tracking.client"
    _auto = False

    name = fields.Char()
    user_id = fields.Many2one('res.users', 'Client', readonly=1)
    bus_id = fields.Many2one('pos.bus', 'Bus', readonly=1)
    number = fields.Integer('Number', readonly=1)
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
    ], string='Action', readonly=1)


    @api.model_cr
    def init(self):
        tools.drop_view_if_exists(self.env.cr, self._table)
        self.env.cr.execute("""CREATE or REPLACE VIEW %s as (
            SELECT
                min(ru.id) AS "id",
                ru.login as name,
                ru.id as user_id,
                pbl.bus_id as bus_id,
                pbl."action" as action,
                count(pbl."action") as number
                FROM
                "pos_bus_log" AS pbl,
                "res_users" AS ru
            WHERE
                pbl.user_id=ru.id
                and pbl.bus_id is not Null
            GROUP BY
                pbl.action,
                ru.login,
                ru.id,
                pbl.bus_id
            
            )""" % (self._table))
