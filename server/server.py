from flask import Flask, request, jsonify
from flask_cors import CORS
from model.xzamine import invoke_sentiment, process_detailed_analysis
from dotenv import load_dotenv
import os
import logging

load_dotenv()
PORT = int(os.getenv("PORT", 3000))

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": f"Hello from localhost:{PORT}!"})

@app.route("/data", methods=["POST"])
def get_data():
    try:
        data = request.json
        post = data.get("postTextBody", "")
        
        # Ensure post is a string
        if not isinstance(post, str):
            return jsonify({"error": "Invalid post text"}), 400
        
        sentiment_result = invoke_sentiment(post)
        # Add validation for sentiment_result structure
        if "final_sentiment" not in sentiment_result:
            raise ValueError("Invalid sentiment result")
        
        # Proceed with task creation
        task = process_detailed_analysis.delay(post, sentiment_result["final_sentiment"])
        return jsonify({
            "sentiment": sentiment_result["final_sentiment"],
            "confidence": sentiment_result["confidence_score"],
            "task_id": task.id,
            "received": data
        })
    except Exception as e:
        logger.exception("Error in /data endpoint")  # Log full traceback
        return jsonify({"error": str(e)}), 500

@app.route("/task/<task_id>", methods=["GET"])
def get_task_result(task_id):
    try:
        task = process_detailed_analysis.AsyncResult(task_id)
        if task.ready():
            if task.successful():
                return jsonify({"status": "completed", "result": task.get()})
            else:
                return jsonify({"status": "failed", "error": str(task.get(propagate=False))}), 500
        return jsonify({"status": "pending"})
    except Exception as e:
        logger.error(f"Error retrieving task result: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=PORT)