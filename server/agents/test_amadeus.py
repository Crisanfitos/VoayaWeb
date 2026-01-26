"""
Test script for Amadeus API to debug flight search parameters.
Run with: python test_amadeus.py
"""
import os
from dotenv import load_dotenv
from amadeus import Client, ResponseError

# Load environment variables
load_dotenv()

def test_amadeus():
    """Test Amadeus API with minimal parameters."""
    
    # Initialize client
    amadeus = Client(
        client_id=os.getenv("AMADEUS_API_KEY"),
        client_secret=os.getenv("AMADEUS_API_SECRET"),
        hostname=os.getenv("AMADEUS_HOSTNAME", "test")
    )
    
    print("=" * 60)
    print("AMADEUS API TEST")
    print("=" * 60)
    print(f"Hostname: {os.getenv('AMADEUS_HOSTNAME', 'test')}")
    print(f"API Key: {os.getenv('AMADEUS_API_KEY', 'NOT SET')[:10]}...")
    print()

    # TEST 1: Minimal parameters (most likely to work)
    print("TEST 1: Minimal parameters (MAD -> BCN, tomorrow)")
    print("-" * 40)
    
    from datetime import datetime, timedelta
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    params_minimal = {
        "originLocationCode": "MAD",
        "destinationLocationCode": "BCN",
        "departureDate": tomorrow,
        "adults": 1
    }
    print(f"Params: {params_minimal}")
    
    try:
        response = amadeus.shopping.flight_offers_search.get(**params_minimal)
        print(f"✅ SUCCESS! Found {len(response.data)} offers")
        if response.data:
            first_offer = response.data[0]
            price = first_offer['price']['total']
            currency = first_offer['price']['currency']
            print(f"   First offer: {currency} {price}")
    except ResponseError as e:
        print(f"❌ FAILED: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"   Status: {e.response.status_code}")
            print(f"   Body: {e.response.body}")
    print()

    # TEST 2: Add max results
    print("TEST 2: With max parameter")
    print("-" * 40)
    
    params_with_max = {
        **params_minimal,
        "max": 5
    }
    print(f"Params: {params_with_max}")
    
    try:
        response = amadeus.shopping.flight_offers_search.get(**params_with_max)
        print(f"✅ SUCCESS! Found {len(response.data)} offers")
    except ResponseError as e:
        print(f"❌ FAILED: {e}")
    print()

    # TEST 3: Add travelClass
    print("TEST 3: With travel class (ECONOMY)")
    print("-" * 40)
    
    params_with_class = {
        **params_with_max,
        "travelClass": "ECONOMY"
    }
    print(f"Params: {params_with_class}")
    
    try:
        response = amadeus.shopping.flight_offers_search.get(**params_with_class)
        print(f"✅ SUCCESS! Found {len(response.data)} offers")
    except ResponseError as e:
        print(f"❌ FAILED: {e}")
    print()

    # TEST 4: Add nonStop as string (the fix we applied)
    print("TEST 4: With nonStop='true' (string)")
    print("-" * 40)
    
    params_with_nonstop = {
        **params_with_class,
        "nonStop": "true"
    }
    print(f"Params: {params_with_nonstop}")
    
    try:
        response = amadeus.shopping.flight_offers_search.get(**params_with_nonstop)
        print(f"✅ SUCCESS! Found {len(response.data)} offers")
        if len(response.data) == 0:
            print("   ⚠️ 0 results - maybe no direct flights on this route?")
    except ResponseError as e:
        print(f"❌ FAILED: {e}")
    print()

    # TEST 5: Same route WITHOUT nonStop (to see if there are connecting flights)
    print("TEST 5: WITHOUT nonStop (allow connections)")
    print("-" * 40)
    
    params_without_nonstop = {
        "originLocationCode": "MAD",
        "destinationLocationCode": "BCN",
        "departureDate": tomorrow,
        "adults": 1,
        "max": 5,
        "travelClass": "ECONOMY"
    }
    print(f"Params: {params_without_nonstop}")
    
    try:
        response = amadeus.shopping.flight_offers_search.get(**params_without_nonstop)
        print(f"✅ SUCCESS! Found {len(response.data)} offers")
    except ResponseError as e:
        print(f"❌ FAILED: {e}")
    print()

    # TEST 6: LPA -> CDG (the actual route user tested)
    print("TEST 6: User's route (LPA -> CDG)")
    print("-" * 40)
    
    # Future date to avoid past date errors
    future_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    
    params_user_route = {
        "originLocationCode": "LPA",
        "destinationLocationCode": "CDG",
        "departureDate": future_date,
        "adults": 2,
        "max": 10
    }
    print(f"Params: {params_user_route}")
    
    try:
        response = amadeus.shopping.flight_offers_search.get(**params_user_route)
        print(f"✅ SUCCESS! Found {len(response.data)} offers")
        if len(response.data) == 0:
            print("   ⚠️ 0 results for LPA->CDG. This route may have limited flights.")
    except ResponseError as e:
        print(f"❌ FAILED: {e}")
    print()

    # TEST 7: LPA -> CDG with nonStop
    print("TEST 7: LPA -> CDG WITH nonStop='true'")
    print("-" * 40)
    
    params_user_nonstop = {
        **params_user_route,
        "nonStop": "true"
    }
    print(f"Params: {params_user_nonstop}")
    
    try:
        response = amadeus.shopping.flight_offers_search.get(**params_user_nonstop)
        print(f"✅ SUCCESS! Found {len(response.data)} offers")
        if len(response.data) == 0:
            print("   ⚠️ 0 direct flights. Remove nonStop filter in production!")
    except ResponseError as e:
        print(f"❌ FAILED: {e}")
    print()

    print("=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    test_amadeus()
