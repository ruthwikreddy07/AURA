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
        req = urllib.request.urlopen(url)
        print(f"Status: {req.status}")
        print(req.read().decode()[:500])
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        body = e.read().decode()
        print(body[:2000])
