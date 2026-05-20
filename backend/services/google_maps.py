from __future__ import annotations

import json
import math
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from dotenv import load_dotenv

from backend.schemas import ScenarioInput
from backend.services.mock_tools import get_weather_signal


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = PROJECT_ROOT / ".env"
TRACE_PATH = PROJECT_ROOT / "artifacts" / "google_api_trace.json"

load_dotenv(dotenv_path=ENV_PATH)

GOOGLE_MAPS_KEY_ENV = "GOOGLE_MAPS_API_KEY"
GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
WEATHER_URL = "https://weather.googleapis.com/v1/currentConditions:lookup"
ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"


FALLBACK_POINTS: dict[str, dict[str, Any]] = {
    "g-10 islamabad": {"lat": 33.6767, "lng": 73.0149, "formatted_address": "G-10, Islamabad, Pakistan"},
    "g-10": {"lat": 33.6767, "lng": 73.0149, "formatted_address": "G-10, Islamabad, Pakistan"},
    "g-10 markaz islamabad": {"lat": 33.6747, "lng": 73.0162, "formatted_address": "G-10 Markaz, Islamabad, Pakistan"},
    "islamabad": {"lat": 33.6844, "lng": 73.0479, "formatted_address": "Islamabad, Pakistan"},
    "g-6 markaz emergency centre, islamabad": {"lat": 33.7182, "lng": 73.0731, "formatted_address": "G-6 Markaz, Islamabad, Pakistan"},
    "g-6 markaz emergency centre": {"lat": 33.7182, "lng": 73.0731, "formatted_address": "G-6 Markaz, Islamabad, Pakistan"},
    "g-9 islamabad": {"lat": 33.6887, "lng": 73.0347, "formatted_address": "G-9, Islamabad, Pakistan"},
    "pims hospital islamabad": {"lat": 33.7048, "lng": 73.0551, "formatted_address": "PIMS Hospital, Islamabad, Pakistan"},
    "khayaban-e-iqbal": {"lat": 33.6816, "lng": 73.0225, "formatted_address": "Khayaban-e-Iqbal, Islamabad, Pakistan"},
    "margalla road sector crossing": {"lat": 33.6943, "lng": 73.0244, "formatted_address": "Margalla Road sector crossing, Islamabad, Pakistan"},
    "srinagar highway g-10 underpass": {"lat": 33.6841, "lng": 73.0176, "formatted_address": "Srinagar Highway G-10 underpass, Islamabad, Pakistan"},
    "peshawar ring road": {"lat": 34.0062, "lng": 71.5608, "formatted_address": "Peshawar Ring Road, Peshawar, Pakistan"},
    "peshawar ring road simulation depot": {"lat": 34.0149, "lng": 71.5785, "formatted_address": "Peshawar Ring Road simulation depot, Peshawar, Pakistan"},
    "university road diversion": {"lat": 34.0003, "lng": 71.5003, "formatted_address": "University Road, Peshawar, Pakistan"},
}


SCENARIO_MAP_CONFIGS: dict[str, dict[str, str]] = {
    "g10_urban_flooding": {
        "incident_location": "G-10 Islamabad",
        "weather_location": "G-10 Islamabad",
        "origin": "G-6 Markaz Emergency Centre, Islamabad",
        "destination": "G-10 Markaz Islamabad",
        "blocked_route": "Srinagar Highway G-10 underpass",
        "alternate_route_label": "Margalla Road alternate corridor",
        "crisis_label": "G-10 urban flooding",
        "rescue_label": "Rescue unit from G-6 Markaz",
        "rerouting_reason": "Floodwater and congestion around G-10 require avoiding the blocked underpass.",
    },
    "peshawar_ring_road_blast": {
        "incident_location": "Peshawar Ring Road",
        "weather_location": "Peshawar Ring Road",
        "origin": "Peshawar Ring Road Simulation Depot",
        "destination": "Peshawar Ring Road",
        "blocked_route": "Peshawar Ring Road",
        "alternate_route_label": "University Road diversion",
        "crisis_label": "Ring Road blast and blockage",
        "rescue_label": "Peshawar simulation response depot",
        "rerouting_reason": "Primary Ring Road segment is treated as sealed, so traffic is diverted around the blocked area.",
    },
    "ambulance_rain_congestion": {
        "incident_location": "Srinagar Highway G-10 underpass",
        "weather_location": "G-10 Islamabad",
        "origin": "G-9 Islamabad",
        "destination": "PIMS Hospital Islamabad",
        "blocked_route": "Srinagar Highway G-10 underpass",
        "alternate_route_label": "Khayaban-e-Iqbal emergency alternate",
        "crisis_label": "Ambulance delayed by rain and congestion",
        "rescue_label": "Ambulance reroute",
        "rerouting_reason": "Rain and congestion delay the ambulance near G-10, so the map shows an emergency alternate route.",
    },
}


