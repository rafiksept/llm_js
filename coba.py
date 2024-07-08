import json
import requests

def get_daily_transaction_data(symbol: str, start_date: str, end_date:str) -> str:
    """Get daily transaction data for stock, such as close price, volume, and market cap on certain date"""
    url = f"https://api.sectors.app/v1/daily/{symbol}/?start={start_date}&end={end_date}"
    api_key = "996f55a810a930c8fd7c1f6cf056d0e8bfb22d6ffc2860c1955cfeccfaae2376"

    headers = {
        "Authorization": "996f55a810a930c8fd7c1f6cf056d0e8bfb22d6ffc2860c1955cfeccfaae2376",
        }
    response = requests.get(url, headers = headers)
    # print(response.headers)

    if response.status_code == 200:
        data = response.json()
        print(data)
        result = json.dumps(data)
    else:
        print(response.json())
        result = None
    return result

get_daily_transaction_data("BBRI", "2024-06-01","2024-06-06")