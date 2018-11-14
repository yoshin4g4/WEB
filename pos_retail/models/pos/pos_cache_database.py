# -*- coding: utf-8 -*-
from odoo import api, models, fields, registry
import logging
import json
import ast

_logger = logging.getLogger(__name__)

class pos_cache_database(models.Model):
    _name = "pos.cache.database"

    res_id = fields.Char('Id')
    res_model = fields.Char('Model')
    data = fields.Text('Data')

    @api.model
    def load_master_data(self, condition={}):
        database = {}
        domain = []
        for model, load in condition.items():
            if load == True:
                database[model] = []
                domain.append(model)
        caches = self.search_read(
            [('res_model', 'in', tuple(domain))], ['res_id', 'res_model', 'data', 'write_date'])
        if caches:
            for cache in caches:
                vals = json.loads(cache['data'])
                vals['write_date'] = cache['write_date']
                database[cache['res_model']].append(vals)
            return database
        else:
            return False

    @api.model
    def get_datas_updated(self, write_date):
        _logger.info('BEGIN get_datas_update')
        _logger.info(write_date)
        datas = []
        caches = self.search_read(
            [('write_date', '>', write_date)], ['res_id', 'res_model', 'data', 'write_date'])
        for cache in caches:
            val = json.loads(cache['data'])
            val['write_date'] = cache['write_date']
            val['model'] = cache['res_model']
            datas.append(val)
        return datas


    @api.multi
    def get_fields_by_model(self, model_name):
        params = self.env['ir.config_parameter'].sudo().get_param(model_name)
        if not params:
            list_fields = self.env[model_name].fields_get()
            fields_load = []
            for k, v in list_fields.items():
                if v['type'] not in ['one2many', 'binary']:
                    fields_load.append(k)
            return fields_load
        else:
            params = ast.literal_eval(params)
            return params.get('fields', [])

    @api.multi
    def get_domain_by_model(self, model_name):
        params = self.env['ir.config_parameter'].sudo().get_param(model_name)
        if not params:
            return []
        else:
            params = ast.literal_eval(params)
            return params.get('domain', [])

    @api.model
    def insert_data(self, datas, model, first_install=False):
        if first_install:
            for data in datas:
                self.create({
                    'res_id': str(data['id']),
                    'res_model': model,
                    'data': json.dumps(data)
                })
        else:
            for data in datas:
                last_caches = self.search([('res_id', '=', str(data['id'])), ('res_model', '=', model)])
                if last_caches:
                    last_caches.write({
                        'data': json.dumps(data)
                    })
                else:
                    self.create({
                        'res_id': str(data['id']),
                        'res_model': model,
                        'data': json.dumps(data)
                    })
        return True

    def sync_to_pos(self, data):
        if data['model'] == 'product.product':
            data['price'] = data['list_price']
        sessions = self.env['pos.session'].sudo().search([
            ('state', '=', 'opened')
        ])
        self.insert_data([data], data['model'])
        for session in sessions:
            self.env['bus.bus'].sendmany(
                [[(self.env.cr.dbname, 'pos.sync.data', session.user_id.id), data]])
        return True

    @api.model
    def remove_record(self, data):
        self.search([('res_id', '=', str(data['id'])), ('res_model', '=', data['model'])]).unlink()
        sessions = self.env['pos.session'].sudo().search([
            ('state', '=', 'opened')
        ])
        data['deleted'] = True
        for session in sessions:
            self.env['bus.bus'].sendmany(
                [[(self.env.cr.dbname, 'pos.sync.data', session.user_id.id), data]])
        return True

    @api.model
    def save_parameter_models_load(self, model_datas):
        # when pos loaded, all params (model name, fields list, context dict will store to backend
        # and use for cache data loaded to pos
        set_param = self.env['ir.config_parameter'].sudo().set_param
        for model_name, value in model_datas.items():
            set_param(model_name, value)
        return True

    def get_all_stock_by_stock_id(self, stock_location_id, stock_location_ids=None):
        if stock_location_ids is None:
            stock_location_ids = []
        stock_location_ids = stock_location_ids
        stock_location_ids.append(stock_location_id)
        stock = self.env['stock.location'].browse(stock_location_id)
        for stock in stock.child_ids:
            stock_location_ids.append(stock.id)
            if stock.child_ids:
                self.get_all_stock_by_stock_id(stock.id, stock_location_ids)
        if len(stock_location_ids) == 1:
            stock_location_ids.append(0)
        return stock_location_ids

    @api.model
    def get_product_available_all_stock_location(self, stock_location_id):
        _logger.info('{get_product_available_all_stock_location}')
        sql = """
        with
          uitstock as (
          select
              t.name product, sum(product_qty) sumout, m.product_id, m.product_uom 
            from stock_move m 
              left join product_product p on m.product_id = p.id 
              left join product_template t on p.product_tmpl_id = t.id
            where
              m.state like 'done' 
              and m.location_id in (select id from stock_location where usage like 'internal') 
              and m.location_dest_id not in (select id from stock_location where usage like 'internal') 
            group by product_id,product_uom, t.name order by t.name asc
          ),
          instock as (
            select
              t.list_price purchaseprice, t.name product, sum(product_qty) sumin, m.product_id, m.product_uom
            from stock_move m
              left join product_product p on m.product_id = p.id
              left join product_template t on p.product_tmpl_id = t.id
            where 
              m.state like 'done' and m.location_id not in (select id from stock_location where usage like 'internal')
              and m.location_dest_id in (select id from stock_location where usage like 'internal')
            group by product_id,product_uom, t.name, t.list_price order by t.name asc
          ) 
        select
          i.product, sumin-coalesce(sumout,0) AS stock, sumin, sumout, purchaseprice, ((sumin-coalesce(sumout,0)) * purchaseprice) as stockvalue
        from uitstock u 
          full outer join instock i on u.product = i.product
        """

    @api.model
    def get_on_hand_by_stock_location(self, stock_location_id):
        stock_ids = self.get_all_stock_by_stock_id(stock_location_id, [])
        if len(stock_ids) > 1:
            stock_datas = self.get_product_available_filter_by_stock_location_ids(tuple(stock_ids))
        else:
            stock_datas = self.get_product_available_filter_by_stock_location_id(
                stock_location_id)
        if stock_datas == {}:
            return False
        else:
            return stock_datas

    @api.model
    def get_product_available_filter_by_stock_location_id(self, stock_location_id):
        _logger.info('{get_product_available_filter_by_stock_location_id}')
        sql = """
        with
            uitstock as (
                select
                  t.name product, sum(product_qty) sumout, m.product_id, m.product_uom 
                from stock_move m 
                left join product_product p on m.product_id = p.id 
                left join product_template t on p.product_tmpl_id = t.id
                where
                    m.state like 'done'
                    and t.type = 'product' 
                    and m.location_id in (select id from stock_location where id=%s) 
                    and m.location_dest_id not in (select id from stock_location where id=%s) 
                group by product_id,product_uom, t.name order by t.name asc
            ),
            instock as (
                select
                    t.list_price purchaseprice, t.name product, sum(product_qty) sumin, m.product_id, m.product_uom
                from stock_move m
                left join product_product p on m.product_id = p.id
                left join product_template t on p.product_tmpl_id = t.id
                where 
                    m.state like 'done' and m.location_id not in (select id from stock_location where id=%s)
                    and m.location_dest_id in (select id from stock_location where id=%s)
                group by product_id,product_uom, t.name, t.list_price order by t.name asc
          ) 
        select
          i.product_id, i.product, sumin-coalesce(sumout,0) AS stock, sumin, sumout, purchaseprice, ((sumin-coalesce(sumout,0)) * purchaseprice) as stockvalue
        from uitstock u 
          full outer join instock i on u.product = i.product
        """ % (stock_location_id, stock_location_id, stock_location_id, stock_location_id)
        self.env.cr.execute(sql)
        results = self.env.cr.fetchall()
        pos_data = {}
        for result in results:
            if result[0]:
                pos_data[result[0]] = result[2]
        return pos_data

    @api.model
    def get_product_available_filter_by_stock_location_ids(self, stock_location_ids):
        _logger.info('begin get_product_available_filter_by_stock_location_ids')
        sql_out = """
                select
                    sum(product_qty) sumout, m.product_id, t.name product, m.product_uom 
                from stock_move m 
                left join product_product p on m.product_id = p.id 
                left join product_template t on p.product_tmpl_id = t.id
                where
                    t.available_in_pos is True
                    and m.state like 'done'
                    and t.type = 'product' 
                    and m.location_id in (select id from stock_location where id in %s) 
                    and m.location_dest_id not in (select id from stock_location where id in %s)
                group by product_id,product_uom, t.name order by t.name asc
            """ % (stock_location_ids, stock_location_ids)
        self.env.cr.execute(sql_out)
        results_out = self.env.cr.fetchall()
        sql_in = """
                    select
                        sum(product_qty) sumin, m.product_id, t.name product, t.list_price purchaseprice, m.product_uom
                    from stock_move m
                    left join product_product p on m.product_id = p.id
                    left join product_template t on p.product_tmpl_id = t.id
                    where 
                        t.available_in_pos is True
                        and m.state like 'done' and m.location_id not in (select id from stock_location where id in %s)
                        and m.location_dest_id in (select id from stock_location where id in %s)
                    group by product_id,product_uom, t.name, t.list_price order by t.name asc
                    """ % (stock_location_ids, stock_location_ids)
        self.env.cr.execute(sql_in)
        results_in = self.env.cr.fetchall()
        dict_in = {}
        for result in results_in:
            dict_in[result[1]] = result[0]
        dict_out = {}
        for result in results_out:
            dict_out[result[1]] = result[0]
        for product_id, qty_in in dict_in.items():
            dict_in[product_id] = dict_in[product_id] - dict_out.get(product_id, 0)
        return dict_in