def reset_google_api_trace() -> None:
    TRACE_PATH.parent.mkdir(parents=True, exist_ok=True)
    TRACE_PATH.write_text("[]", encoding="utf-8")


def geocode_location(location: str) -> dict[str, Any]:
    api_name = "Geocoding API"
    key = _google_maps_key()
    clean_location = location.strip()

    if not key:
        return _fallback_geocode(clean_location, "GOOGLE_MAPS_API_KEY is missing.")

    try:
        query = urlencode({"address": clean_location, "region": "pk", "key": key})
        payload = _request_json("GET", f"{GEOCODING_URL}?{query}")
        status = payload.get("status")
        results = payload.get("results") or []
        if status != "OK" or not results:
            raise RuntimeError(f"Google geocoding status={status or 'unknown'}")

        first = results[0]
        geometry = first.get("geometry", {}).get("location", {})
        lat = float(geometry["lat"])
        lng = float(geometry["lng"])
        result = {
            "location": clean_location,
            "lat": lat,
            "lng": lng,
            "formatted_address": first.get("formatted_address", clean_location),
            "source": "google_geocoding_api",
            "fallback_used": False,
        }
        _append_google_trace(
            api_name,
            {"location": clean_location},
            success=True,
            fallback_used=False,
            summarized_output={
                "formatted_address": result["formatted_address"],
                "lat": round(lat, 5),
                "lng": round(lng, 5),
            },
        )
        return result
    except Exception as exc:
        return _fallback_geocode(clean_location, f"{type(exc).__name__}: {exc}")


def get_google_weather_signal(location: str, scenario: ScenarioInput | None = None) -> dict[str, Any]:
    api_name = "Weather API"
    key = _google_maps_key()
    geocode = geocode_location(location)

    if not key:
        return _fallback_weather_signal(location, scenario, "GOOGLE_MAPS_API_KEY is missing.")

    try:
        query = urlencode(
            {
                "key": key,
                "location.latitude": geocode["lat"],
                "location.longitude": geocode["lng"],
                "unitsSystem": "METRIC",
            }
        )
        payload = _request_json("GET", f"{WEATHER_URL}?{query}")
        condition = payload.get("weatherCondition", {})
        description = condition.get("description", {})
        temperature = payload.get("temperature", {})
        precipitation = payload.get("precipitation", {})
        probability = precipitation.get("probability", {})
        qpf = precipitation.get("qpf", {})
        qpf_quantity = _float_or_zero(qpf.get("quantity"))
        probability_percent = _float_or_zero(probability.get("percent"))
        risk_level = _weather_risk_level(qpf_quantity, probability_percent, scenario)

        result = {
            "location": location,
            "resolved_location": geocode.get("formatted_address"),
            "lat": geocode["lat"],
            "lng": geocode["lng"],
            "condition": description.get("text") or condition.get("type") or "Unknown",
            "condition_type": condition.get("type", "UNKNOWN"),
            "temperature": _format_temperature(temperature),
            "temperature_celsius": _temperature_celsius(temperature),
            "precipitation": f"{qpf_quantity:g} mm / {probability_percent:g}%",
            "precipitation_mm": qpf_quantity,
            "precipitation_probability_percent": probability_percent,
            "rainfall_mm_per_hour": scenario.weather.rainfall_mm_per_hour if scenario else qpf_quantity,
            "risk_level": risk_level,
            "confidence": _weather_confidence(risk_level, source_is_google=True),
            "source": "google_weather_api",
            "fallback_used": False,
            "scenario_context_used": scenario is not None,
        }
        _append_google_trace(
            api_name,
            {"location": location, "lat": round(geocode["lat"], 5), "lng": round(geocode["lng"], 5)},
            success=True,
            fallback_used=False,
            summarized_output={
                "condition": result["condition"],
                "precipitation_mm": result["precipitation_mm"],
                "probability_percent": result["precipitation_probability_percent"],
                "risk_level": risk_level,
            },
        )
        return result
    except Exception as exc:
        return _fallback_weather_signal(location, scenario, f"{type(exc).__name__}: {exc}")


