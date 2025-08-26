# QR Barcode Generator & Scanner 🚀

## 🛠️ Tech Stack
- ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white&style=flat) 
- ![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white&style=flat)
- ![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socket.io&logoColor=white&style=flat)
- ![QuaggaJS](https://img.shields.io/badge/QuaggaJS-FF9800?logo=javascript&logoColor=white&style=flat)
- ![jsQR](https://img.shields.io/badge/jsQR-2196F3?logo=javascript&logoColor=white&style=flat)
- ![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?logo=bootstrap&logoColor=white&style=flat)

## ✨ Fitur Utama
- 📤 **Upload CSV/JSON**: Import data peserta dengan mudah.
- 🖨️ **Generate QR Code**: Buat QR code untuk setiap peserta.
- 📷 **Scan Barcode/QR**: Scan menggunakan kamera atau input manual.
- 💾 **Realtime Save**: Hasil scan langsung tersimpan ke server.

## 📦 Struktur Folder
- `app.js` - Server utama (Express, HTTPS, Socket.IO)
- `generateQRCode.js` - Script generate QR code
- `converjson.js` - Konversi data peserta
- `public/` - File HTML, JS, CSS untuk UI
- `cert/` - Sertifikat SSL
- `uploads/` - File hasil upload & output

## 🚦 Cara Menjalankan

1. **Install dependencies**
    ```sh
    npm install
    ```

2. **Jalankan server**
    ```sh
    npm start
    ```
    atau
    ```sh
    node app.js
    ```

3. **Akses aplikasi**
    Buka browser dan akses:
    ```
    https://localhost/index.html
    ```
    > ⚠️ Karena menggunakan sertifikat self-signed, browser akan menampilkan peringatan keamanan. Pilih "Advanced" lalu "Proceed".

> 💡 **Tips:**  
> Gunakan browser modern (Chrome/Edge/Firefox) dan akses via HTTPS untuk