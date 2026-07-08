from decimal import Decimal

from app import cache
from app.schemas import ScenarioRequest
from shared.pricing_math import black_scholes_price, bond_pv, fx_forward, rate_at


def _shocked_bond_pv(meta: dict, curve: dict, shock_bps: float) -> float:
    bump = shock_bps / 10000.0
    bumped = {"tenors": curve["tenors"], "rates": [r + bump for r in curve["rates"]]}
    return bond_pv(meta, bumped)


def _option_premium(meta: dict, spot_shock: float = 0.0) -> float | None:
    spot = cache.get_spot(meta.get("underlying_symbol"))
    curve = cache.get_curve(meta.get("curve", "USD_GOV"))
    if not spot or spot.get("implied_vol") is None or not curve:
        return None
    underlying = spot.get("mid") or spot.get("last") or spot.get("spot")
    if underlying is None:
        return None
    T = float(meta["maturity_years"])
    r = rate_at(curve["tenors"], curve["rates"], T)
    return black_scholes_price(float(underlying) * (1 + spot_shock), float(meta["strike"]),
                               r, float(spot["implied_vol"]), T, meta["option_type"])


def _base_price_from_cache(inst) -> Decimal | None:
    if inst.asset_class in ("EQUITY", "COMMODITY", "FUTURES"):
        spot = cache.get_spot(inst.symbol)
        if not spot:
            return None
        raw = spot.get("spot") or spot.get("mid") or spot.get("last")
        return Decimal(str(raw)) if raw is not None else None

    if inst.asset_class == "FX":
        spot = cache.get_spot(inst.symbol)
        if not spot or spot.get("spot") is None:
            return None
        s = Decimal(str(spot["spot"]))
        rd = Decimal(str(spot.get("domestic_rate", 0.0)))
        rf = Decimal(str(spot.get("foreign_rate", 0.0)))
        T = Decimal(str(inst.meta.get("tenor_years", 1.0)))
        return fx_forward(s, rd, rf, T)

    if inst.asset_class == "BOND":
        curve = cache.get_curve(inst.meta.get("curve", "USD_GOV"))
        if not curve:
            return None
        return Decimal(str(bond_pv(inst.meta, curve)))

    if inst.asset_class == "EUROPEAN_OPTION":
        premium = _option_premium(inst.meta)
        return Decimal(str(round(premium, 4))) if premium is not None else None

    return None


def _multiplier(inst) -> int:
    if inst.asset_class == "FUTURES":
        return int(inst.meta.get("multiplier", 1))
    return 1


def _shocked_price(inst, base_price: Decimal, shock: float) -> Decimal | None:
    if inst.asset_class in ("EQUITY", "COMMODITY", "FUTURES", "FX"):
        return base_price * Decimal(str(1 + shock))

    if inst.asset_class == "BOND":
        curve = cache.get_curve(inst.meta.get("curve", "USD_GOV"))
        if not curve:
            return None
        rate_impact = Decimal(str(_shocked_bond_pv(inst.meta, curve, shock))) - Decimal(str(bond_pv(inst.meta, curve)))
        return base_price + rate_impact

    if inst.asset_class == "EUROPEAN_OPTION":
        base = _option_premium(inst.meta)
        shocked = _option_premium(inst.meta, spot_shock=shock)
        if base is None or shocked is None:
            return None
        return base_price + Decimal(str(round(shocked - base, 4)))

    return None


def run_scenario(req: ScenarioRequest) -> dict | None:
    inst = req.position.instrument
    pos = req.position

    base_price = inst.current_price if inst.current_price is not None else _base_price_from_cache(inst)
    if base_price is None:
        return None

    shocked_price = _shocked_price(inst, base_price, req.shock)
    if shocked_price is None:
        return None

    multiplier = _multiplier(inst)
    direction = Decimal(-1) if pos.side == "SELL" else Decimal(1)

    entry_value = pos.trade_price * pos.quantity * multiplier
    base_value = base_price * pos.quantity * multiplier
    scenario_value = shocked_price * pos.quantity * multiplier

    base_pnl = (base_value - entry_value) * direction
    scenario_pnl = (scenario_value - base_value) * direction
    current_pnl = base_pnl + scenario_pnl

    return {
        "asset_class": inst.asset_class,
        "symbol": inst.symbol,
        "side": pos.side,
        "open_value": entry_value,
        "shock": req.shock,
        "base": {"price": base_price, "value": base_value, "base_pnl": base_pnl},
        "scenario": {"price": shocked_price, "value": scenario_value, "scenario_pnl": scenario_pnl},
        "base_pnl": base_pnl,
        "scenario_pnl": scenario_pnl,        
        "current_pnl": current_pnl,
    }
