# -*- coding: utf-8 -*
from odoo.http import request
from odoo.addons.bus.controllers.main import BusController
from odoo.addons.web.controllers.main import DataSet
from odoo import api, http, SUPERUSER_ID
from odoo.addons.web.controllers.main import ensure_db, Home, Session, WebClient
from odoo.addons.point_of_sale.controllers.main import PosController
import json
import logging
import base64
import werkzeug.utils

_logger = logging.getLogger(__name__)

class dataset(DataSet):
    @http.route('/web/dataset/search_read', type='json', auth="user")
    def search_read(self, model, fields=False, offset=0, limit=False, domain=None, sort=None):
        datas = super(dataset, self).search_read(model, fields=fields, offset=offset, limit=limit, domain=domain,
                                                 sort=sort)
        context = request.env.context
        if context.get('retail', False):
            request.env['pos.cache.database'].insert_data(datas['records'], model, True)
        return datas

class pos_controller(PosController):

    @http.route('/pos/web', type='http', auth='user')
    def pos_web(self, debug=False, **k):
        _logger.info('->> begin pos_web')
        session_info = request.env['ir.http'].session_info()
        session_info['caches'] = []
        server_version_info = session_info['server_version_info'][0]
        cache_model = request.env['pos.cache.database'].sudo()
        bug_log_model = request.env['pos.bus.log'].sudo()
        pos_sessions = None
        if server_version_info == 10:
            pos_sessions = request.env['pos.session'].search([
                ('state', '=', 'opened'),
                ('user_id', '=', request.session.uid),
                ('name', 'not like', '(RESCUE FOR')])
        if server_version_info == 11:
            pos_sessions = request.env['pos.session'].search([
                ('state', '=', 'opened'),
                ('user_id', '=', request.session.uid),
                ('rescue', '=', False)])
        if not pos_sessions:  # auto directly login odoo to pos
            if request.env.user.pos_config_id:
                request.env.user.pos_config_id.current_session_id = request.env['pos.session'].sudo().create({
                    'user_id': request.env.user.id,
                    'config_id': request.env.user.pos_config_id.id,
                })
                pos_sessions = request.env.user.pos_config_id.current_session_id
                pos_sessions.action_pos_session_open()
        if not pos_sessions:
            return werkzeug.utils.redirect('/web#action=point_of_sale.action_client_pos_menu')
        pos_session = pos_sessions[0]
        pos_session.login()
        bus_logs = []
        pos_config = pos_session.config_id
        if pos_config.bus_id:
            bus_logs = bug_log_model.api_get_data(pos_config.bus_id.id)
        session_info['stock_datas'] = cache_model.get_on_hand_by_stock_location(
            pos_session.config_id.stock_location_id.id)
        session_info['bus_logs'] = bus_logs
        session_info['model_ids'] = {
            'product.pricelist': {},
            'product.pricelist.item': {},
            'product.product': {},
            'res.partner': {},
            'account.invoice': {},
            'account.invoice.line': {},
            'pos.order': {},
            'pos.order.line': {},
            'sale.order': {},
            'sale.order.line': {},
        }
        session_info['currency_id'] = request.env.user.company_id.currency_id.id
        model_list = {
            'product.pricelist': 'product_pricelist',
            'product.pricelist.item': 'product_pricelist_item',
            'product.product': 'product_product',
            'res.partner': 'res_partner',
            'account.invoice': 'account_invoice',
            'account.invoice.line': 'account_invoice_line',
            'pos.order': 'pos_order',
            'pos.order.line': 'pos_order_line',
            'sale.order': 'sale_order',
            'sale.order.line': 'sale_order_line',
        }
        for object, table in model_list.items():
            request.env.cr.execute("select min(id) from %s" % table)
            min_ids = request.env.cr.fetchall()
            session_info['model_ids'][object]['min_id'] = min_ids[0][0] if min_ids and min_ids[0] else 1
            request.env.cr.commit()
            request.env.cr.execute("select max(id) from %s" % table)
            max_ids = request.env.cr.fetchall()
            session_info['model_ids'][object]['max_id'] = max_ids[0][0] if max_ids and max_ids[0] else 1
        context = {
            'session_info': json.dumps(session_info)
        }
        _logger.info('->> end pos_web')
        return request.render('point_of_sale.index', qcontext=context)

class web_login(Home):
    @http.route()
    def web_login(self, *args, **kw):
        ensure_db()
        response = super(web_login, self).web_login(*args, **kw)
        if request.session.uid:
            user = request.env['res.users'].browse(request.session.uid)
            pos_config = user.pos_config_id
            if pos_config:
                return http.local_redirect('/pos/web/')
        return response

class pos_bus(BusController):
    def _poll(self, dbname, channels, last, options):
        channels = list(channels)
        channels.append((request.db, 'pos.sync.data', request.uid))
        channels.append((request.db, 'pos.bus', request.uid))
        return super(pos_bus, self)._poll(dbname, channels, last, options)

    @http.route('/pos/update_order/status', type="json", auth="public")
    def bus_update_sale_order(self, status, order_name):
        sales = request.env["sale.order"].sudo().search([('name', '=', order_name)])
        sales.write({'sync_status': status})
        return 1

    @http.route('/pos/sync', type="json", auth="public")
    def send(self, bus_id, messages):
        for message in messages:
            if not message.get('value', None) or not message['value'].get('order_uid', None) or not message[
                'value'].get('action', None):
                continue
            order_uid = message['value'].get('order_uid')
            action = message['value'].get('action')
            user_send_id = message['user_send_id']
            send = 0
            if action in ['paid_order', 'unlink_order']:
                request.env.cr.execute(
                    "UPDATE pos_bus_log SET state='done' WHERE order_uid='%s'" % order_uid)
                request.env.cr.commit()
            log = base64.encodestring(json.dumps(message).encode('utf-8'))
            if action == 'unlink_order':
                request.env['pos.bus.log'].create({
                    'user_id': user_send_id,
                    'action': action,
                    'order_uid': order_uid,
                    'bus_id': bus_id,
                    'state': 'done'
                })
            if action not in ['unlink_order', 'paid_order']:
                request.env['pos.bus.log'].create({
                    'user_id': user_send_id,
                    'action': action,
                    'order_uid': order_uid,
                    'log': log,
                    'bus_id': bus_id,
                    'state': 'still'
                })
            sessions = request.env['pos.session'].sudo().search([
                ('state', '=', 'opened'),
                ('user_id', '!=', user_send_id)
            ])
            for session in sessions:
                if session.config_id.bus_id and session.config_id.bus_id.id == bus_id and user_send_id != session.user_id.id:
                    send += 1
                    request.env['bus.bus'].sendmany(
                        [[(request.env.cr.dbname, 'pos.bus', session.user_id.id), json.dumps(message)]])
        return json.dumps({
            'status': 'OK',
            'code': 200
        })