def get_google_route_data(
    origin: str | dict[str, Any],
    destination: str | dict[str, Any],
    blocked_route: str | None = None,
) -> dict[str, Any]:
    api_name = "Routes API"
    key = _google_maps_key()
    origin_point = _resolve_point(origin)
    destination_point = _resolve_point(destination)
    origin_label = _point_label(origin, origin_point)
    destination_label = _point_label(destination, destination_point)

    if not key:
        return _fallback_route_data(origin_point, destination_point, blocked_route, "GOOGLE_MAPS_API_KEY is missing.")

    try:
        body = {
            "origin": {"location": {"latLng": {"latitude": origin_point["lat"], "longitude": origin_point["lng"]}}},
            "destination": {
                "location": {"latLng": {"latitude": destination_point["lat"], "longitude": destination_point["lng"]}}
            },
            "travelMode": "DRIVE",
            "routingPreference": "TRAFFIC_AWARE",
            "computeAlternativeRoutes": True,
            "languageCode": "en-US",
            "units": "METRIC",
        }
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
        }
        payload = _request_json("POST", ROUTES_URL, body=body, headers=headers)
        routes = payload.get("routes") or []
        if not routes:
            raise RuntimeError("Google Routes API returned no routes.")

        normal_route = _route_from_google(
            routes[0],
            label=blocked_route or f"{origin_label} to {destination_label}",
            fallback_points=[_lat_lng(origin_point), _lat_lng(destination_point)],
            route_type="blocked",
        )
        if len(routes) > 1:
            alternate_route = _route_from_google(
                routes[1],
                label="Google alternate route",
                fallback_points=_alternate_polyline(origin_point, destination_point),
                route_type="alternate",
            )
        else:
            alternate_route = _fallback_route(
                _alternate_polyline(origin_point, destination_point),
                "Generated alternate route",
                "alternate",
                source="mock_geometry",
            )

        result = {
            "source": "google_routes_api",
            "fallback_used": False,
            "origin": origin_point,
            "destination": destination_point,
            "blocked_route": blocked_route or normal_route["label"],
            "normal_route": normal_route,
            "alternate_route": alternate_route,
            "estimated_travel_time": alternate_route["duration_text"],
            "distance": alternate_route["distance_text"],
            "rerouting_reason": (
                f"Route avoids {blocked_route} using alternate geometry."
                if blocked_route
                else "Traffic-aware alternate route requested from Google Routes API."
            ),
        }
        _append_google_trace(
            api_name,
            {"origin": origin_label, "destination": destination_label, "blocked_route": blocked_route},
            success=True,
            fallback_used=False,
            summarized_output={
                "routes_returned": len(routes),
                "normal_distance_m": normal_route["distance_meters"],
                "alternate_distance_m": alternate_route["distance_meters"],
            },
        )
        return result
    except Exception as exc:
        return _fallback_route_data(origin_point, destination_point, blocked_route, f"{type(exc).__name__}: {exc}")


