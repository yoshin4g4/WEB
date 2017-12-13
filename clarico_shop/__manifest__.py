{
    # Theme information
    'name' : 'Clarico Shop',
    'category' : 'Website',
    'version' : '1.0',
    'summary': 'Showcase Products in Unique Style at your Online Store',
    'description': """""",

    # Dependencies
    'depends': [
        'clarico_layout'
    ],

    # Views
    'data': [
        'security/ir.model.access.csv', 
        'templates/template.xml',
        'view/product_template.xml',
        'view/product_label.xml',
        'templates/assets.xml',
    ],

    # Author
    'author': 'Emipro Technologies Pvt. Ltd.',
    'website': 'http://www.emiprotechnologies.com',

    # Technical
    'installable': True,
}
