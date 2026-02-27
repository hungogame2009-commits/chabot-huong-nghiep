from google import genai

# API KEY
client = genai.Client(api_key="AIzaSyCUaagb-AKumX_IVK92z2RdOn_HOuk9nac")

print("Gemini đã sẵn sàng!")
print("Gõ 'exit' để thoát\n")

history = []

while True:

    user = input("Bạn: ")

    if user.lower() == "exit":
        break

    # lưu lịch sử
    history.append(f"User: {user}")

    # tạo prompt
    prompt = "\n".join(history)

    try:

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        # CÁCH CHUẨN NHẤT
        ai = response.text

        print("Gemini:", ai)

        history.append(f"AI: {ai}")

    except Exception as e:

        print("Lỗi:", e)