def build_scenario_map_payload(
    scenario_id: str,
    scenario_name: str,
    scenario: ScenarioInput,
) -> dict[str, Any]:
    config = SCENARIO_MAP_CONFIGS.get(scenario_id) or _scenario_map_config_from_input(scenario_id, scenario_name, scenario)
    incident = geocode_location(config["incident_location"])
    origin = geocode_location(config["origin"])
    weather = get_google_weather_signal(config["weather_location"], scenario)
    route = get_google_route_data(config["origin"], config["destination"], config["blocked_route"])

    alternate_route = dict(route["alternate_route"])
    alternate_route["label"] = config["alternate_route_label"]
    route["alternate_route"] = alternate_route
    route["estimated_travel_time"] = alternate_route["duration_text"]
    route["distance"] = alternate_route["distance_text"]
    route["rerouting_reason"] = config["rerouting_reason"]

    generated_at = datetime.now(timezone.utc).isoformat()
    markers = {
        "crisis": {
            "label": config["crisis_label"],
            "position": _lat_lng(incident),
            "severity": weather["risk_level"],
        },
        "weather": {
            "label": f"Weather risk: {weather['risk_level']}",
            "position": _offset_point(_lat_lng(incident), 0.004, -0.003),
            "condition": weather["condition"],
        },
        "rescue": {
            "label": config["rescue_label"],
            "position": _lat_lng(origin),
            "status": "simulated_dispatch_ready",
        },
    }

    return {
        "scenario_id": scenario_id,
        "scenario_name": scenario_name,
        "generated_at": generated_at,
        "simulation_only": True,
        "center": _lat_lng(incident),
        "markers": markers,
        "blocked_route": route["normal_route"],
        "alternate_route": route["alternate_route"],
        "dispatch_route": route["alternate_route"],
        "route_intelligence": {
            "origin": config["origin"],
            "destination": config["destination"],
            "blocked_route": route["blocked_route"],
            "alternate_route": route["alternate_route"]["label"],
            "original_route_status": route["normal_route"]["route_type"],
            "alternate_route_status": route["alternate_route"]["route_type"],
            "estimated_travel_time": route["estimated_travel_time"],
            "distance": route["distance"],
            "rerouting_reason": route["rerouting_reason"],
            "source": route["source"],
            "fallback_used": route["fallback_used"],
        },
        "weather_intelligence": weather,
        "map_behavior": {
            "before_response": "Show crisis marker, weather marker, and blocked route in red.",
            "after_simulated_response": "Show rescue marker, alternate route in green, and dispatch path.",
        },
    }


def get_weather_update(location: str) -> dict[str, Any]:
    weather = get_google_weather_signal(location)
    return {
        "location": weather["location"],
        "condition": weather["condition"],
        "precipitation": weather.get("precipitation")
        or f"{weather.get('precipitation_mm', 0):g} mm / {weather.get('precipitation_probability_percent', 0):g}%",
        "temperature": weather.get("temperature", "unavailable"),
        "risk_level": weather["risk_level"],
        "confidence": weather["confidence"],
        "source": weather["source"],
        "fallback_used": weather["fallback_used"],
        "resolved_location": weather.get("resolved_location"),
        "lat": weather.get("lat"),
        "lng": weather.get("lng"),
    }


def get_route_update(origin: str, destination: str, blocked_area: str | None = None) -> dict[str, Any]:
    route = get_google_route_data(origin, destination, blocked_area)
    return {
        "origin": origin,
        "destination": destination,
        "blocked_area": blocked_area or route["blocked_route"],
        "original_route": _endpoint_route(route["normal_route"], "blocked" if blocked_area else "congested"),
        "alternate_route": _endpoint_route(route["alternate_route"], "recommended"),
        "rerouting_reason": route["rerouting_reason"],
        "source": route["source"],
        "fallback_used": route["fallback_used"],
    }


def _scenario_map_config_from_input(
    scenario_id: str,
    scenario_name: str,
    scenario: ScenarioInput,
) -> dict[str, str]:
    incident_location = scenario.weather.district or scenario.title
    blocked_route = scenario.traffic[0].road_name if scenario.traffic else incident_location
    location_hint = f"{incident_location} {scenario_name}".lower()
    origin = (
        "Peshawar Ring Road Simulation Depot"
        if "peshawar" in location_hint or "peshawr" in location_hint or "peshaw" in location_hint
        else "G-6 Markaz Emergency Centre, Islamabad"
    )
    return {
        "incident_location": incident_location,
        "weather_location": incident_location,
        "origin": origin,
        "destination": incident_location,
        "blocked_route": blocked_route,
        "alternate_route_label": "Recommended emergency alternate route",
        "crisis_label": scenario_name,
        "rescue_label": "Simulated rescue unit",
        "rerouting_reason": f"Custom scenario reroutes around {blocked_route} while preserving simulation-only safety.",
    }


