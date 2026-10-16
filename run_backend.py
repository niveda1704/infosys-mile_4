import os
import sys

# Ensure backend_/gateway is on sys.path
root_dir = os.path.dirname(os.path.abspath(__file__))
gateway_dir = os.path.join(root_dir, "backend_", "gateway")
if gateway_dir not in sys.path:
    sys.path.insert(0, gateway_dir)

os.chdir(gateway_dir)

from app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
