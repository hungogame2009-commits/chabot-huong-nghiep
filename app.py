from flask import Flask, request, jsonify
from flask_cors import CORS

from google import genai

client = genai.Client(api_key="AIzaSyCUaagb-AKumX_IVK92z2RdOn_HOuk9nac")

app = Flask(__name__)
CORS(app)

@app.route("/chat", methods=["POST"])
def chat():

    user = request.json["message"]

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=user
    )

    return jsonify({
        "reply": response.text
    })

app.run(port=5000)