from odoo import api, fields, models

class BaseConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'
   
    signup_bg_image_id = fields.Many2one('ir.attachment')

    @api.model
    def get_values(self):
        res = super(BaseConfigSettings, self).get_values()
        params = self.env['ir.config_parameter'].sudo()
        signup_bg_image_id = params.get_param('clarico_signup.signup_bg_image_id', default=False)
        if str(signup_bg_image_id) != "False":
            res.update(signup_bg_image_id= int(signup_bg_image_id),)
        else:
            res.update(signup_bg_image_id= False,)
        return res

    @api.multi
    def set_values(self):
        self.ensure_one()
        super(BaseConfigSettings, self).set_values()
        self.env['ir.config_parameter'].sudo().set_param("clarico_signup.signup_bg_image_id", repr(self.signup_bg_image_id.id))        



