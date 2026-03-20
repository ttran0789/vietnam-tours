"""
Taxi distance calculation using Mapbox Directions API.
Geocodes Vietnam locations via Nominatim, then gets driving distance/time from Mapbox.
"""

import os
import math
import logging
import requests

logger = logging.getLogger(__name__)

# In-memory caches to avoid repeated API calls
_geocode_cache: dict = {}
_driving_cache: dict = {}

# Popular Vietnam locations for the dropdown
LOCATIONS = [
    "Can Tho",
    "Cao Bang",
    "Da Lat",
    "Da Nang",
    "Dong Van",
    "Ha Giang",
    "Ha Long Bay",
    "Hai Phong",
    "Hanoi",
    "Ho Chi Minh City",
    "Hoi An",
    "Hue",
    "Mai Chau",
    "Nha Trang",
    "Ninh Binh",
    "Phong Nha",
    "Phu Quoc",
    "Sapa",
]


def get_locations():
    """Return list of available locations."""
    return LOCATIONS


def geocode_location(location: str) -> dict | None:
    """Geocode a location using Nominatim (free, no API key)."""
    cache_key = location.lower().strip()
    if cache_key in _geocode_cache:
        return _geocode_cache[cache_key]

    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            'q': f"{location}, Vietnam",
            'format': 'json',
            'limit': 1,
        }
        headers = {'User-Agent': 'TravelVNTours-Taxi/1.0'}
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data:
            result = {'lat': float(data[0]['lat']), 'lon': float(data[0]['lon'])}
            _geocode_cache[cache_key] = result
            return result
    except Exception as e:
        logger.warning(f"Geocoding failed for {location}: {e}")

    return None


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in miles (fallback)."""
    R = 3959  # Earth's radius in miles
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def get_driving_distance(origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float) -> dict | None:
    """Get driving distance and duration using Mapbox Directions API."""
    cache_key = f"{origin_lat},{origin_lon}->{dest_lat},{dest_lon}"
    if cache_key in _driving_cache:
        return _driving_cache[cache_key]

    mapbox_token = os.getenv('MAPBOX_ACCESS_TOKEN')
    if not mapbox_token:
        logger.warning("MAPBOX_ACCESS_TOKEN not set, falling back to haversine")
        dist = haversine_distance(origin_lat, origin_lon, dest_lat, dest_lon)
        return {'distance_miles': round(dist * 1.3, 1), 'duration_hours': None, 'source': 'estimate'}

    try:
        # Mapbox expects lon,lat (not lat,lon)
        url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
        params = {
            'access_token': mapbox_token,
            'geometries': 'geojson',
            'overview': 'false',
        }
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get('routes') and len(data['routes']) > 0:
            route = data['routes'][0]
            distance_miles = round(route['distance'] / 1609.34, 1)
            duration_hours = round(route['duration'] / 3600, 1)
            result = {
                'distance_miles': distance_miles,
                'duration_hours': duration_hours,
                'source': 'mapbox',
            }
            _driving_cache[cache_key] = result
            logger.debug(f"Mapbox route: {distance_miles} mi, {duration_hours} hrs")
            return result
    except Exception as e:
        logger.warning(f"Mapbox routing failed: {e}, falling back to haversine")

    # Fallback: haversine * 1.3 to approximate road distance
    dist = haversine_distance(origin_lat, origin_lon, dest_lat, dest_lon)
    return {'distance_miles': round(dist * 1.3, 1), 'duration_hours': None, 'source': 'estimate'}


def get_distance(origin: str, destination: str) -> dict | None:
    """
    Full pipeline: geocode both locations, then get driving distance.
    Returns dict with distance_miles, duration_hours, source or None on failure.
    """
    origin_coords = geocode_location(origin)
    if not origin_coords:
        return None

    dest_coords = geocode_location(destination)
    if not dest_coords:
        return None

    return get_driving_distance(
        origin_coords['lat'], origin_coords['lon'],
        dest_coords['lat'], dest_coords['lon'],
    )
