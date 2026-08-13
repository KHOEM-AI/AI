from flask import Flask, render_template

# Flask នឹងស្វែងរកឯកសារ HTML ក្នុងថត 'templates' ដោយស្វ័យប្រវត្តិ
app = Flask(__name__)

# ទិន្នន័យប៉ុស្តិ៍សម្រាប់ Demo
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

# Route សម្រាប់ទំព័រដើម (Control Room)
@app.route('/')
def home():
    return render_template('index.html', channels=CHANNELS)

# Route សម្រាប់ទំព័រមើលទូរទស្សន៍ពេញអេក្រង់ (AI TV)
@app.route('/tv')
def ai_tv():
    return render_template('aitv.html')

if __name__ == '__main__':
    # រត់ Server
    app.run(host='0.0.0.0', port=5000, debug=True)
    
