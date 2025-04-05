from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()
PORT = int(os.getenv("PORT", 3000))

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": f"Hello from localhost:{PORT}!"})

@app.route("/data", methods=["POST"])
def get_data():
    data = request.json
    print("Received post data:", data)

    # from here call the model and get the result for now i have set it to the false making each post being analyzed illegal
    return jsonify({"isLegal": False, "received": data})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=PORT)
