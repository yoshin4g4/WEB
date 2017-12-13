from odoo import fields,models

class SubMenuContent(models.Model):
    _inherit = 'website.menu'
    
    menu_html =fields.Html('Menu Html')
    dynamic_menu = fields.Boolean("Dynamic menu",default=False)