def _endpoint_route(route: dict[str, Any], status: str) -> dict[str, Any]:
    return {
        "polyline": route.get("polyline", []),
        "distance": route.get("distance_text", "unknown"),
        "duration": route.get("duration_text", "unknown"),
        "status": status,
        "label": route.get("label", status),
    }


def _google_maps_key() -> str:
    return os.getenv(GOOGLE_MAPS_KEY_ENV, "").strip()


def _request_json(
    method: str,
    url: str,
    body: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
    timeout: int = 8,
) -> dict[str, Any]:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    request = Request(url=url, data=data, headers=headers or {}, method=method)
    try:
        with urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:240]
        raise RuntimeError(f"HTTP {exc.code}: {detail}") from exc
    except URLError as exc:
        raise RuntimeError(str(exc.reason)) from exc


def _fallback_geocode(location: str, reason: str) -> dict[str, Any]:
    point = _fallback_point(location)
    result = {
        "location": location,
        "lat": point["lat"],
        "lng": point["lng"],
        "formatted_address": point["formatted_address"],
        "source": "mock_fallback",
        "fallback_used": True,
        "fallback_reason": reason,
    }
    _append_google_trace(
        "Geocoding API",
        {"location": location},
        success=False,
        fallback_used=True,
        summarized_output={
            "formatted_address": result["formatted_address"],
            "lat": round(result["lat"], 5),
            "lng": round(result["lng"], 5),
            "reason": reason[:120],
        },
    )
    return result


def _fallback_weather_signal(location: str, scenario: ScenarioInput | None, reason: str) -> dict[str, Any]:
    mock = get_weather_signal(location, scenario)
    rainfall = _float_or_zero(mock.get("rainfall_mm_per_hour"))
    alert_level = int(mock.get("alert_level") or 0)
    risk_level = _risk_from_alert(rainfall, alert_level, bool(mock.get("alert_active")))
    result = {
        "location": location,
        "resolved_location": location,
        "lat": _fallback_point(location)["lat"],
        "lng": _fallback_point(location)["lng"],
        "condition": mock.get("alert_type") or "mock_weather",
        "condition_type": mock.get("alert_type") or "MOCK",
        "temperature": "unavailable",
        "temperature_celsius": None,
        "precipitation": f"{rainfall:g} mm / {80.0 if mock.get('alert_active') else 20.0:g}%",
        "precipitation_mm": rainfall,
        "precipitation_probability_percent": 80.0 if mock.get("alert_active") else 20.0,
        "rainfall_mm_per_hour": rainfall,
        "risk_level": risk_level,
        "confidence": _weather_confidence(risk_level, source_is_google=False),
        "source": "mock_fallback",
        "fallback_used": True,
        "fallback_reason": reason,
    }
    _append_google_trace(
        "Weather API",
        {"location": location},
        success=False,
        fallback_used=True,
        summarized_output={
            "condition": result["condition"],
            "rainfall_mm_per_hour": rainfall,
            "risk_level": risk_level,
            "reason": reason[:120],
        },
    )
    return result


def _fallback_route_data(
    origin: dict[str, Any],
    destination: dict[str, Any],
    blocked_route: str | None,
    reason: str,
) -> dict[str, Any]:
    normal_polyline = [_lat_lng(origin), _lat_lng(destination)]
    alternate_polyline = _alternate_polyline(origin, destination)
    normal_route = _fallback_route(normal_polyline, blocked_route or "Blocked route", "blocked", source="mock_fallback")
    alternate_route = _fallback_route(alternate_polyline, "Mock alternate route", "alternate", source="mock_fallback")
    result = {
        "source": "mock_fallback",
        "fallback_used": True,
        "fallback_reason": reason,
        "origin": origin,
        "destination": destination,
        "blocked_route": blocked_route or normal_route["label"],
        "normal_route": normal_route,
        "alternate_route": alternate_route,
        "estimated_travel_time": alternate_route["duration_text"],
        "distance": alternate_route["distance_text"],
        "rerouting_reason": f"Fallback mock route avoids {blocked_route or 'the blocked segment'}.",
    }
    _append_google_trace(
        "Routes API",
        {
            "origin": origin.get("formatted_address") or origin.get("location"),
            "destination": destination.get("formatted_address") or destination.get("location"),
            "blocked_route": blocked_route,
        },
        success=False,
        fallback_used=True,
        summarized_output={
            "normal_distance_m": normal_route["distance_meters"],
            "alternate_distance_m": alternate_route["distance_meters"],
            "reason": reason[:120],
        },
    )
    return result


