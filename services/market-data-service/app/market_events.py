from copy import deepcopy

from app import persistence
from app.publisher import publish_tick
from shared.functions import get_iso_timestamp


_EVENT_SPECS = {
    "market_tick": {
        "kind": "spot",
        "key": "symbol",
        "required": ("symbol", "asset_class"),
    },
    "curve_tick": {
        "kind": "curve",
        "key": "curve_name",
        "required": ("curve_name", "curve_type", "tenors", "rates"),
    },
}


def publish_market_event(event_type: str, payload: dict, *, source: str = "SIMULATED") -> dict:
    spec = _EVENT_SPECS.get(event_type)
    if spec is None:
        raise ValueError(f"Unsupported market event type: {event_type}")
    if not isinstance(payload, dict):
        raise ValueError("Market event payload must be an object")

    event = deepcopy(payload)
    for field in spec["required"]:
        if event.get(field) in (None, ""):
            raise ValueError(f"Market event missing {field}")

    if event_type == "curve_tick":
        tenors = event["tenors"]
        rates = event["rates"]
        if not isinstance(tenors, list) or not isinstance(rates, list) or len(tenors) != len(rates):
            raise ValueError("Curve tenors and rates must be equally sized lists")

    source_name = str(event.get("source") or source).strip()
    if not source_name:
        raise ValueError("Market event source must not be empty")
    event["source"] = source_name

    key = event[spec["key"]]
    with persistence.data_lock:
        event.setdefault("stream_id", persistence.stream_id)
        event.setdefault("event_id", persistence.ticks_generated)
        event.setdefault("event_time", get_iso_timestamp())
        persistence.ticks_generated += 1
        persistence.last_event_timestamp = event["event_time"]
        persistence.update_state(spec["kind"], key, event)

    persistence.persist(spec["kind"], event)
    publish_tick(event_type, event)
    return event
