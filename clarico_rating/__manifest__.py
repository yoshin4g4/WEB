{
    # Theme information
    'name' : 'Clarico Rating',
    'category' : 'Website',
    'version' : '1.0',
    'summary': 'Show Product Rating in Category Page',
    'description': """""",

    # Dependencies
    'depends': [
        'website_rating','clarico_wishlist','clarico_product_multi_carousel','clarico_quick_view','clarico_product','clarico_compare',
    ],

    # Views
    'data': [
        'templates/template.xml',
        'templates/assets.xml',
    ],

    # Author
    'author': 'Emipro Technologies Pvt. Ltd.',
    'website': 'http://www.emiprotechnologies.com',

    # Technical
    'installable': True,
}
