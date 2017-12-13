from odoo import api, fields, models

class BaseConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'
   
    signin_bg_image_id = fields.Many2one('ir.attachment')

    @api.model
    def get_values(self):
        res = super(BaseConfigSettings, self).get_values()
        params = self.env['ir.config_parameter'].sudo()
        signin_bg_image_id = params.get_param('clarico_signin.signin_bg_image_id', default=False)
        if str(signin_bg_image_id) != "False":
            res.update(signin_bg_image_id= int(signin_bg_image_id),)
        else:
            res.update(signin_bg_image_id= False,)
        return res

    @api.multi
    def set_values(self):
        self.ensure_one()
        super(BaseConfigSettings, self).set_values()
        self.env['ir.config_parameter'].sudo().set_param("clarico_signin.signin_bg_image_id", repr(self.signin_bg_image_id.id))




