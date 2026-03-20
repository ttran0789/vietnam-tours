# Predefined city-to-city distances and driving times in Vietnam
# Data sourced from Google Maps. Distances in miles, times in hours.
# Lookup is symmetric: (A, B) == (B, A)

DISTANCES = {
    ("Hanoi", "Ha Giang"): (190, 5.5),
    ("Hanoi", "Sapa"): (200, 5.5),
    ("Hanoi", "Ninh Binh"): (60, 2.0),
    ("Hanoi", "Ha Long Bay"): (105, 2.5),
    ("Hanoi", "Hai Phong"): (75, 2.0),
    ("Hanoi", "Mai Chau"): (90, 2.5),
    ("Hanoi", "Dong Van"): (220, 7.0),
    ("Hanoi", "Cao Bang"): (165, 5.0),
    ("Hanoi", "Phong Nha"): (300, 7.5),
    ("Ha Giang", "Dong Van"): (95, 3.5),
    ("Ha Giang", "Sapa"): (195, 6.0),
    ("Ha Giang", "Cao Bang"): (160, 5.0),
    ("Sapa", "Ha Long Bay"): (310, 8.0),
    ("Ninh Binh", "Phong Nha"): (240, 5.5),
    ("Ha Long Bay", "Hai Phong"): (40, 1.0),
    ("Ha Long Bay", "Sapa"): (310, 8.0),
}


def get_locations():
    """Return sorted list of all available locations."""
    locs = set()
    for (a, b) in DISTANCES:
        locs.add(a)
        locs.add(b)
    return sorted(locs)


def get_distance(origin: str, destination: str):
    """Return (distance_miles, driving_hours) or None if not found."""
    key = (origin, destination)
    if key in DISTANCES:
        return DISTANCES[key]
    rev = (destination, origin)
    if rev in DISTANCES:
        return DISTANCES[rev]
    return None
