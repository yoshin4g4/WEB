{
    # Theme information
    'name' : 'Clarico Compare',
    'category' : 'Website',
    'version' : '1.0',
    'summary': 'Add Products into Compare from Category & Product Page',
    'description': """""",

    # Dependencies
    'depends': [
        'website_sale_comparison','clarico_shop','clarico_product','clarico_product_multi_carousel',
    ],

    # Views
    'data': [
        'templates/assets.xml',
        'templates/template.xml',
    ],

    # Author
    'author': 'Emipro Technologies Pvt. Ltd.',
    'website': 'http://www.emiprotechnologies.com',

    # Technical
    'installable': True,
}
