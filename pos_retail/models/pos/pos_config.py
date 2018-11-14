# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
import base64
import json
import logging

_logger = logging.getLogger(__name__)

class pos_config_image(models.Model):
    _name = "pos.config.image"

    name = fields.Char('Title', required=1)
    image = fields.Binary('Image', required=1)
    config_id = fields.Many2one('pos.config', 'POS config', required=1)
    description = fields.Text('Description')


class pos_config(models.Model):
    _inherit = "pos.config"

    user_id = fields.Many2one('res.users', 'Assigned to')
    config_access_right = fields.Boolean('Config access right', default=0)
    allow_discount = fields.Boolean('Change discount', default=1)
    allow_qty = fields.Boolean('Change quantity', default=1)
    allow_price = fields.Boolean('Change price', default=1)
    allow_remove_line = fields.Boolean('Remove line', default=1)
    allow_numpad = fields.Boolean('Display numpad', default=1)
    allow_payment = fields.Boolean('Display payment', default=1)
    allow_customer = fields.Boolean('Choice customer', default=1)
    allow_add_order = fields.Boolean('New order', default=1)
    allow_remove_order = fields.Boolean('Remove order', default=1)
    allow_add_product = fields.Boolean('Add line', default=1)

    allow_lock_screen = fields.Boolean('Lock screen',
                                       default=0,
                                       help='If checked, please go to user set pos pin')

    display_point_receipt = fields.Boolean('Display point / receipt')
    loyalty = fields.Boolean('Active loyalty')
    loyalty_ids = fields.Many2many('pos.loyalty',
                                   'pos_config_loyalty_rel',
                                   'config_id',
                                   'loyalty_id',
                                   'Loyalty Program',
                                   domain=[('state', '=', 'running')])

    promotion = fields.Boolean('Active promotion')
    promotion_ids = fields.Many2many('pos.promotion',
                                     'pos_config_promotion_rel',
                                     'config_id',
                                     'promotion_id',
                                     string='Promotion programs')

    create_purchase_order = fields.Boolean('Create PO', default=1)
    create_purchase_order_required_signature = fields.Boolean('Required signature', default=1)
    purchase_order_state = fields.Selection([
        ('confirm_order', 'Auto confirm'),
        ('confirm_picking', 'Auto delivery'),
        ('confirm_invoice', 'Auto invoice'),
    ], 'PO state',
        help='This is state of purchase order will process to',
        default='confirm_invoice')

    sync_sale_order = fields.Boolean('Sync sale orders', default=1)
    sale_order = fields.Boolean('Create Sale order', default=1)
    sale_order_auto_confirm = fields.Boolean('Auto confirm', default=1)
    sale_order_auto_invoice = fields.Boolean('Auto paid', default=1)
    sale_order_auto_delivery = fields.Boolean('Auto delivery', default=1)

    pos_orders_management = fields.Boolean('POS order management', default=0)
    pos_order_period_return_days = fields.Float('Return period days',
                                                help='this is period time for customer can return order',
                                                default=30)
    display_return_days_receipt = fields.Boolean('Display return days receipt', default=1)

    sync_pricelist = fields.Boolean('Sync prices list', default=1)

    display_onhand = fields.Boolean('Show qty available product', default=1,
                                    help='Display quantity on hand all products on pos screen')
    allow_order_out_of_stock = fields.Boolean('Allow out-of-stock', default=0,
                                              help='If checked, allow cashier can add product have out of stock')

    print_voucher = fields.Boolean('Print (create) voucher', default=1)
    scan_voucher = fields.Boolean('Scan voucher', default=1)
    expired_days_voucher = fields.Integer('Expired days of voucher', default=30)

    sync_multi_session = fields.Boolean('Sync multi session', default=1)
    bus_id = fields.Many2one('pos.bus', string='Shop location', help='Location sync, 1 shop = 1 location or 1 shop multi location')
    display_person_add_line = fields.Boolean('Display information line', default=1,
                                             help="When you checked, on pos order lines screen, will display information person created order (lines) Eg: create date, updated date ..")

    quickly_payment = fields.Boolean('Quickly payment', default=1)
    internal_transfer = fields.Boolean('Internal transfer', default=1,
                                       help='Go Inventory and active multi warehouse and location')
    internal_transfer_auto_validate = fields.Boolean('Internal transfer auto validate', default=1)

    discount = fields.Boolean('Global discount', default=0)
    discount_ids = fields.Many2many('pos.global.discount',
                                    'pos_config_pos_global_discount_rel',
                                    'config_id',
                                    'discount_id',
                                    'Global discounts')

    send_sms_receipt = fields.Boolean('Send sms receipt')
    send_sms_receipt_template_id = fields.Many2one('pos.sms.template', 'Send sms receipt template')
    send_sms_loyalty = fields.Boolean('Send sms loyalty')
    send_sms_loyalty_template_id = fields.Many2one('pos.sms.template', 'Send sms loyalty template')

    is_customer_screen = fields.Boolean('Is customer screen')
    delay = fields.Integer('Delay time', default=3000)
    slogan = fields.Char('Slogan', help='This is message will display on screen of customer')
    image_ids = fields.One2many('pos.config.image', 'config_id', 'Images')

    tooltip = fields.Boolean('Tooltip', default=1)
    discount_limit = fields.Boolean('Discount limit', default=1)
    discount_limit_amount = fields.Float('Discount limit amount', default=10)

    multi_currency = fields.Boolean('Multi currency', default=1)
    multi_currency_update_rate = fields.Boolean('Update rate', default=1)

    notify_alert = fields.Boolean('Notify alert',
                                  help='Turn on/off notification alert on POS sessions.',
                                  default=1)
    return_products = fields.Boolean('Return products',
                                     help='Check if you need cashiers can return products from customers and dont care name of pos order',
                                     default=1)
    receipt_without_payment_template = fields.Selection([
        ('none', 'None'),
        ('display_price', 'Display price'),
        ('not_display_price', 'Not display price')
    ], default='not_display_price', string='Receipt without payment template')
    lock_order_printed_receipt = fields.Boolean('Lock order printed receipt', default=0)
    staff_level = fields.Selection([
        ('manual', 'Manual config'),
        ('marketing', 'Marketing'),
        ('waiter', 'Waiter'),
        ('cashier', 'Cashier'),
        ('manager', 'Manager')
    ], string='Staff level', default='manual')

    validate_payment = fields.Boolean('Validate payment')
    validate_remove_order = fields.Boolean('Validate remove order')
    validate_remove_line = fields.Boolean('Validate remove line')
    validate_quantity_change = fields.Boolean('Validate quantity change')
    validate_price_change = fields.Boolean('Validate price change')
    validate_discount_change = fields.Boolean('Validate discount change')
    validate_close_session = fields.Boolean('Validate close session')

    print_user_card = fields.Boolean('Print user card')

    product_operation = fields.Boolean('Product Operation', default=1)
    quickly_payment_full = fields.Boolean('Quickly payment full')
    quickly_payment_full_journal_id = fields.Many2one('account.journal', 'Payment mode',
                                                      domain=[('journal_user', '=', True)])
    daily_report = fields.Boolean('Daily report', default=1)
    note_order = fields.Boolean('Note order', default=1)
    note_orderline = fields.Boolean('Note order line', default=1)
    signature_order = fields.Boolean('Signature order', default=1)
    quickly_buttons = fields.Boolean('Quickly Actions', default=1)
    display_amount_discount = fields.Boolean('Display amount discount', default=1)



    booking_orders = fields.Boolean('Booking orders', default=0)
    booking_orders_required_cashier_signature = fields.Boolean('Book order required sessions signature',
                                                               help='Checked if need required pos seller signature',
                                                               default=1)
    booking_orders_alert = fields.Boolean('Alert when new order coming', default=1)
    delivery_orders = fields.Boolean('Delivery orders',
                                     help='Pos clients can get booking orders and delivery orders',
                                     default=1)
    booking_orders_display_shipping_receipt = fields.Boolean('Display shipping on receipt', default=1)



    display_tax_orderline = fields.Boolean('Display tax orderline', default=1)
    display_tax_receipt = fields.Boolean('Display tax receipt', default=1)
    display_fiscal_position_receipt = fields.Boolean('Display fiscal position on receipt', default=1)

    display_image_orderline = fields.Boolean('Display image order line', default=1)
    display_image_receipt = fields.Boolean('Display image receipt', default=1)
    duplicate_receipt = fields.Boolean('Duplicate Receipt')
    print_number = fields.Integer('Print number', help='How many number receipt need to print at printer ?', default=2)

    lock_session = fields.Boolean('Lock session', default=1)
    category_wise_receipt = fields.Boolean('Category wise receipt', default=1)

    management_invoice = fields.Boolean('Management Invoice', default=0)
    add_credit = fields.Boolean('Add credit', default=1,
                                help='When cashiers Add credit note on invoice, auto add credit amount to customers')
    invoice_journal_ids = fields.Many2many(
        'account.journal',
        'pos_config_invoice_journal_rel',
        'config_id',
        'journal_id',
        'Accounting Invoice Journal',
        domain=[('type', '=', 'sale')],
        help="Accounting journal use for create invoices.")
    send_invoice_email = fields.Boolean('Send email invoice', help='Help cashier send invoice to email of customer', default=1)
    lock_print_invoice_on_pos = fields.Boolean('Lock print invoice', help='Lock print pdf invoice when clicked button invoice', default=1)
    pos_auto_invoice = fields.Boolean('Auto create invoice',
                                      help='Automatic create invoice if order have client',
                                      default=0)
    receipt_invoice_number = fields.Boolean('Add invoice on receipt', help='Show invoice number on receipt header', default=1)
    receipt_customer_vat = fields.Boolean('Add vat customer on receipt', help='Show customer VAT(TIN) on receipt header', default=1)
    auto_register_payment = fields.Boolean('Auto invocie register payment', default=1)

    fiscal_position_auto_detect = fields.Boolean('Fiscal position auto detect', default=1)

    display_sale_price_within_tax = fields.Boolean('Display sale price within tax', default=1)
    display_cost_price = fields.Boolean('Display product cost price', default=1)
    multi_location = fields.Boolean('Multi location', default=1)
    product_view = fields.Selection([
        ('box', 'Box view'),
        ('list', 'List view'),
    ], default='box', string='View of products screen', required=1)

    ticket_font_size = fields.Integer('Ticket font size', default=12)
    customer_default_id = fields.Many2one('res.partner', 'Customer default')
    medical_insurance = fields.Boolean('Medical insurance', default=0)
    discount_each_line = fields.Boolean('Discount each line')
    allow_manager_approve_discount = fields.Boolean('Allow manager approve discount')
    manager_user_id = fields.Many2one('res.users', 'Manager approve discount')
    set_guest = fields.Boolean('Set guest', default=1)
    reset_sequence = fields.Boolean('Reset sequence order', default=1)
    update_tax = fields.Boolean('Change tax of order', default=1)
    cash_out = fields.Boolean('Cash out', default=1)
    cash_in = fields.Boolean('Cash in', default=1)
    min_length_search = fields.Integer('Min character length search', default=3)

    @api.multi
    def remove_database(self):
        self.env.cr.execute("DELETE FROM pos_cache_database")
        return {
            'type': 'ir.actions.act_url',
            'url': '/pos/web/',
            'target': 'self',
        }

    @api.onchange('lock_print_invoice_on_pos')
    def onchange_lock_print_invoice_on_pos(self):
        if self.lock_print_invoice_on_pos == True:
            self.receipt_invoice_number = False
            self.send_invoice_email = True
        else:
            self.receipt_invoice_number = True
            self.send_invoice_email = False

    @api.onchange('receipt_invoice_number')
    def onchange_receipt_invoice_number(self):
        if self.receipt_invoice_number == True:
            self.lock_print_invoice_on_pos = False
        else:
            self.lock_print_invoice_on_pos = True

    @api.onchange('pos_auto_invoice')
    def onchange_pos_auto_invoice(self):
        if self.pos_auto_invoice == True:
            self.iface_invoicing = True
        else:
            self.iface_invoicing = False

    @api.onchange('staff_level')
    def on_change_staff_level(self):
        if self.staff_level and self.staff_level == 'manager':
            self.lock_order_printed_receipt = False

    @api.multi
    def write(self, vals):
        if vals.get('allow_discount', False) or vals.get('allow_qty', False) or vals.get('allow_price', False):
            vals['allow_numpad'] = True
        return super(pos_config, self).write(vals)

    @api.model
    def create(self, vals):
        if vals.get('allow_discount', False) or vals.get('allow_qty', False) or vals.get('allow_price', False):
            vals['allow_numpad'] = True
        return super(pos_config, self).create(vals)

    def init_wallet_journal(self):
        Journal = self.env['account.journal']
        user = self.env.user
        wallet_journal = Journal.sudo().search([
            ('code', '=', 'UWJ'),
            ('company_id', '=', user.company_id.id),
        ])
        if wallet_journal:
            return wallet_journal.sudo().write({
                'pos_method_type': 'wallet'
            })
        Account = self.env['account.account']
        wallet_account_old_version = Account.sudo().search([
            ('code', '=', 'AUW'), ('company_id', '=', user.company_id.id)])
        if wallet_account_old_version:
            wallet_account = wallet_account_old_version[0]
        else:
            wallet_account = Account.sudo().create({
                'name': 'Account wallet',
                'code': 'AUW',
                'user_type_id': self.env.ref('account.data_account_type_current_assets').id,
                'company_id': user.company_id.id,
                'note': 'code "AUW" auto give wallet amount of customers',
            })
            self.env['ir.model.data'].sudo().create({
                'name': 'account_use_wallet' + str(user.company_id.id),
                'model': 'account.account',
                'module': 'pos_retail',
                'res_id': wallet_account.id,
                'noupdate': True,  # If it's False, target record (res_id) will be removed while module update
            })

        wallet_journal_inactive = Journal.sudo().search([
            ('code', '=', 'UWJ'),
            ('company_id', '=', user.company_id.id),
            ('pos_method_type', '=', 'wallet')
        ])
        if wallet_journal_inactive:
            wallet_journal_inactive.sudo().write({
                'default_debit_account_id': wallet_account.id,
                'default_credit_account_id': wallet_account.id,
                'pos_method_type': 'wallet',
                'sequence': 100,
            })
            wallet_journal = wallet_journal_inactive
        else:
            new_sequence = self.env['ir.sequence'].sudo().create({
                'name': 'Account Default Wallet Journal ' + str(user.company_id.id),
                'padding': 3,
                'prefix': 'UW ' + str(user.company_id.id),
            })
            self.env['ir.model.data'].sudo().create({
                'name': 'journal_sequence' + str(new_sequence.id),
                'model': 'ir.sequence',
                'module': 'pos_retail',
                'res_id': new_sequence.id,
                'noupdate': True,
            })
            wallet_journal = Journal.sudo().create({
                'name': 'Wallet',
                'code': 'UWJ',
                'type': 'cash',
                'pos_method_type': 'wallet',
                'journal_user': True,
                'sequence_id': new_sequence.id,
                'company_id': user.company_id.id,
                'default_debit_account_id': wallet_account.id,
                'default_credit_account_id': wallet_account.id,
                'sequence': 100,
            })
            self.env['ir.model.data'].sudo().create({
                'name': 'use_wallet_journal_' + str(wallet_journal.id),
                'model': 'account.journal',
                'module': 'pos_retail',
                'res_id': int(wallet_journal.id),
                'noupdate': True,
            })

        config = self
        config.sudo().write({
            'journal_ids': [(4, wallet_journal.id)],
        })

        statement = [(0, 0, {
            'journal_id': wallet_journal.id,
            'user_id': user.id,
            'company_id': user.company_id.id
        })]
        current_session = config.current_session_id
        current_session.sudo().write({
            'statement_ids': statement,
        })
        return

    def init_voucher_journal(self):
        Journal = self.env['account.journal']
        user = self.env.user
        voucher_journal = Journal.sudo().search([
            ('code', '=', 'VCJ'),
            ('company_id', '=', user.company_id.id),
        ])
        if voucher_journal:
            return voucher_journal.sudo().write({
                'pos_method_type': 'voucher'
            })
        Account = self.env['account.account']
        voucher_account_old_version = Account.sudo().search([
            ('code', '=', 'AVC'), ('company_id', '=', user.company_id.id)])
        if voucher_account_old_version:
            voucher_account = voucher_account_old_version[0]
        else:
            voucher_account = Account.sudo().create({
                'name': 'Account voucher',
                'code': 'AVC',
                'user_type_id': self.env.ref('account.data_account_type_current_assets').id,
                'company_id': user.company_id.id,
                'note': 'code "AVC" auto give voucher histories of customers',
            })
            self.env['ir.model.data'].sudo().create({
                'name': 'account_voucher' + str(user.company_id.id),
                'model': 'account.account',
                'module': 'pos_retail',
                'res_id': voucher_account.id,
                'noupdate': True,  # If it's False, target record (res_id) will be removed while module update
            })

        voucher_journal = Journal.sudo().search([
            ('code', '=', 'VCJ'),
            ('company_id', '=', user.company_id.id),
            ('pos_method_type', '=', 'voucher')
        ])
        if voucher_journal:
            voucher_journal[0].sudo().write({
                'voucher': True,
                'default_debit_account_id': voucher_account.id,
                'default_credit_account_id': voucher_account.id,
                'pos_method_type': 'voucher',
                'sequence': 101,
            })
            voucher_journal = voucher_journal[0]
        else:
            new_sequence = self.env['ir.sequence'].sudo().create({
                'name': 'Account Voucher ' + str(user.company_id.id),
                'padding': 3,
                'prefix': 'AVC ' + str(user.company_id.id),
            })
            self.env['ir.model.data'].sudo().create({
                'name': 'journal_sequence' + str(new_sequence.id),
                'model': 'ir.sequence',
                'module': 'pos_retail',
                'res_id': new_sequence.id,
                'noupdate': True,
            })
            voucher_journal = Journal.sudo().create({
                'name': 'Voucher',
                'code': 'VCJ',
                'type': 'cash',
                'pos_method_type': 'voucher',
                'journal_user': True,
                'sequence_id': new_sequence.id,
                'company_id': user.company_id.id,
                'default_debit_account_id': voucher_account.id,
                'default_credit_account_id': voucher_account.id,
                'sequence': 101,
            })
            self.env['ir.model.data'].sudo().create({
                'name': 'journal_voucher_' + str(voucher_journal.id),
                'model': 'account.journal',
                'module': 'pos_retail',
                'res_id': int(voucher_journal.id),
                'noupdate': True,
            })

        config = self
        config.sudo().write({
            'journal_ids': [(4, voucher_journal.id)],
        })

        statement = [(0, 0, {
            'journal_id': voucher_journal.id,
            'user_id': user.id,
            'company_id': user.company_id.id
        })]
        current_session = config.current_session_id
        current_session.sudo().write({
            'statement_ids': statement,
        })
        return

    def init_credit_journal(self):
        Journal = self.env['account.journal']
        user = self.env.user
        voucher_journal = Journal.sudo().search([
            ('code', '=', 'CJ'),
            ('company_id', '=', user.company_id.id),
        ])
        if voucher_journal:
            return voucher_journal.sudo().write({
                'pos_method_type': 'credit'
            })
        Account = self.env['account.account']
        credit_account_old_version = Account.sudo().search([
            ('code', '=', 'ACJ'), ('company_id', '=', user.company_id.id)])
        if credit_account_old_version:
            credit_account = credit_account_old_version[0]
        else:
            credit_account = Account.sudo().create({
                'name': 'Credit Account',
                'code': 'CA',
                'user_type_id': self.env.ref('account.data_account_type_current_assets').id,
                'company_id': user.company_id.id,
                'note': 'code "CA" give credit payment customer',
            })
            self.env['ir.model.data'].sudo().create({
                'name': 'account_credit' + str(user.company_id.id),
                'model': 'account.account',
                'module': 'pos_retail',
                'res_id': credit_account.id,
                'noupdate': True,  # If it's False, target record (res_id) will be removed while module update
            })

        credit_journal = Journal.sudo().search([
            ('code', '=', 'CJ'),
            ('company_id', '=', user.company_id.id),
            ('pos_method_type', '=', 'credit')
        ])
        if credit_journal:
            credit_journal[0].sudo().write({
                'credit': True,
                'default_debit_account_id': credit_account.id,
                'default_credit_account_id': credit_account.id,
                'pos_method_type': 'credit',
                'sequence': 102,
            })
            credit_journal = credit_journal[0]
        else:
            new_sequence = self.env['ir.sequence'].sudo().create({
                'name': 'Credit account ' + str(user.company_id.id),
                'padding': 3,
                'prefix': 'CA ' + str(user.company_id.id),
            })
            self.env['ir.model.data'].sudo().create({
                'name': 'journal_sequence' + str(new_sequence.id),
                'model': 'ir.sequence',
                'module': 'pos_retail',
                'res_id': new_sequence.id,
                'noupdate': True,
            })
            credit_journal = Journal.sudo().create({
                'name': 'Customer Credit',
                'code': 'CJ',
                'type': 'cash',
                'pos_method_type': 'credit',
                'journal_user': True,
                'sequence_id': new_sequence.id,
                'company_id': user.company_id.id,
                'default_debit_account_id': credit_account.id,
                'default_credit_account_id': credit_account.id,
                'sequence': 102,
            })
            self.env['ir.model.data'].sudo().create({
                'name': 'credit_journal_' + str(credit_journal.id),
                'model': 'account.journal',
                'module': 'pos_retail',
                'res_id': int(credit_journal.id),
                'noupdate': True,
            })

        config = self
        config.sudo().write({
            'journal_ids': [(4, credit_journal.id)],
        })

        statement = [(0, 0, {
            'journal_id': credit_journal.id,
            'user_id': user.id,
            'company_id': user.company_id.id
        })]
        current_session = config.current_session_id
        current_session.sudo().write({
            'statement_ids': statement,
        })
        return True

    def init_return_order_journal(self):
        Journal = self.env['account.journal']
        user = self.env.user
        return_journal = Journal.sudo().search([
            ('code', '=', 'ROJ'),
            ('company_id', '=', user.company_id.id),
        ])
        if return_journal:
            return return_journal.sudo().write({
                'pos_method_type': 'return'
            })
        Account = self.env['account.account']
        return_account_old_version = Account.sudo().search([
            ('code', '=', 'ARO'), ('company_id', '=', user.company_id.id)])
        if return_account_old_version:
            return_account = return_account_old_version[0]
        else:
            return_account = Account.sudo().create({
                'name': 'Return Order Account',
                'code': 'ARO',
                'user_type_id': self.env.ref('account.data_account_type_current_assets').id,
                'company_id': user.company_id.id,
                'note': 'code "ARO" give return order from customer',
            })
            self.env['ir.model.data'].sudo().create({
                'name': 'return_account' + str(user.company_id.id),
                'model': 'account.account',
                'module': 'pos_retail',
                'res_id': return_account.id,
                'noupdate': True,  # If it's False, target record (res_id) will be removed while module update
            })

        return_journal = Journal.sudo().search([
            ('code', '=', 'ROJ'),
            ('company_id', '=', user.company_id.id),
        ])
        if return_journal:
            return_journal[0].sudo().write({
                'default_debit_account_id': return_account.id,
                'default_credit_account_id': return_account.id,
                'pos_method_type': 'return'
            })
            return_journal = return_journal[0]
        else:
            new_sequence = self.env['ir.sequence'].sudo().create({
                'name': 'Return account ' + str(user.company_id.id),
                'padding': 3,
                'prefix': 'RA ' + str(user.company_id.id),
            })
            self.env['ir.model.data'].sudo().create({
                'name': 'journal_sequence' + str(new_sequence.id),
                'model': 'ir.sequence',
                'module': 'pos_retail',
                'res_id': new_sequence.id,
                'noupdate': True,
            })
            return_journal = Journal.sudo().create({
                'name': 'Return Order Customer',
                'code': 'ROJ',
                'type': 'cash',
                'pos_method_type': 'return',
                'journal_user': True,
                'sequence_id': new_sequence.id,
                'company_id': user.company_id.id,
                'default_debit_account_id': return_account.id,
                'default_credit_account_id': return_account.id,
                'sequence': 103,
            })
            self.env['ir.model.data'].sudo().create({
                'name': 'return_journal_' + str(return_journal.id),
                'model': 'account.journal',
                'module': 'pos_retail',
                'res_id': int(return_journal.id),
                'noupdate': True,
            })

        config = self
        config.sudo().write({
            'journal_ids': [(4, return_journal.id)],
        })

        statement = [(0, 0, {
            'journal_id': return_journal.id,
            'user_id': user.id,
            'company_id': user.company_id.id
        })]
        current_session = config.current_session_id
        current_session.sudo().write({
            'statement_ids': statement,
        })
        return True

    def init_rounding_journal(self):
        Journal = self.env['account.journal']
        Account = self.env['account.account']
        user = self.env.user
        rounding_journal = Journal.sudo().search([
            ('code', '=', 'RDJ'),
            ('company_id', '=', user.company_id.id),
        ])
        if rounding_journal:
            return rounding_journal.sudo().write({
                'pos_method_type': 'rounding'
            })
        rounding_account_old_version = Account.sudo().search([
            ('code', '=', 'AAR'), ('company_id', '=', user.company_id.id)])
        if rounding_account_old_version:
            rounding_account = rounding_account_old_version[0]
        else:
            _logger.info('rounding_account have not')
            rounding_account = Account.sudo().create({
                'name': 'Rounding Account',
                'code': 'AAR',
                'user_type_id': self.env.ref('account.data_account_type_current_assets').id,
                'company_id': user.company_id.id,
                'note': 'code "AAR" give rounding pos order',
            })
            self.env['ir.model.data'].sudo().create({
                'name': 'rounding_account' + str(user.company_id.id),
                'model': 'account.account',
                'module': 'pos_retail',
                'res_id': rounding_account.id,
                'noupdate': True,
            })
        rounding_journal = Journal.sudo().search([
            ('pos_method_type', '=', 'rounding'),
            ('company_id', '=', user.company_id.id),
        ])
        if rounding_journal:
            rounding_journal[0].sudo().write({
                'name': 'Rounding',
                'default_debit_account_id': rounding_account.id,
                'default_credit_account_id': rounding_account.id,
                'pos_method_type': 'rounding',
                'code': 'RDJ'
            })
            rounding_journal = rounding_journal[0]
        else:
            new_sequence = self.env['ir.sequence'].sudo().create({
                'name': 'rounding account ' + str(user.company_id.id),
                'padding': 3,
                'prefix': 'RA ' + str(user.company_id.id),
            })
            self.env['ir.model.data'].sudo().create({
                'name': 'journal_sequence' + str(new_sequence.id),
                'model': 'ir.sequence',
                'module': 'pos_retail',
                'res_id': new_sequence.id,
                'noupdate': True,
            })
            rounding_journal = Journal.sudo().create({
                'name': 'Rounding',
                'code': 'RDJ',
                'type': 'cash',
                'pos_method_type': 'rounding',
                'journal_user': True,
                'sequence_id': new_sequence.id,
                'company_id': user.company_id.id,
                'default_debit_account_id': rounding_account.id,
                'default_credit_account_id': rounding_account.id,
                'sequence': 103,
            })
            self.env['ir.model.data'].sudo().create({
                'name': 'rounding_journal_' + str(rounding_journal.id),
                'model': 'account.journal',
                'module': 'pos_retail',
                'res_id': int(rounding_journal.id),
                'noupdate': True,
            })

        config = self
        config.sudo().write({
            'journal_ids': [(4, rounding_journal.id)],
        })

        statement = [(0, 0, {
            'journal_id': rounding_journal.id,
            'user_id': user.id,
            'company_id': user.company_id.id
        })]
        current_session = config.current_session_id
        current_session.sudo().write({
            'statement_ids': statement,
        })
        return True

    @api.multi
    def open_ui(self):
        res = super(pos_config, self).open_ui()
        self.init_voucher_journal()
        self.init_wallet_journal()
        self.init_credit_journal()
        self.init_return_order_journal()
        self.init_rounding_journal()
        return res

    @api.multi
    def open_session_cb(self):
        res = super(pos_config, self).open_session_cb()
        self.init_voucher_journal()
        self.init_wallet_journal()
        self.init_credit_journal()
        self.init_return_order_journal()
        self.init_rounding_journal()
        return res
