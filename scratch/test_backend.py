import urllib.request
import urllib.error
import json

url = "https://aura-backend-gk3l.onrender.com/api/v1/auth/request-otp"
data = json.dumps({"phone_number": "+10000000000"}).encode("utf-8")

req = urllib.request.Request(
    url,
    data=data,
    headers={"Content-Type": "application/json"}
)

print(f"Connecting to {url}...")
try:
    with urllib.request.urlopen(req, timeout=10) as response:
        print(f"Status Code: {response.status}")
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode())
except Exception as e:
    print(f"Error: {e}")
