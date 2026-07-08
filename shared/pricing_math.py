from math import erf, exp, log, sqrt


def normal_cdf(x):
    return 0.5 * (1.0 + erf(x / sqrt(2.0)))


def black_scholes_price(spot, strike, rate, vol, maturity_years, option_type):
    if maturity_years <= 0 or vol <= 0:
        intrinsic = spot - strike * exp(-rate * max(maturity_years, 0.0))
        return max(intrinsic, 0.0) if option_type == "CALL" else max(-intrinsic, 0.0)
    d1 = (log(spot / strike) + (rate + vol * vol / 2.0) * maturity_years) / (vol * sqrt(maturity_years))
    d2 = d1 - vol * sqrt(maturity_years)
    if option_type == "PUT":
        return strike * exp(-rate * maturity_years) * normal_cdf(-d2) - spot * normal_cdf(-d1)
    return spot * normal_cdf(d1) - strike * exp(-rate * maturity_years) * normal_cdf(d2)


def fx_forward(spot, domestic_rate, foreign_rate, tenor_years):
    return spot * (1 + domestic_rate * tenor_years) / (1 + foreign_rate * tenor_years)


def rate_at(tenors, rates, t):
    if t <= tenors[0]:
        return rates[0]
    if t >= tenors[-1]:
        return rates[-1]
    for i in range(1, len(tenors)):
        if t <= tenors[i]:
            t0, t1, r0, r1 = tenors[i - 1], tenors[i], rates[i - 1], rates[i]
            return r0 + (r1 - r0) * (t - t0) / (t1 - t0)
    return rates[-1]


def discount_factor(tenors, rates, t):
    return 1.0 / (1 + rate_at(tenors, rates, t)) ** t


def bond_pv(meta, curve):
    face = meta["face_value"]
    ppy = meta["payments_per_year"]
    periods = int(meta["maturity_years"] * ppy)
    coupon = face * meta["coupon_rate"] / ppy
    pv = 0.0
    for i in range(1, periods + 1):
        t = i / ppy
        cashflow = coupon + (face if i == periods else 0.0)
        pv += cashflow * discount_factor(curve["tenors"], curve["rates"], t)
    return pv
