"""
Servicio para integración con APIs externas
- Open Food Facts API
- Carbon Footprint API (simulado)
- Google Maps API
"""

import aiohttp
import os
from typing import Optional, Dict, List
import asyncio


class ExternalAPIService:
    """Servicio para consultar APIs externas de productos y sostenibilidad"""

    def __init__(self):
        self.open_food_facts_url = "https://world.openfoodfacts.org/api/v2"
        self.google_maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
        self.google_maps_url = "https://maps.googleapis.com/maps/api"

    async def fetch_product_from_barcode(self, barcode: str) -> Optional[Dict]:
        """
        Busca información de producto en Open Food Facts por código de barras

        Args:
            barcode: Código de barras del producto

        Returns:
            Dict con información del producto o None si no se encuentra
        """
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("status") == 1:
                            return self._parse_open_food_facts_product(data.get("product", {}))
        except Exception as e:
            print(f"Error fetching from Open Food Facts: {e}")

        return None

    async def search_products_open_food_facts(
        self, query: str, country: str = "chile", page_size: int = 20
    ) -> List[Dict]:
        """
        Busca productos en Open Food Facts

        Args:
            query: Término de búsqueda
            country: País (chile por defecto)
            page_size: Número de resultados

        Returns:
            Lista de productos encontrados
        """
        url = f"{self.open_food_facts_url}/search"
        params = {
            "search_terms": query,
            "countries": country,
            "page_size": page_size,
            "json": 1,
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url, params=params, timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        products = data.get("products", [])
                        return [self._parse_open_food_facts_product(p) for p in products[:10]]
        except Exception as e:
            print(f"Error searching Open Food Facts: {e}")

        return []

    def _parse_open_food_facts_product(self, product_data: Dict) -> Dict:
        """Parsea datos de Open Food Facts a nuestro formato"""
        nutriments = product_data.get("nutriments", {})

        return {
            "external_id": product_data.get("id", ""),
            "barcode": product_data.get("code", ""),
            "name": product_data.get("product_name", "Unknown Product"),
            "brand": product_data.get("brands", ""),
            "category": product_data.get("categories", "general"),
            "image_url": product_data.get("image_url", ""),
            "ingredients": product_data.get("ingredients_text", ""),
            "labels": product_data.get("labels", "").split(",") if product_data.get("labels") else [],
            "nutrition": {
                "energy_kcal": nutriments.get("energy-kcal_100g", 0),
                "proteins": nutriments.get("proteins_100g", 0),
                "carbohydrates": nutriments.get("carbohydrates_100g", 0),
                "fats": nutriments.get("fat_100g", 0),
                "fiber": nutriments.get("fiber_100g", 0),
                "salt": nutriments.get("salt_100g", 0),
            },
            "nutriscore": product_data.get("nutriscore_grade", "unknown"),
            "ecoscore": product_data.get("ecoscore_grade", "unknown"),
        }

    async def estimate_carbon_footprint(self, product_category: str, weight_kg: float = 1.0) -> Dict:
        """
        Estima huella de carbono basada en categoría de producto
        (Simulado - en producción usaría Carbon Interface API)

        Returns:
            Dict con estimación de huella de carbono
        """
        # Factores de emisión promedio por categoría (kg CO2 por kg de producto)
        carbon_factors = {
            "meat": 27.0,
            "poultry": 6.9,
            "fish": 5.1,
            "dairy": 1.4,
            "eggs": 1.8,
            "fruit": 0.3,
            "vegetable": 0.2,
            "cereals": 2.5,
            "legumes": 0.9,
            "bread": 0.5,
            "oils": 2.0,
            "beverages": 0.7,
            "default": 1.5,
        }

        category_lower = product_category.lower()
        factor = carbon_factors.get(category_lower, carbon_factors["default"])

        carbon_kg = factor * weight_kg

        return {
            "carbon_footprint_kg": round(carbon_kg, 2),
            "category": product_category,
            "weight_kg": weight_kg,
            "factor_used": factor,
            "comparison": self._get_carbon_comparison(carbon_kg),
        }

    def _get_carbon_comparison(self, carbon_kg: float) -> str:
        """Genera comparación amigable de huella de carbono"""
        if carbon_kg < 0.5:
            return "Muy bajo impacto - equivalente a cargar un smartphone 60 veces"
        elif carbon_kg < 2:
            return "Bajo impacto - equivalente a 10 km en auto"
        elif carbon_kg < 5:
            return "Impacto moderado - equivalente a 25 km en auto"
        elif carbon_kg < 10:
            return "Alto impacto - equivalente a 50 km en auto"
        else:
            return "Muy alto impacto - considera alternativas más sostenibles"

    async def geocode_address(self, address: str) -> Optional[Dict]:
        """
        Geocodifica una dirección usando Google Maps Geocoding API

        Args:
            address: Dirección a geocodificar

        Returns:
            Dict con coordenadas y detalles o None
        """
        if not self.google_maps_api_key:
            print("Google Maps API key not configured")
            return None

        url = f"{self.google_maps_url}/geocode/json"
        params = {
            "address": address,
            "key": self.google_maps_api_key,
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url, params=params, timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("status") == "OK" and data.get("results"):
                            result = data["results"][0]
                            location = result["geometry"]["location"]
                            return {
                                "latitude": location["lat"],
                                "longitude": location["lng"],
                                "display_name": result.get("formatted_address", ""),
                                "place_id": result.get("place_id", ""),
                            }
        except Exception as e:
            print(f"Error geocoding address: {e}")

        return None

    async def find_nearby_stores(
        self, latitude: float, longitude: float, radius_km: float = 5.0
    ) -> List[Dict]:
        """
        Busca tiendas cercanas usando Google Places API

        Returns:
            Lista de tiendas cercanas con detalles
        """
        if not self.google_maps_api_key:
            print("Google Maps API key not configured - cannot search nearby stores")
            return []

        url = f"{self.google_maps_url}/place/nearbysearch/json"
        params = {
            "location": f"{latitude},{longitude}",
            "radius": int(radius_km * 1000),  # Convert to meters
            "type": "supermarket",
            "key": self.google_maps_api_key,
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url, params=params, timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("status") == "OK":
                            stores = []
                            places = data.get("results", [])[:10]  # Limit to 10 stores

                            for place in places:
                                store_location = place["geometry"]["location"]
                                # Calculate approximate distance
                                distance = self._calculate_distance(
                                    latitude, longitude,
                                    store_location["lat"], store_location["lng"]
                                )

                                # Get opening hours status from nearby search
                                opening_hours = place.get("opening_hours", {})
                                is_open = opening_hours.get("open_now", None)

                                store_data = {
                                    "name": place.get("name", "Unknown"),
                                    "distance_km": round(distance, 2),
                                    "address": place.get("vicinity", ""),
                                    "type": "supermarket",
                                    "place_id": place.get("place_id", ""),
                                    "rating": place.get("rating", 0),
                                    "lat": store_location["lat"],
                                    "lng": store_location["lng"],
                                    "is_open": is_open,
                                }
                                stores.append(store_data)

                            # Fetch details for top 5 stores (hours and phone)
                            sorted_stores = sorted(stores, key=lambda x: x["distance_km"])
                            for store in sorted_stores[:5]:
                                if store.get("place_id"):
                                    details = await self._get_place_details(session, store["place_id"])
                                    if details:
                                        store.update(details)

                            return sorted_stores
        except Exception as e:
            print(f"Error finding nearby stores: {e}")

        return []

    async def _get_place_details(self, session, place_id: str) -> Optional[Dict]:
        """
        Obtiene detalles de un lugar (horarios, teléfono)
        """
        url = f"{self.google_maps_url}/place/details/json"
        params = {
            "place_id": place_id,
            "fields": "formatted_phone_number,opening_hours",
            "key": self.google_maps_api_key,
        }

        try:
            async with session.get(
                url, params=params, timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("status") == "OK":
                        result = data.get("result", {})
                        details = {}

                        # Phone number
                        if result.get("formatted_phone_number"):
                            details["phone"] = result["formatted_phone_number"]

                        # Opening hours
                        opening_hours = result.get("opening_hours", {})
                        if opening_hours.get("weekday_text"):
                            # Get today's hours
                            import datetime
                            today = datetime.datetime.now().weekday()
                            weekday_text = opening_hours["weekday_text"]
                            if today < len(weekday_text):
                                details["hours"] = weekday_text[today]
                            else:
                                details["hours"] = weekday_text[0] if weekday_text else None

                        return details if details else None
        except Exception as e:
            print(f"Error getting place details: {e}")

        return None

    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        import math
        R = 6371  # Earth's radius in km

        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)

        a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

        return R * c

    def calculate_water_usage(self, product_category: str, weight_kg: float = 1.0) -> float:
        """
        Calcula uso de agua estimado por categoría de producto

        Returns:
            Litros de agua usados en producción
        """
        # Litros de agua por kg de producto
        water_factors = {
            "meat": 15400,  # Carne de res
            "poultry": 4300,  # Pollo
            "dairy": 1000,  # Productos lácteos
            "eggs": 3300,  # Huevos
            "fruit": 960,
            "vegetable": 322,
            "cereals": 1644,
            "legumes": 4055,
            "bread": 1608,
            "default": 1500,
        }

        category_lower = product_category.lower()
        factor = water_factors.get(category_lower, water_factors["default"])

        return round(factor * weight_kg, 2)
