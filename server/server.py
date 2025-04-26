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
        raw_data = request.get_data(as_text=True)
        logger.info(f"Raw request body: {raw_data}")
        
        if not request.is_json:
            return jsonify({"error": "Request must have Content-Type: application/json"}), 400
        
        data = request.json
        if not data:
            return jsonify({"error": "Empty JSON payload"}), 400
            
        post = data.get("postTextBody", "")
        
        if not isinstance(post, str):
            return jsonify({"error": "Invalid post text"}), 400
        
        sentiment_result = invoke_sentiment(post)
        if "final_sentiment" not in sentiment_result:
            raise ValueError("Invalid sentiment result: 'final_sentiment' is missing")
        
        task = process_detailed_analysis.delay(post, sentiment_result["final_sentiment"])
        return jsonify({
            "sentiment": sentiment_result["final_sentiment"],
            "confidence": sentiment_result["confidence_score"],
            "task_id": task.id,
            "received": data
        })
    except Exception as e:
        logger.exception(f"Error in /data endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/task/<task_id>", methods=["GET"])
def get_task_result(task_id):
    try:
        task = process_detailed_analysis.AsyncResult(task_id)
        if task.ready():
            if task.successful():
                return jsonify({"status": "completed", "result": task.get()})
            else:
                error = str(task.get(propagate=False))
                logger.error(f"Task failed with error: {error}", exc_info=True)
                return jsonify({"status": "failed", "error": error}), 500
        return jsonify({"status": "pending"})
    except Exception as e:
        logger.error(f"Error retrieving task result: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=PORT)