def _append_google_trace(
    api_name: str,
    input_payload: dict[str, Any],
    success: bool,
    fallback_used: bool,
    summarized_output: dict[str, Any],
) -> None:
    TRACE_PATH.parent.mkdir(parents=True, exist_ok=True)
    try:
        existing = json.loads(TRACE_PATH.read_text(encoding="utf-8"))
        if not isinstance(existing, list):
            existing = []
    except (FileNotFoundError, json.JSONDecodeError):
        existing = []

    existing.append(
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "api_name": api_name,
            "input": input_payload,
            "success": success,
            "fallback_used": fallback_used,
            "summarized_output": summarized_output,
        }
    )
    TRACE_PATH.write_text(json.dumps(existing, indent=2, ensure_ascii=True), encoding="utf-8")


def _resolve_point(value: str | dict[str, Any]) -> dict[str, Any]:
    if isinstance(value, dict) and "lat" in value and "lng" in value:
        return value
    return geocode_location(str(value))


def _point_label(raw: str | dict[str, Any], point: dict[str, Any]) -> str:
    if isinstance(raw, str):
        return raw
    return str(point.get("formatted_address") or point.get("location") or "unknown")


def _route_from_google(
    route: dict[str, Any],
    label: str,
    fallback_points: list[dict[str, float]],
    route_type: str,
) -> dict[str, Any]:
    distance_meters = int(route.get("distanceMeters") or _polyline_distance_m(fallback_points))
    duration_seconds = _duration_to_seconds(str(route.get("duration") or "0s"))
    encoded = route.get("polyline", {}).get("encodedPolyline", "")
    polyline = _decode_polyline(encoded) if encoded else []
    if not polyline:
        polyline = fallback_points
    return {
        "label": label,
        "route_type": route_type,
        "distance_meters": distance_meters,
        "distance_text": _distance_text(distance_meters),
        "duration_seconds": duration_seconds or _duration_from_distance(distance_meters),
        "duration_text": _duration_text(duration_seconds or _duration_from_distance(distance_meters)),
        "encoded_polyline": encoded,
        "polyline": polyline,
        "source": "google_routes_api",
    }


def _fallback_route(
    polyline: list[dict[str, float]],
    label: str,
    route_type: str,
    source: str,
) -> dict[str, Any]:
    distance_meters = _polyline_distance_m(polyline)
    duration_seconds = _duration_from_distance(distance_meters)
    return {
        "label": label,
        "route_type": route_type,
        "distance_meters": distance_meters,
        "distance_text": _distance_text(distance_meters),
        "duration_seconds": duration_seconds,
        "duration_text": _duration_text(duration_seconds),
        "encoded_polyline": "",
        "polyline": polyline,
        "source": source,
    }


def _decode_polyline(encoded: str) -> list[dict[str, float]]:
    points: list[dict[str, float]] = []
    index = 0
    lat = 0
    lng = 0

    while index < len(encoded):
        result = 0
        shift = 0
        while True:
            byte = ord(encoded[index]) - 63
            index += 1
            result |= (byte & 0x1F) << shift
            shift += 5
            if byte < 0x20:
                break
        lat += ~(result >> 1) if result & 1 else result >> 1

        result = 0
        shift = 0
        while True:
            byte = ord(encoded[index]) - 63
            index += 1
            result |= (byte & 0x1F) << shift
            shift += 5
            if byte < 0x20:
                break
        lng += ~(result >> 1) if result & 1 else result >> 1
        points.append({"lat": lat / 1e5, "lng": lng / 1e5})

    return points


def _fallback_point(location: str) -> dict[str, Any]:
    normalized = location.strip().lower()
    if normalized in FALLBACK_POINTS:
        return FALLBACK_POINTS[normalized]
    for key, point in FALLBACK_POINTS.items():
        if key in normalized or normalized in key:
            return point
    if "peshawar" in normalized or "peshawr" in normalized or "peshaw" in normalized:
        return FALLBACK_POINTS["peshawar ring road"]
    return FALLBACK_POINTS["islamabad"]


