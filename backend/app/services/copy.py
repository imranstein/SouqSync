"""Localized copy for Telegram bot messages.

Keys match the message identifiers used in the bot handler.
Supports: en (English), am (Amharic), om (Afaan Oromo).
"""
# ruff: noqa: E501  # long i18n strings

from __future__ import annotations

COPY: dict[str, dict[str, str]] = {
    "welcome": {
        "en": "Welcome to SoukSync! \U0001f6cd\ufe0f Your market, your power.\n\nChoose your language:\n1\ufe0f\u20e3 Amharic\n2\ufe0f\u20e3 Afaan Oromo\n3\ufe0f\u20e3 English",
        "am": "\u12a5\u1295\u1243\u1295 \u12f0\u1205\u1293 \u1218\u1321 \u12c8\u12f0 SoukSync! \U0001f6cd\ufe0f \u1308\u1260\u12eb\u1205\u1363 \u1283\u12ed\u120d\u1205\u1362\n\n\u124b\u1295\u124b \u12ed\u121d\u1228\u1321:\n1\ufe0f\u20e3 \u12a0\u121b\u122d\u129b\n2\ufe0f\u20e3 Afaan Oromo\n3\ufe0f\u20e3 English",
        "om": "Baga nagaan dhuftan gara SoukSync! \U0001f6cd\ufe0f Gabaan kee, humna kee.\n\nAfaan filadhu:\n1\ufe0f\u20e3 Amaariffaa\n2\ufe0f\u20e3 Afaan Oromo\n3\ufe0f\u20e3 English",
    },
    "lang_set": {
        "en": "\u2705 Language set to English.",
        "am": "\u2705 \u124b\u1295\u124b \u12a0\u121b\u122d\u129b \u1270\u1218\u122d\u1327\u120d\u1362",
        "om": "\u2705 Afaan Oromo filatameera.",
    },
    "ask_shop_name": {
        "en": "Please enter your shop name:",
        "am": "\u12e8\u1231\u1245\u12ce\u1295 \u1235\u121d \u12eb\u1235\u1308\u1261:",
        "om": "Maqaa suuqii keessanii galchaa:",
    },
    "ask_location": {
        "en": "Where is your shop?\n1\ufe0f\u20e3 Mercato\n2\ufe0f\u20e3 Bole\n3\ufe0f\u20e3 Piassa\n4\ufe0f\u20e3 Other (type the area)",
        "am": "\u1231\u1245\u12ce \u12e8\u1275 \u1290\u12cd?\n1\ufe0f\u20e3 \u1218\u122d\u12ab\u1276\n2\ufe0f\u20e3 \u1266\u120c\n3\ufe0f\u20e3 \u1352\u12eb\u1233\n4\ufe0f\u20e3 \u120c\u120b (\u12a0\u12ab\u1263\u1262\u12cd\u1295 \u12ed\u133b\u1349)",
        "om": "Suuqiin keessan eessa?\n1\ufe0f\u20e3 Markaatoo\n2\ufe0f\u20e3 Boolee\n3\ufe0f\u20e3 Piyaasaa\n4\ufe0f\u20e3 Kan biraa (naannoo barreessaa)",
    },
    "ask_shop_type": {
        "en": "Shop type:\n1\ufe0f\u20e3 Kiosk\n2\ufe0f\u20e3 Mini market\n3\ufe0f\u20e3 Wholesale",
        "am": "\u12e8\u1231\u1245 \u12a0\u12ed\u1290\u1275:\n1\ufe0f\u20e3 \u12aa\u12ee\u1235\u12ad\n2\ufe0f\u20e3 \u121a\u1292 \u121b\u122d\u12ac\u1275\n3\ufe0f\u20e3 \u1305\u121d\u120b",
        "om": "Gosa suuqii:\n1\ufe0f\u20e3 Kiyooskii\n2\ufe0f\u20e3 Suuqii xiqqoo\n3\ufe0f\u20e3 Daldala guddaa",
    },
    "registration_complete": {
        "en": "\U0001f389 Registration complete!\n{shop_name} | {location} | {shop_type}\n\n\U0001f4e6 Order \u2014 Place an order\n\U0001f4cb Reorder \u2014 Repeat last order\n\U0001f4b3 Credit \u2014 Check credit\n\u2753 Help \u2014 Get help",
        "am": "\U0001f389 \u121d\u12dd\u1308\u1263 \u1270\u1320\u1293\u1249\u120d!\n{shop_name} | {location} | {shop_type}\n\n\U0001f4e6 \u1275\u12d5\u12db\u12dd \u2014 \u1275\u12d5\u12db\u12dd \u12eb\u1235\u1308\u1261\n\U0001f4cb \u12f5\u1308\u121d \u2014 \u12eb\u1208\u1348\u12cd\u1295 \u12ed\u12f5\u1308\u1219\n\U0001f4b3 \u12ad\u122c\u12f2\u1275 \u2014 \u12ad\u122c\u12f2\u1275 \u12ed\u1218\u120d\u12a8\u1271\n\u2753 \u12a5\u1308\u12db \u2014 \u12a5\u122d\u12f3\u1273 \u12eb\u130d\u129b",
        "om": "\U0001f389 Galmeen xumurameera!\n{shop_name} | {location} | {shop_type}\n\n\U0001f4e6 Ajaja \u2014 Ajaja galchaa\n\U0001f4cb Irra deebi\u2019i \u2014 Ajaja darbe irra deebi\u2019i\n\U0001f4b3 Liqii \u2014 Liqii ilaali\n\u2753 Gargaarsa \u2014 Gargaarsa argadhu",
    },
    "categories": {
        "en": "\U0001f4c2 Categories:\n1\ufe0f\u20e3 Beverages\n2\ufe0f\u20e3 Snacks\n3\ufe0f\u20e3 Household\n4\ufe0f\u20e3 Personal care\n5\ufe0f\u20e3 Grains & staples\n\nReply with a number.",
        "am": "\U0001f4c2 \u121d\u12f5\u1266\u127d:\n1\ufe0f\u20e3 \u1218\u1320\u1326\u127d\n2\ufe0f\u20e3 \u1245\u122d\u1235\n3\ufe0f\u20e3 \u12e8\u1260\u1275 \u12d5\u1243\u12ce\u127d\n4\ufe0f\u20e3 \u12e8\u130d\u120d \u1295\u133d\u1205\u1293\n5\ufe0f\u20e3 \u1325\u122b\u1325\u122c \u12a5\u1293 \u12cb\u1293 \u121d\u130d\u1266\u127d\n\n\u1241\u1325\u122d \u12ed\u120b\u12a9\u1362",
        "om": "\U0001f4c2 Ramaddii:\n1\ufe0f\u20e3 Dhugaatii\n2\ufe0f\u20e3 Nyaata salphaa\n3\ufe0f\u20e3 Meeshaa manaa\n4\ufe0f\u20e3 Kunuunsa dhuunfaa\n5\ufe0f\u20e3 Midhaani fi bu\u2019uuraa\n\nLakkoofsa ergaa.",
    },
    "cart_summary": {
        "en": "\U0001f6d2 Your cart:\n{items}\nTotal: ETB {total}\n\n\u2705 CHECKOUT \u2014 Place order\n\u270f\ufe0f EDIT \u2014 Change items\n\u274c CANCEL \u2014 Clear cart",
        "am": "\U0001f6d2 \u130b\u122a\u12ce:\n{items}\n\u12f5\u121d\u122d: \u1265\u122d {total}\n\n\u2705 \u12ad\u134d\u12eb \u2014 \u1275\u12d5\u12db\u12dd \u12eb\u1235\u1308\u1261\n\u270f\ufe0f \u12a0\u122d\u121d \u2014 \u12ed\u1240\u12ed\u1229\n\u274c \u12ed\u1245\u122d \u2014 \u130b\u122a \u12eb\u1325\u1349",
        "om": "\U0001f6d2 Gaarii kee:\n{items}\nWaliigala: ETB {total}\n\n\u2705 KAFALTII \u2014 Ajaja galchi\n\u270f\ufe0f SIRREESSI \u2014 Jijjiiri\n\u274c HAQUU \u2014 Gaarii qulqulleessi",
    },
    "order_confirmed": {
        "en": "\u2705 Order #{order_id} confirmed!\nDelivery: {window}\nThank you for ordering with SoukSync! \U0001f64f",
        "am": "\u2705 \u1275\u12d5\u12db\u12dd #{order_id} \u1270\u1228\u130b\u130d\u1327\u120d!\n\u121b\u12f5\u1228\u1235: {window}\n\u12a8 SoukSync \u130b\u122d \u1235\u1208\u1273\u12d8\u12d9 \u12a5\u1293\u1218\u1230\u130d\u1293\u1208\u1295! \U0001f64f",
        "om": "\u2705 Ajajni #{order_id} mirkanaa\u2019eera!\nGeejjiba: {window}\nSoukSync waliin ajajuu keessaniif galatoomaa! \U0001f64f",
    },
    "help": {
        "en": "\u2753 How can I help?\n\U0001f4e6 Order \u2014 Place a new order\n\U0001f4cb Reorder \u2014 Repeat last order\n\U0001f4b3 Credit \u2014 Check credit balance\n\U0001f4de Support \u2014 Talk to a person\n\nReply with a keyword or number.",
        "am": "\u2753 \u12a5\u1295\u12f4\u1275 \u120d\u1228\u12f3\u12ce?\n\U0001f4e6 \u1275\u12d5\u12db\u12dd \u2014 \u12a0\u12f2\u1235 \u1275\u12d5\u12db\u12dd \u12eb\u1235\u1308\u1261\n\U0001f4cb \u12f5\u1308\u121d \u2014 \u12eb\u1208\u1348\u12cd\u1295 \u1275\u12d5\u12db\u12dd \u12ed\u12f5\u1308\u1219\n\U0001f4b3 \u12ad\u122c\u12f2\u1275 \u2014 \u12ad\u122c\u12f2\u1275 \u1240\u122a \u12eb\u1228\u130b\u130d\u1321\n\U0001f4de \u12f5\u130b\u134d \u2014 \u12a8\u1230\u12cd \u130b\u122d \u12eb\u12cd\u1229\n\n\u1243\u120d \u12c8\u12ed\u121d \u1241\u1325\u122d \u12ed\u120b\u12a9\u1362",
        "om": "\u2753 Akkamittin si gargaaruu?\n\U0001f4e6 Ajaja \u2014 Ajaja haaraa galchi\n\U0001f4cb Irra deebi\u2019i \u2014 Ajaja darbe irra deebi\u2019i\n\U0001f4b3 Liqii \u2014 Haftee liqii ilaali\n\U0001f4de Deeggarsa \u2014 Nama waliin haasa\u2019i\n\nJecha ykn lakkoofsa ergi.",
    },
    "unknown": {
        "en": "\u26a0\ufe0f Sorry, I didn\u2019t understand that.\nTry: Order, Reorder, Credit, or Help.",
        "am": "\u26a0\ufe0f \u12ed\u1245\u122d\u1273\u1363 \u12a0\u120d\u1308\u1263\u129d\u121d\u1362\n\u12ed\u121e\u12ad\u1229: \u1275\u12d5\u12db\u12dd\u1363 \u12f5\u1308\u121d\u1363 \u12ad\u122c\u12f2\u1275\u1363 \u12c8\u12ed\u121d \u12a5\u1308\u12db\u1362",
        "om": "\u26a0\ufe0f Dhiifama, hin hubanne.\nYaali: Ajaja, Irra deebi\u2019i, Liqii, ykn Gargaarsa.",
    },
    "payment_choice": {
        "en": "Pay with:\n1\ufe0f\u20e3 Telebirr / M-Pesa (Pay Now)\n2\ufe0f\u20e3 BNPL (Buy Now, Pay Later)",
        "am": "\u12ad\u134d\u12eb:\n1\ufe0f\u20e3 \u1274\u120c\u1265\u122d / \u12a4\u121d-\u1354\u1233 (\u12a0\u1201\u1295 \u12ed\u12ad\u1348\u1209)\n2\ufe0f\u20e3 \u1283\u120b \u12ed\u12ad\u1348\u1209 (BNPL)",
        "om": "Kafaltii:\n1\ufe0f\u20e3 Telebirr / M-Pesa (Amma kafali)\n2\ufe0f\u20e3 BNPL (Amma fudhu, booda kafali)",
    },
}


