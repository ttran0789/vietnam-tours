import json
from database import engine, SessionLocal, Base
from models import Tour, User, TransportRoute
from auth import hash_password

# Prices include 20% markup from QT Motorbikes & Tours base prices
TOURS = [
    {
        "name": "Ha Giang Loop Motorbike Tour",
        "slug": "ha-giang-motorbike-4d3n",
        "description": "An immersive 420km motorcycle journey through Vietnam's northern highlands. Explore the Dong Van Karst Plateau Geopark with a perfect balance of riding, trekking, and cultural experiences. Ride through dramatic mountain passes, stay with ethnic minority families, and witness some of the most breathtaking scenery in Southeast Asia.",
        "highlights": json.dumps([
            "420km ride through Ha Giang's legendary mountain roads",
            "Quan Ba Heaven's Gate and Fairy Twin Mountains",
            "Ma Pi Leng Pass - Vietnam's most dramatic mountain pass",
            "Lung Cu Flag Tower - Vietnam's northernmost point",
            "Dong Van Karst Plateau UNESCO Global Geopark",
            "Authentic ethnic minority homestay experiences",
            "100-year-old Vuong Chinh Duc Palace at Sa Phin",
            "Lung Khuy Cave exploration",
            "Local Vietnamese cuisine at every meal"
        ]),
        "duration": "4 Days 3 Nights",
        "price": 235.00,  # $196 * 1.2
        "location": "Ha Giang",
        "image_url": "/images/ha-giang-loop.jpg",
        "max_group_size": 25,
        "difficulty": "Moderate",
        "itinerary": json.dumps([
            {"day": 1, "title": "Ha Giang → Quan Ba → Du Gia (120km)", "description": "Depart Ha Giang City northward via the 'Road of Happiness.' Climb Quan Ba Pass to Heaven's Gate with panoramic views of the Fairy Twin Mountains. Lunch in Tam Son area. Evening homestay with an ethnic minority family in Du Gia village."},
            {"day": 2, "title": "Du Gia → Meo Vac → Ma Pi Leng → Dong Van (110km)", "description": "Traverse stunning mountain passes toward Meo Vac for lunch. Ascend the majestic Ma Pi Leng Pass with views of the Nho Que River canyon far below. Arrive in Vietnam's northernmost town of Dong Van. Optional visit to French fort ruins for panoramic views."},
            {"day": 3, "title": "Dong Van → Lung Cu → Sa Phin → Nam Dam (150km)", "description": "Visit the Sunday market if available. Travel to Lung Cu flagpole at Vietnam's northernmost point. Explore the 100-year-old Vuong Chinh Duc Palace at Sa Phin. Descend the Highland of Stone through pine forests and rice terraces. Evening with Dao ethnic family in Nam Dam."},
            {"day": 4, "title": "Nam Dam → Lung Khuy → Ha Giang (70km)", "description": "Morning village exploration and waterfall visit. Explore the spectacular Lung Khuy Cave. Lunch in Tam Son. Return via scenic side-loop to Ha Giang City by late afternoon."}
        ]),
        "included": json.dumps([
            "English-speaking tour guide",
            "Quality Japanese motorcycle with full damage insurance",
            "All fuel costs",
            "3 nights accommodation (homestay & hotel mix)",
            "All meals (breakfast, lunch, dinner)",
            "Safety gear (helmet, knee/elbow pads, rain clothes)",
            "All entrance fees and tickets",
            "Luggage storage and transport",
            "Free dorm bed at guest house for night bus arrivals"
        ]),
        "not_included": json.dumps([
            "Travel to/from Ha Giang City",
            "Gratuities and tips",
            "Alcoholic beverages",
            "Personal expenses",
            "Travel insurance"
        ]),
    },
    {
        "name": "Ha Giang Loop Express",
        "slug": "ha-giang-motorbike-3d2n",
        "description": "The fast-paced version of the legendary Ha Giang Loop for travelers with limited time. Cover the complete 420km loop in 3 action-packed days through limestone peaks, ethnic villages, and open mountain roads. No time for lazy mornings — just pure northern frontier adventure.",
        "highlights": json.dumps([
            "Complete 420km Ha Giang Loop in 3 days",
            "Quan Ba Heaven's Gate viewpoint",
            "Ma Pi Leng Pass — the king of all passes",
            "Dong Van Karst Plateau Geopark",
            "Ethnic minority homestay experience",
            "Vuong Chinh Duc Palace at Sa Phin",
            "Highland of Stone descent"
        ]),
        "duration": "3 Days 2 Nights",
        "price": 170.00,  # $142 * 1.2
        "location": "Ha Giang",
        "image_url": "/images/ha-giang-express.jpg",
        "max_group_size": 25,
        "difficulty": "Moderate to Challenging",
        "itinerary": json.dumps([
            {"day": 1, "title": "Ha Giang → Quan Ba → Du Gia (120km)", "description": "Depart after breakfast, climb Quan Ba Mountain Pass, pass through Heaven's Gate and the Fairy Hills. Lunch near Tam Son then venture deep into the mountains to Du Gia village. Overnight at an ethnic minority family homestay."},
            {"day": 2, "title": "Du Gia → Meo Vac → Ma Pi Leng → Dong Van (150km)", "description": "Travel through magnificent mountain passes to Meo Vac for lunch. Ascend the majestic Ma Pi Leng Pass with jaw-dropping canyon views. Continue to Dong Van with optional visit to French fort ruins. Overnight in hotel or homestay."},
            {"day": 3, "title": "Dong Van → Sa Phin → Yen Minh → Ha Giang (150km)", "description": "Visit the 100-year-old Vuong Chinh Duc Palace. Descend the Highland of Stone through pine forests and terraced rice fields. Lunch in Yen Minh. Return over Quan Ba Pass to Ha Giang City."}
        ]),
        "included": json.dumps([
            "English-speaking tour guide",
            "Quality Japanese motorcycle with full damage insurance",
            "All fuel costs",
            "2 nights accommodation (homestay & hotel mix)",
            "All meals (breakfast, lunch, dinner)",
            "Safety gear (helmet, knee/elbow pads, rain clothes)",
            "All entrance fees and tickets",
            "Luggage storage and bungee cords",
            "Free dorm bed at guest house for night bus arrivals"
        ]),
        "not_included": json.dumps([
            "Travel to/from Ha Giang City",
            "Gratuities and tips",
            "Alcoholic beverages",
            "Personal expenses",
            "Travel insurance"
        ]),
    },
    {
        "name": "The Big Loop — Ba Be, Cao Bang & Ha Giang",
        "slug": "big-loop-6d5n",
        "description": "The ultimate northern Vietnam adventure. This epic 6-day journey covers Ba Be Lake, Ban Gioc Waterfall on the Chinese border, Nguom Ngao Cave, and the complete Ha Giang Loop including Ma Pi Leng Pass and Lung Cu. For travelers who want to see it all.",
        "highlights": json.dumps([
            "Ba Be Lake — full day boat exploration",
            "Ban Gioc Waterfall — 300m wide on the Vietnam-China border",
            "Nguom Ngao Cave — 2,144m of underground formations",
            "Ma Pi Leng Pass and Nho Que River canyon",
            "Lung Cu Flag Tower — Vietnam's northernmost point",
            "Vuong Chinh Duc H'mong King Palace",
            "Multiple ethnic minority homestays",
            "Dong Van Sunday Market (timing dependent)",
            "Snake Pass through Cao Bang province"
        ]),
        "duration": "6 Days 5 Nights",
        "price": 587.00,  # $489 * 1.2
        "location": "Ha Giang, Ba Be, Cao Bang",
        "image_url": "/images/big-loop.jpg",
        "max_group_size": 10,
        "difficulty": "Challenging",
        "itinerary": json.dumps([
            {"day": 1, "title": "Ha Giang → Ba Be Lake (245km)", "description": "Depart Ha Giang via Highway QL 2 to Viet Quang, then road TL 279 through Na Hang. Cross a spectacular mountain pass before reaching Cho Ra and descending to Ba Be Lake. Overnight homestay with dinner."},
            {"day": 2, "title": "Ba Be Lake Exploration", "description": "Full day exploring Ba Be Lake by boat. Visit waterfalls, rivers, valleys, and caves around Vietnam's largest natural lake. All meals provided at the homestay. A peaceful day on the water."},
            {"day": 3, "title": "Ba Be → Ban Gioc Waterfall (205km)", "description": "Travel northward through the famous Snake Pass. Lunch in Cao Bang City. Continue to the Chinese border where the magnificent Ban Gioc Waterfall spans 300 meters across two countries. Overnight in a Nung ethnic homestay."},
            {"day": 4, "title": "Ban Gioc → Bao Lac (210km)", "description": "Morning visit to Nguom Ngao Cave with its 2,144 meters of underground stalactites and stalagmites. Afternoon ride through scenic mountain landscape to Bao Lac. Hotel overnight."},
            {"day": 5, "title": "Bao Lac → Dong Van (145km)", "description": "Travel via the QL 4C 'Road of Happiness' through Meo Vac. Ascend the legendary Ma Pi Leng Pass. Visit Lung Cu at Vietnam's northernmost point with its iconic flagpole tower. Overnight in Dong Van."},
            {"day": 6, "title": "Dong Van → Ha Giang (150km)", "description": "Optional Sunday market visit. Stop at Sa Phin to explore the 100-year-old H'mong Palace. Descend through pine forests and rice terraces via Yen Minh and Tam Son. Cross Quan Ba Mountain Pass back to Ha Giang City."}
        ]),
        "included": json.dumps([
            "English-speaking tour guide",
            "Quality Japanese motorcycle with full damage insurance",
            "All fuel costs",
            "5 nights accommodation (homestays & hotels)",
            "All meals (Vietnamese local cuisine)",
            "Drinking water, soft drinks, coffee",
            "Safety gear (helmet, knee/elbow pads, rain clothes)",
            "All entrance fees and tickets",
            "Luggage storage and bungee cords",
            "Free dorm bed at guest house for night bus arrivals"
        ]),
        "not_included": json.dumps([
            "Travel to/from Ha Giang City",
            "Gratuities and tips",
            "Alcoholic beverages",
            "Personal expenses",
            "Travel insurance"
        ]),
    },
    {
        "name": "Ha Giang Loop Jeep Tour",
        "slug": "ha-giang-jeep-4d3n",
        "description": "Experience the Ha Giang Loop from the comfort of a vintage open-air military jeep. 4 days of gentle adventure through limestone peaks, quiet valleys, and villages where time moves differently. Perfect for travelers who want the scenery without riding a motorbike.",
        "highlights": json.dumps([
            "Open-air vintage military jeep with local driver",
            "Bac Sum Pass and Quan Ba Heaven's Gate",
            "Twin Fairy Mountains panoramic views",
            "Nam Dam Dao village and Lung Tam H'mong weaving community",
            "H'mong King's Palace at Sa Phin",
            "Lung Cu Flag Tower — Vietnam's northernmost point",
            "Ma Pi Leng Pass cliff-side route",
            "Optional Nho Que River boat ride through Tu San Canyon",
            "Dong Van Old Quarter overnight",
            "Du Gia village family homestay"
        ]),
        "duration": "4 Days 3 Nights",
        "price": 599.00,  # $499 * 1.2
        "location": "Ha Giang",
        "image_url": "/images/ha-giang-jeep.jpg",
        "max_group_size": 8,
        "difficulty": "Easy",
        "itinerary": json.dumps([
            {"day": 1, "title": "Ha Giang → Yen Minh", "description": "Climb Bac Sum Pass into the Dong Van Karst Plateau Geopark. Stop at Quan Ba Heaven's Gate for views of the Twin Fairy Mountains. Pass through Nam Dam Dao village and Lung Tam H'mong weaving community. End the day in the Yen Minh valley."},
            {"day": 2, "title": "Yen Minh → Dong Van", "description": "Cross the dramatic Tham Ma Pass. Tour the H'mong King's Palace at Sa Phin. Visit Lung Cu Flag Tower at Vietnam's northernmost point. Stop in Lo Lo Chai Village. Overnight in the charming Dong Van Old Quarter."},
            {"day": 3, "title": "Dong Van → Du Gia", "description": "Navigate the legendary Ma Pi Leng Pass with dramatic cliff-side views above the Nho Que River and Tu San Canyon. Optional boat ride on the river. Lunch in Meo Vac with optional market visit. Stay with a local family in Du Gia."},
            {"day": 4, "title": "Du Gia → Ha Giang", "description": "Drive through Duong Thuong Valley and Thai An Road. Return to Ha Giang City by early afternoon. Transfer back to Hanoi."}
        ]),
        "included": json.dumps([
            "Vintage open-air jeep with experienced local driver",
            "English-speaking tour guide",
            "3 nights accommodation (private rooms in homestays & hotels)",
            "All meals (4 breakfasts, 4 lunches, 3 dinners)",
            "All entrance fees",
            "Bottled water throughout the trip"
        ]),
        "not_included": json.dumps([
            "Hanoi–Ha Giang transfer (can be arranged)",
            "Personal expenses and additional beverages",
            "Travel insurance",
            "Tips for driver and guide (optional)",
            "Nho Que River boat ride (optional extra)"
        ]),
    },
    {
        "name": "Ha Giang Loop Jeep Express",
        "slug": "ha-giang-jeep-3d2n",
        "description": "An open-air jeep adventure through northern Vietnam's Dong Van Karst Plateau in 3 days. Ride in military-style jeeps through limestone peaks, quiet valleys, and villages where time moves differently. Nothing standard about this experience — winding through some of the most dramatic scenery in Asia.",
        "highlights": json.dumps([
            "Open-air military jeep with professional local driver",
            "Pac Sum Pass into the Geopark",
            "Quan Ba Heaven's Gate and Twin Fairy Peaks",
            "Nam Dam Tay ethnic village",
            "Sung La Valley and Dong Van Old Quarter",
            "Ma Pi Leng Pass above Nho Que River and Tu San Canyon",
            "Meo Vac market (timing dependent)",
            "Du Gia Village waterfall walks",
            "Lung Tam Village H'mong hand-weaving"
        ]),
        "duration": "3 Days 2 Nights",
        "price": 410.00,  # $342 * 1.2
        "location": "Ha Giang",
        "image_url": "/images/ha-giang-jeep-express.jpg",
        "max_group_size": 8,
        "difficulty": "Easy",
        "itinerary": json.dumps([
            {"day": 1, "title": "Ha Giang → Quan Ba → Dong Van", "description": "Climb Pac Sum Pass into the Dong Van Karst Plateau Geopark. Stop at Quan Ba Heaven's Gate to view the Twin Fairy Peaks. Pass through Nam Dam Tay ethnic village. Cross Tham Ma Pass through Sung La Valley. Evening arrival in the charming Dong Van Old Quarter."},
            {"day": 2, "title": "Dong Van → Ma Pi Leng → Du Gia", "description": "Navigate the legendary Ma Pi Leng Pass high above the Nho Que River and Tu San Canyon. Visit Meo Vac market if timing aligns. Continue south via backroads to Du Gia Village. Afternoon waterfall walks or local family visits."},
            {"day": 3, "title": "Du Gia → Lung Tam → Ha Giang", "description": "Morning visit to Lung Tam Village to watch H'mong hand-weaving demonstrations. Return via Pac Sum Pass to Ha Giang City for lunch. Afternoon rest before evening transfer back to Hanoi."}
        ]),
        "included": json.dumps([
            "Open-air military jeep with professional local driver",
            "English-speaking tour guide",
            "Round-trip Hanoi–Ha Giang transfer (VIP or cabin bus)",
            "2 nights accommodation (private rooms in homestays & hotels)",
            "All meals (3 breakfasts, 3 lunches, 2 dinners)",
            "All entrance fees and tickets",
            "Drinking water throughout the trip",
            "Basic travel insurance"
        ]),
        "not_included": json.dumps([
            "Personal expenses and additional drinks",
            "Extended travel insurance",
            "Gratuities for driver and guide (optional)"
        ]),
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    existing = db.query(Tour).count()
    if existing == 0:
        for tour_data in TOURS:
            tour = Tour(**tour_data)
            db.add(tour)
        print(f"Seeded {len(TOURS)} tours.")

    # Create default admin user
    if not db.query(User).filter(User.email == "tuantran2@gmail.com").first():
        admin = User(
            email="tuantran2@gmail.com",
            name="Tuan Tran",
            hashed_password=hash_password("admin123"),
            is_admin=True,
        )
        db.add(admin)
        print("Created admin user: tuantran2@gmail.com")

    # Seed transport routes
    if db.query(TransportRoute).count() == 0:
        routes = [
            TransportRoute(
                origin="Hanoi",
                destination="Ha Giang",
                slug="hanoi-to-ha-giang",
                description="Overnight sleeper bus from Hanoi Old Quarter to Ha Giang City. Comfortable limousine-style seats, blankets, water, and WiFi included. Departs evening, arrives early morning.",
                price=200.00,
                duration="6-7 hours",
                vehicle_type="Limousine Sleeper Bus",
                included=json.dumps(["Reclining sleeper seat", "Blanket & pillow", "Bottled water", "WiFi on board", "Hotel/hostel pickup in Old Quarter"]),
            ),
            TransportRoute(
                origin="Ha Giang",
                destination="Hanoi",
                slug="ha-giang-to-hanoi",
                description="Return sleeper bus from Ha Giang City to Hanoi Old Quarter. Same comfortable limousine service. Departs evening, arrives early morning in Hanoi.",
                price=200.00,
                duration="6-7 hours",
                vehicle_type="Limousine Sleeper Bus",
                included=json.dumps(["Reclining sleeper seat", "Blanket & pillow", "Bottled water", "WiFi on board", "Drop-off at Hanoi Old Quarter"]),
            ),
            TransportRoute(
                origin="Hanoi",
                destination="Sapa",
                slug="hanoi-to-sapa",
                description="Express limousine bus from Hanoi to Sapa town center. Modern vehicle with spacious seating, charging ports, and scenic mountain views on arrival.",
                price=180.00,
                duration="5-6 hours",
                vehicle_type="Limousine Bus",
                included=json.dumps(["Comfortable reclining seat", "Bottled water", "WiFi on board", "Hotel pickup in Hanoi", "Drop-off at Sapa town center"]),
            ),
            TransportRoute(
                origin="Sapa",
                destination="Hanoi",
                slug="sapa-to-hanoi",
                description="Return limousine bus from Sapa town center to Hanoi. Comfortable ride through the Hoang Lien Son mountain range.",
                price=180.00,
                duration="5-6 hours",
                vehicle_type="Limousine Bus",
                included=json.dumps(["Comfortable reclining seat", "Bottled water", "WiFi on board", "Hotel pickup in Sapa", "Drop-off at Hanoi Old Quarter"]),
            ),
            TransportRoute(
                origin="Hanoi",
                destination="Ninh Binh",
                slug="hanoi-to-ninh-binh",
                description="Shuttle bus from Hanoi to Ninh Binh (Tam Coc area). Quick and easy transfer to explore the 'Ha Long Bay on land.'",
                price=80.00,
                duration="2-2.5 hours",
                vehicle_type="Shuttle Bus",
                included=json.dumps(["Air-conditioned seat", "Bottled water", "Hotel pickup in Hanoi", "Drop-off at Tam Coc"]),
            ),
            TransportRoute(
                origin="Ninh Binh",
                destination="Hanoi",
                slug="ninh-binh-to-hanoi",
                description="Return shuttle from Ninh Binh (Tam Coc area) back to Hanoi Old Quarter.",
                price=80.00,
                duration="2-2.5 hours",
                vehicle_type="Shuttle Bus",
                included=json.dumps(["Air-conditioned seat", "Bottled water", "Hotel pickup in Ninh Binh", "Drop-off at Hanoi Old Quarter"]),
            ),
        ]
        for route in routes:
            db.add(route)
        print(f"Seeded {len(routes)} transport routes.")

    db.commit()
    db.close()


if __name__ == "__main__":
    seed()