def _lat_lng(point: dict[str, Any]) -> dict[str, float]:
    return {"lat": float(point["lat"]), "lng": float(point["lng"])}


def _offset_point(point: dict[str, float], lat_delta: float, lng_delta: float) -> dict[str, float]:
    return {"lat": round(point["lat"] + lat_delta, 6), "lng": round(point["lng"] + lng_delta, 6)}


def _alternate_polyline(origin: dict[str, Any], destination: dict[str, Any]) -> list[dict[str, float]]:
    start = _lat_lng(origin)
    end = _lat_lng(destination)
    lat_delta = end["lat"] - start["lat"]
    lng_delta = end["lng"] - start["lng"]
    offset_lat = 0.018 if abs(lat_delta) < 0.05 else 0.025
    offset_lng = -0.016 if abs(lng_delta) < 0.05 else 0.02
    return [
        start,
        {"lat": round(start["lat"] + lat_delta * 0.35 + offset_lat, 6), "lng": round(start["lng"] + lng_delta * 0.35 + offset_lng, 6)},
        {"lat": round(start["lat"] + lat_delta * 0.7 + offset_lat, 6), "lng": round(start["lng"] + lng_delta * 0.7 + offset_lng, 6)},
        end,
    ]


def _polyline_distance_m(polyline: list[dict[str, float]]) -> int:
    if len(polyline) < 2:
        return 0
    return int(sum(_haversine_m(polyline[index - 1], polyline[index]) for index in range(1, len(polyline))))


def _haversine_m(start: dict[str, float], end: dict[str, float]) -> float:
    radius_m = 6_371_000
    lat1 = math.radians(start["lat"])
    lat2 = math.radians(end["lat"])
    delta_lat = math.radians(end["lat"] - start["lat"])
    delta_lng = math.radians(end["lng"] - start["lng"])
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lng / 2) ** 2
    return radius_m * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _duration_from_distance(distance_meters: int) -> int:
    meters_per_second = 9.72
    return max(180, int(distance_meters / meters_per_second))


def _duration_to_seconds(duration: str) -> int:
    if duration.endswith("s"):
        try:
            return int(float(duration[:-1]))
        except ValueError:
            return 0
    return 0


def _distance_text(distance_meters: int) -> str:
    if distance_meters >= 1000:
        return f"{distance_meters / 1000:.1f} km"
    return f"{distance_meters} m"


def _duration_text(seconds: int) -> str:
    minutes = max(1, round(seconds / 60))
    return f"{minutes} min"


def _float_or_zero(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _temperature_celsius(temperature: dict[str, Any]) -> float | None:
    value = temperature.get("degrees")
    if value is None:
        value = temperature.get("value")
    try:
        return round(float(value), 1)
    except (TypeError, ValueError):
        return None


def _format_temperature(temperature: dict[str, Any]) -> str:
    degrees = _temperature_celsius(temperature)
    if degrees is None:
        return "unavailable"
    unit = str(temperature.get("unit") or "C").replace("CELSIUS", "C")
    return f"{degrees:g} {unit}"


def _weather_risk_level(precipitation_mm: float, probability_percent: float, scenario: ScenarioInput | None) -> str:
    scenario_rainfall = scenario.weather.rainfall_mm_per_hour if scenario else 0.0
    scenario_alert = scenario.weather.alert_active if scenario else False
    scenario_alert_level = scenario.weather.alert_level if scenario else 0
    if precipitation_mm >= 10 or probability_percent >= 70 or scenario_rainfall >= 8 or scenario_alert_level >= 3:
        return "high"
    if precipitation_mm >= 2 or probability_percent >= 40 or scenario_rainfall >= 5 or scenario_alert:
        return "medium"
    return "low"


def _risk_from_alert(rainfall: float, alert_level: int, alert_active: bool) -> str:
    if rainfall >= 8 or alert_level >= 3:
        return "high"
    if rainfall >= 5 or alert_active:
        return "medium"
    return "low"


def _weather_confidence(risk_level: str, source_is_google: bool) -> float:
    base = {"high": 0.82, "medium": 0.72, "low": 0.58}.get(risk_level, 0.55)
    return round(base if source_is_google else min(base, 0.66), 2)
