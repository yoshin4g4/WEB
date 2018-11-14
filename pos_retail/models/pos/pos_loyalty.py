# -*- coding: utf-8 -*-
from odoo import fields, api, models, api, _


class pos_loyalty_category(models.Model):
    _name = "pos.loyalty.category"

    name = fields.Char('Name', required=1)
    code = fields.Char('Code', required=1)
    active = fields.Boolean('Active', default=1)
    from_point = fields.Float('Point from', required=1)
    to_point = fields.Float('Point to', required=1)


class pos_loyalty(models.Model):
    _name = "pos.loyalty"

    name = fields.Char('Name', required=1)
    start_date = fields.Datetime('Start date', required=1)
    end_date = fields.Datetime('End date', required=1)
    active = fields.Boolean('Active', default=1)
    rule_ids = fields.One2many('pos.loyalty.rule', 'loyalty_id', 'Rules')
    reward_ids = fields.One2many('pos.loyalty.reward', 'loyalty_id', 'Rewards')
    state = fields.Selection([
        ('running', 'Running'),
        ('stop', 'Stop')
    ], string='State', default='running')
    product_loyalty_id = fields.Many2one('product.product', string='Rs',
                                         domain=[('available_in_pos', '=', True)], required=1)

    @api.model
    def default_get(self, default_fields):
        res = super(pos_loyalty, self).default_get(default_fields)
        products = self.env['product.product'].search([('default_code', '=', 'Rs')])
        if products:
            res.update({'product_loyalty_id': products[0].id})
        return res


class pos_loyalty_rule(models.Model):
    _name = "pos.loyalty.rule"
    _rec_name = 'loyalty_id'

    name = fields.Char('Name', required=1)
    active = fields.Boolean('Active', default=1)
    rounding = fields.Float('Rounding', default=0.01)
    loyalty_id = fields.Many2one('pos.loyalty', 'Loyalty', required=1)
    coefficient = fields.Float('Coefficient', required=1, help='Coefficient of amount line to point', default=0.01)
    type = fields.Selection([
        ('products', 'Products'),
        ('categories', 'Categories'),
        ('order_amount', 'Order amount')
    ], string='Type', required=1, default='products')
    product_ids = fields.Many2many('product.product', 'loyalty_rule_product_rel', 'rule_id', 'product_id',
                                   string='Products', domain=[('available_in_pos', '=', True)])
    category_ids = fields.Many2many('pos.category', 'loyalty_rule_pos_categ_rel', 'rule_id', 'categ_id',
                                    string='Categories')
    min_amount = fields.Float('Min amount', required=1, help='This condition min amount of order can apply rule')
    rule_order_amount_ids = fields.One2many('pos.loyalty.rule.order.amount', 'rule_id', string='Order amount rules')


class pos_loyalty_rule_order_amount(models.Model):
    _name = "pos.loyalty.rule.order.amount"
    _rec_name = 'rule_id'

    rule_id = fields.Many2one('pos.loyalty.rule', 'Rule', required=1)
    amount_from = fields.Float('Amount from', required=1)
    amount_to = fields.Float('Amount to', required=1)
    point = fields.Float('Point', required=1)


class pos_loyalty_reward(models.Model):
    _name = "pos.loyalty.reward"

    name = fields.Char('Name', required=1)
    active = fields.Boolean('Active', default=1)
    loyalty_id = fields.Many2one('pos.loyalty', 'Loyalty', required=1)
    redeem_point = fields.Float('Redeem point', help='This is total point get from customer when cashier Reward')
    type = fields.Selection([
        ('discount_products', 'Discount products'),
        ('discount_categories', "Discount categories"),
        ('gift', 'Free gift'),
        ('resale', "Sale off got point"),
        ('use_point_payment', "Use point for paid"),
    ], string='Type of reward', required=1, help="""
        Discount Products: Will discount list products filter by products\n
        Discount categories: Will discount products filter by categories \n
        Gift: Will free gift products to customers \n
        Sale off got point : sale off list products and get points from customers \n
        Use point payment : covert point to discount price \n
    """)
    rounding = fields.Float('Rounding', default=0.01)
    coefficient = fields.Float('Coefficient', required=1, help='Coefficient discount line amount to point', default=1)
    discount = fields.Float('Discount %', required=1, help='Discount %')
    discount_product_ids = fields.Many2many('product.product', 'reward_product_rel', 'reward_id', 'product_id',
                                            string='Products', domain=[('available_in_pos', '=', True)])
    discount_category_ids = fields.Many2many('pos.category', 'reward_pos_categ_rel', 'reward_id', 'categ_id',
                                             string='Categories')
    min_amount = fields.Float('Min amount', required=1, help='This condition min amount of order can apply reward')
    gift_product_ids = fields.Many2many('product.product', 'reward_gift_product_product_rel', 'reward_id',
                                        'gift_product_id',
                                        string='Gift Products', domain=[('available_in_pos', '=', True)])
    resale_product_ids = fields.Many2many('product.product', 'reward_resale_product_product_rel', 'reward_id',
                                          'resale_product_id',
                                          string='Resale Products', domain=[('available_in_pos', '=', True)])
    gift_quantity = fields.Float('Gift Quantity', default=1)
    price_resale = fields.Float('Price of resale')
