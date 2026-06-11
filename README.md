# 📖 RSVP Reader — hızlıKitapOku

🌐 **Canlı Demo:** [rushwordreader.netlify.app](https://rushwordreader.netlify.app/)

Hızlı okuma tekniği **RSVP (Rapid Serial Visual Presentation)** kullanılarak geliştirilmiş bir web uygulaması. PDF yükle ya da metin yapıştır, kelimeleri tek tek odak noktasında gör, okuma hızını artır.

## ✨ Özellikler

- 📄 **PDF Desteği** — PDF dosyası yükle, belirli bir sayfadan başlat
- 📋 **Metin Yapıştırma** — Herhangi bir metni doğrudan yapıştırarak kullan
- ⚡ **Ayarlanabilir Hız** — 100–1000 WPM arasında hız kontrolü (slider + manuel giriş)
- 🎯 **ORP Vurgulama** — Her kelimede optimal odak noktası kırmızıyla işaretlenir
- ⏸️ **Duraklat / Devam** — İstediğin an oku, devam et
- 🌗 **Açık / Koyu Tema** — Tek tıkla tema değişimi
- 📊 **İlerleme Takibi** — Kalan kelime sayısı ve tahmini süre göstergesi
- ⏱️ **Noktalama Gecikmesi** — Cümle sonlarında otomatik yavaşlama

## 🛠️ Teknolojiler

- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [pdfjs-dist](https://github.com/mozilla/pdf.js) — PDF metin çıkarımı

## 🚀 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build
```

## 📂 Proje Yapısı

```
hızlıKitapOku/
├── src/
│   ├── App.jsx          # Ana uygulama bileşeni
│   ├── FastReader.jsx   # RSVP okuyucu bileşeni
│   ├── main.jsx         # Giriş noktası
│   └── index.css        # Global stiller
├── package.json
└── vite.config.js
```

## 📖 Kullanım

1. Uygulamayı başlat (`npm run dev`)
2. PDF yükle **veya** metin alanına yapıştır
3. İstersen başlangıç sayfasını ayarla
4. WPM hızını belirle
5. **BAŞLAT** butonuna bas

## 💡 RSVP Nedir?

RSVP, kelimeleri ekranda sabit bir noktada seri hâlde göstererek göz hareketini ortadan kaldıran bir hızlı okuma tekniğidir. Ortalama okuyucu 200–300 WPM okurken, pratikle 500+ WPM'e ulaşmak mümkündür.
