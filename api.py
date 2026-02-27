from flask import Flask, request, jsonify
from google import genai

# ===== GEMINI =====

client = genai.Client(api_key="AIzaSyCUaagb-AKumX_IVK92z2RdOn_HOuk9nac")

# ===== FLASK =====

app = Flask(__name__)

@app.route("/")
def home():
    return "Server OK"

@app.route("/chat", methods=["POST"])
def chat():

    data = request.json

    user_message = data["message"]

    response = client.models.generate_content(

        model="gemini-2.5-flash",

        contents=user_message

    )

    ai = response.text

    return jsonify({

        "reply": ai

    })


# RUN

if __name__ == "__main__":

    app.run(debug=True)