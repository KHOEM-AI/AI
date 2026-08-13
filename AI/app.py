from flask import Flask, render_template

app = Flask(__name__, template_folder='.') # ដាក់ '.' ដើម្បីឲ្យវាស្គាល់ index.html នៅកន្លែងជាមួយគ្នា

# ទិន្នន័យប៉ុស្តិ៍ (ប្រើ HLS .m3u8 សម្រាប់ Demo សិន អាចដូរបាន)
CHANNELS = [
    {
        "id": "cnn",
        "name": "CNN International",
        "country": "United States",
        "url": "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8"
    },
    {
        "id": "bbc",
        "name": "BBC News",
        "country": "United Kingdom",
        "url": "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8"
    }
]

@app.route('/')
def home():
    # បើកឯកសារ index.html មកបង្ហាញ
    return render_template('index.html', channels=CHANNELS)

if __name__ == '__main__':
    # រត់ Server លើ Port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)


