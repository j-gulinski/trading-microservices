INSTRUMENT_CATALOG = {
    "ACME": {
        "asset_class": "EQUITY",
        "currency": "USD"
    },
    "EURUSD": {
        "asset_class": "FX",
        "currency": "USD",
        "tenor_years": 1.0
    },
    "GOVT_2Y": {
        "asset_class": "BOND",
        "currency": "USD",
        "coupon_rate": 0.04,
        "maturity_years": 2,
        "payments_per_year": 1,
        "face_value": 1000,
        "curve": "USD_GOV",
    },
    "GOVT_5Y": {
        "asset_class": "BOND",
        "currency": "USD",
        "coupon_rate": 0.05,
        "maturity_years": 5,
        "payments_per_year": 1,
        "face_value": 1000,
        "curve": "USD_GOV",
    },
    "XAUUSD": {
        "asset_class": "COMMODITY",
        "currency": "USD"
    },
    "ES_FUT": {
        "asset_class": "FUTURES",
        "currency": "USD",
        "multiplier": 50
    },
    "ACME_CALL_100": {
        "asset_class": "EUROPEAN_OPTION",
        "currency": "USD",
        "underlying_symbol": "ACME",
        "option_type": "CALL",
        "strike": 100.0,
        "maturity_years": 0.5,
        "curve": "USD_GOV",
    },
    "ACME_PUT_100": {
        "asset_class": "EUROPEAN_OPTION",
        "currency": "USD",
        "underlying_symbol": "ACME",
        "option_type": "PUT",
        "strike": 100.0,
        "maturity_years": 0.5,
        "curve": "USD_GOV",
    },
}