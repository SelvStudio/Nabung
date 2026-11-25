# 💍 Tabungan Menuju Akad & Resepsi — Fajar & Selviana

Aplikasi web kolaboratif berbasis **GitHub Pages** + **Firebase Realtime Database** untuk mencatat, memantau, dan mengedit progres tabungan pernikahan bersama pasangan secara **real-time lintas perangkat dan beda jaringan internet** (Wi-Fi maupun paket data seluler).

---

## ✨ Fitur Utama

1. **Sinkronisasi Real-Time Lintas Jaringan (`Firebase Realtime Database`)**
   - Setiap setoran baru, pengeluaran DP vendor, perubahan target pos anggaran, maupun koreksi nominal akan **langsung ter-update otomatis** di layar HP pasangan tanpa perlu refresh manual.
   - Mendukung mode cadangan otomatis (`localStorage`) jika koneksi internet terputus sementara.

2. **Akses Ruang Bersama & PIN Keamanan (`Room ID` + `PIN`)**
   - Pasangan masuk menggunakan `Kode Ruang Bersama` (contoh: `fajar-selviana-2027`) dan `PIN` yang sama sehingga data terisolasi aman dari pengguna lain.

3. **Edit & Hapus Data Langsung (CRUD Penuh)**
   - **Mutasi Transaksi**: Tambah setoran masuk (`+`), catat pengeluaran/DP vendor (`-`), edit nominal/catatan, atau hapus transaksi yang salah input.
   - **Pos Anggaran Pernikahan**: Klik **Edit Target** pada masing-masing pos (Mahar, Venue & Katering, Busana & MUA, Dokumentasi, Dana Cadangan) atau tambahkan pos baru sesuai kebutuhan.

4. **Analitik Visual & Export Laporan**
   - *Countdown* hari menuju tanggal akad/resepsi & rekomendasi setoran bulanan otomatis.
   - Grafik perbandingan kontribusi **Fajar vs Selviana** serta grafik alokasi per pos anggaran (`Chart.js`).
   - Fitur **Export CSV** untuk mengunduh rekap mutasi ke Excel/Google Sheets.

---

## 🚀 Cara Deploy Online di GitHub Pages (Gratis)

1. **Buat Repository Baru di GitHub**
   - Buka [github.com/new](https://github.com/new), beri nama repository misalnya `tabungan-wedding`, pilih **Public**, lalu klik **Create repository**.
2. **Upload File Aplikasi**
   - Ekstrak file ZIP ini dan upload seluruh file (`index.html`, `style.css`, `app.js`, `README.md`) ke dalam repository tersebut.
3. **Aktifkan GitHub Pages**
   - Masuk ke menu **Settings** → **Pages**.
   - Pada bagian **Build and deployment** → **Source**, pilih **Deploy from a branch**.
   - Pilih branch `main` dan folder `/ (root)`, lalu klik **Save**.
4. **Akses Link Online**
   - Tunggu sekitar 1–2 menit hingga muncul tautan publik seperti:
     `https://<username-github>.github.io/tabungan-wedding/`
   - Bagikan tautan tersebut ke pasangan Anda agar bisa dibuka dari HP masing-masing di jaringan berbeda.

---

## 🔄 Cara Mengaktifkan Sinkronisasi Real-Time Beda Jaringan (Firebase)

Agar data benar-benar sinkron antar HP Fajar dan HP Selviana di jaringan yang berbeda:

1. Buka [Firebase Console](https://console.firebase.google.com/) dan klik **Add project** (buat proyek baru gratis).
2. Di menu kiri, pilih **Build** → **Realtime Database** → klik **Create Database**.
3. Pilih lokasi server terdekat (misalnya **Singapore / `asia-southeast1`**), lalu pilih **Start in test mode** dan klik **Enable**.
4. Salin **Database URL** yang muncul di bagian atas tabel data (contoh: `https://wedding-kita-default-rtdb.asia-southeast1.firebasedatabase.app`).
5. Buka web GitHub Pages Anda, klik **⚙️ Konfigurasi Firebase Realtime Database** pada halaman masuk (atau menu **⚙️ Pengaturan** di dalam dashboard), lalu tempelkan **Database URL** tersebut.
6. Lakukan hal yang sama di HP pasangan dengan **Room ID**, **PIN**, dan **Database URL** yang sama. Status di bagian atas akan berubah menjadi hijau: **`● Live Sync`**.

> **Catatan Keamanan Rules Firebase:** Setelah selesai pengujian, Anda dapat memperketat aturan di tab **Rules** pada Firebase Realtime Database menjadi:
> ```json
> {
>   "rules": {
>     "wedding_rooms": {
>       "$roomId": {
>         ".read": true,
>         ".write": true
>       }
>     }
>   }
> }
> ```
