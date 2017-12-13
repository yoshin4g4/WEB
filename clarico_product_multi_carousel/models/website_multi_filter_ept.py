from openerp import models, fields, api

class website_multi_filter_ept(models.Model):
    _name="website.multi.filter.ept"

    name=fields.Char("Filter Name")
    website_published=fields.Boolean("Website Published")
    filter_ids=fields.One2many("filter.ept","fname","Select Filters")
