import urllib.request
import urllib.error

urls = [
    "http://127.0.0.1:8000/api/v1/tokens/wallet/d3183d8f-8fdd-4de3-9a7b-e7234293de64",
    "http://127.0.0.1:8000/api/v1/transactions/user/52497943-e0f0-426f-8534-a73ca171bd95",
]

for url in urls:
    endpoint = url.split("/api/v1/")[1]
    print(f"\n=== {endpoint} ===")
    try:
        req = urllib.request.Request(url)
        req.add_header("Origin", "http://localhost:5173")
        resp = urllib.request.urlopen(req)
        print(f"Status: {resp.status}")
        print(f"CORS: {resp.headers.get('Access-Control-Allow-Origin', 'MISSING')}")
        print(resp.read().decode()[:500])
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"CORS: {e.headers.get('Access-Control-Allow-Origin', 'MISSING')}")
        print(e.read().decode()[:1000])
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")
