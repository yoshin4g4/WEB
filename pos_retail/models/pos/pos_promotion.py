# -*- coding: utf-8 -*-
from odoo import api, fields, models, _


class pos_promotion(models.Model):
    _name = "pos.promotion"

    name = fields.Char('Name', required=1)
    active = fields.Boolean('Active', default=1)
    start_date = fields.Datetime('Start date', default=fields.Datetime.now(), required=1)
    end_date = fields.Datetime('End date', required=1)
    type = fields.Selection([
        ('1_discount_total_order', 'Discount on total order'),
        ('2_discount_category', 'Discount on categories'),
        ('3_discount_by_quantity_of_product', 'Discount by quantity of product'),
        ('4_pack_discount', 'By pack products discount products'),
        ('5_pack_free_gift', 'By pack products free products'),
        ('6_price_filter_quantity', 'Price product filter by quantity'),
        ('7_special_category', 'Special category'),
        ('8_discount_lowest_price', 'Discount lowest price'),
        ('9_multi_buy', 'Multi buy - By X for price'),
    ], 'Type', default='1_discount_total_order', required=1)
    product_id = fields.Many2one('product.product', 'Product service', domain=[('available_in_pos', '=', True)])
    discount_order_ids = fields.One2many('pos.promotion.discount.order', 'promotion_id', 'Discounts')
    discount_category_ids = fields.One2many('pos.promotion.discount.category', 'promotion_id', 'Discounts')
    discount_quantity_ids = fields.One2many('pos.promotion.discount.quantity', 'promotion_id', 'Discounts')
    gift_condition_ids = fields.One2many('pos.promotion.gift.condition', 'promotion_id', 'Gifts condition')
    gift_free_ids = fields.One2many('pos.promotion.gift.free', 'promotion_id', 'Gifts apply')
    discount_condition_ids = fields.One2many('pos.promotion.discount.condition', 'promotion_id', 'Discounts condition')
    discount_apply_ids = fields.One2many('pos.promotion.discount.apply', 'promotion_id', 'Discounts apply')
    price_ids = fields.One2many('pos.promotion.price', 'promotion_id', 'Prices')
    special_category_ids = fields.One2many('pos.promotion.special.category', 'promotion_id', 'Special Category')
    discount_lowest_price = fields.Float('Discount lowest price (%)')
    multi_buy_ids = fields.One2many('pos.promotion.multi.buy', 'promotion_id', 'Multi Buy')

    @api.model
    def default_get(self, fields):
        res = super(pos_promotion, self).default_get(fields)
        products = self.env['product.product'].search([('name', '=', 'Promotion service')])
        if products:
            res.update({'product_id': products[0].id})
        return res


class pos_promotion_discount_order(models.Model):
    _name = "pos.promotion.discount.order"
    _order = "minimum_amount"

    minimum_amount = fields.Float('Sub total min', required=1)
    discount = fields.Float('Discount %', required=1)
    promotion_id = fields.Many2one('pos.promotion', 'Promotion', required=1)


class pos_promotion_discount_category(models.Model):
    _name = "pos.promotion.discount.category"
    _order = "category_id, discount"

    category_id = fields.Many2one('pos.category', 'POS Category', required=1)
    discount = fields.Float('Discount %', required=1)
    promotion_id = fields.Many2one('pos.promotion', 'Promotion', required=1)


class pos_promotion_discount_quantity(models.Model):
    _name = "pos.promotion.discount.quantity"
    _order = "product_id"

    product_id = fields.Many2one('product.product', 'Product', domain=[('available_in_pos', '=', True)], required=1)
    quantity = fields.Float('Minimum quantity', required=1)
    discount = fields.Float('Discount %', required=1)
    promotion_id = fields.Many2one('pos.promotion', 'Promotion', required=1)


class pos_promotion_gift_condition(models.Model):
    _name = "pos.promotion.gift.condition"
    _order = "product_id, minimum_quantity"

    product_id = fields.Many2one('product.product', domain=[('available_in_pos', '=', True)], string='Product',
                                 required=1)
    minimum_quantity = fields.Float('Qty greater or equal', required=1, default=1.0)
    promotion_id = fields.Many2one('pos.promotion', 'Promotion', required=1)


class pos_promotion_gift_free(models.Model):
    _name = "pos.promotion.gift.free"
    _order = "product_id"

    product_id = fields.Many2one('product.product', domain=[('available_in_pos', '=', True)], string='Product gift',
                                 required=1)
    quantity_free = fields.Float('Quantity free', required=1, default=1.0)
    promotion_id = fields.Many2one('pos.promotion', 'Promotion', required=1)


class pos_promotion_discount_condition(models.Model):
    _name = "pos.promotion.discount.condition"
    _order = "product_id, minimum_quantity"

    product_id = fields.Many2one('product.product', domain=[('available_in_pos', '=', True)], string='Product',
                                 required=1)
    minimum_quantity = fields.Float('Qty greater or equal', required=1, default=1.0)
    promotion_id = fields.Many2one('pos.promotion', 'Promotion', required=1)


class pos_promotion_discount_apply(models.Model):
    _name = "pos.promotion.discount.apply"
    _order = "product_id"

    product_id = fields.Many2one('product.product', domain=[('available_in_pos', '=', True)], string='Product',
                                 required=1)
    discount = fields.Float('Discount %', required=1, default=1.0)
    promotion_id = fields.Many2one('pos.promotion', 'Promotion', required=1)


class pos_promotion_price(models.Model):
    _name = "pos.promotion.price"
    _order = "product_id, minimum_quantity"

    product_id = fields.Many2one('product.product', domain=[('available_in_pos', '=', True)], string='Product',
                                 required=1)
    minimum_quantity = fields.Float('Qty greater or equal', required=1)
    list_price = fields.Float('List Price', required=1)
    promotion_id = fields.Many2one('pos.promotion', 'Promotion', required=1)


class pos_promotion_special_category(models.Model):
    _name = "pos.promotion.special.category"
    _order = "type"

    category_id = fields.Many2one('pos.category', 'POS Category', required=1)
    type = fields.Selection([
        ('discount', 'Discount'),
        ('free', 'Free gift')
    ], string='Type', required=1, default='discount')
    count = fields.Integer('Count', help='How many product the same category will apply')
    discount = fields.Float('Discount %', required=1)
    promotion_id = fields.Many2one('pos.promotion', 'Promotion', required=1)
    product_id = fields.Many2one('product.product', 'Product apply', domain=[('available_in_pos', '=', True)])
    qty_free = fields.Float('Quantity gift', default=1)

class pos_promotion_multi_buy(models.Model):
    _name = "pos.promotion.multi.buy"

    product_id = fields.Many2one('product.product', domain=[('available_in_pos', '=', True)], string='Product',
                                 required=1)
    quantity_of_by = fields.Float('Quantity Buy', required=1)
    quantity_promotion = fields.Float('Quantity apply', required=1)
    price_promotion = fields.Float('Price apply', required=1)
    promotion_id = fields.Many2one('pos.promotion', 'Promotion', required=1)
