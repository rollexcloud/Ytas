import logging
from app import app

if __name__ == "__main__":
    # Setup logging for easier debugging
    logging.basicConfig(level=logging.DEBUG)
    app.run(host="0.0.0.0", port=5000, debug=True)