LOCATIONS = {"1": "Mercato", "2": "Bole", "3": "Piassa"}
SHOP_TYPES = {"1": "Kiosk", "2": "Mini market", "3": "Wholesale"}

SAMPLE_PRODUCTS: dict[str, list[dict[str, str | int]]] = {
    "1": [
        {"name": "Coca-Cola 300ml", "price": 15},
        {"name": "Ambo Water 1L", "price": 20},
        {"name": "Pepsi 500ml", "price": 18},
    ],
    "2": [
        {"name": "Lays Chips", "price": 25},
        {"name": "Biscuit Pack", "price": 10},
        {"name": "Popcorn Bag", "price": 12},
    ],
    "3": [
        {"name": "Soap Bar", "price": 30},
        {"name": "Detergent 500g", "price": 45},
        {"name": "Cooking Oil 1L", "price": 120},
    ],
    "4": [
        {"name": "Toothpaste", "price": 35},
        {"name": "Shampoo 200ml", "price": 55},
    ],
    "5": [
        {"name": "Teff 1kg", "price": 80},
        {"name": "Rice 1kg", "price": 65},
        {"name": "Sugar 1kg", "price": 50},
    ],
}


def t(key: str, lang: str, **kwargs: str | int) -> str:
    """Get localized copy. Falls back to English."""
    template = COPY.get(key, {}).get(lang) or COPY.get(key, {}).get("en", key)
    if kwargs:
        return template.format(**kwargs)
    return template
