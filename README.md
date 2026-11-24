# Tabungan Menuju Akad & Resepsi — Fajar Sidiq & Selviana Nurhidayah

Aplikasi web *single-file* untuk merencanakan, mencatat, dan memantau **tabungan bersama menuju hari pernikahan** secara kolaboratif antara **Fajar Sidiq** dan **Selviana Nurhidayah**, lengkap dengan *countdown* menuju hari H, pembagian kontribusi pasangan, pos anggaran pernikahan, grafik analitik, riwayat transaksi, serta sinkronisasi real-time.

## Fitur Utama

1. **Hitung Mundur & Progres Tabungan Menuju Hari Bahagia**
   * Menampilkan *countdown* **Bulan**, **Hari**, dan **Jam** menuju tanggal dan jam Akad/Resepsi.
   * Menghitung **Saldo Tabungan Bersih** (Total Setoran dikurangi Total Pengeluaran), persentase ketercapaian target, sisa kekurangan/surplus, rata-rata setoran bulanan, serta estimasi bulan tercapainya target.

2. **Kontribusi Pasangan & Pencatatan Cepat (*Quick Record*)**
   * Kartu kontribusi terpisah untuk **Fajar Sidiq** dan **Selviana Nurhidayah** lengkap dengan persentase porsi setoran dan jumlah transaksi.
   * Form **Catat Cepat** maupun modal **+ Catat Tabungan** dan **- Catat Pengeluaran** untuk mencatat setoran atau pengeluaran per kontributor (`Pasangan 1`, `Pasangan 2`, atau `Bersama`) dan per pos anggaran.

3. **Pos Anggaran & Target Pernikahan (*Milestones*)**
   * Melacak alokasi dana per pos persiapan (misalnya: *Gedung & Catering*, *Dekorasi & Dokumentasi*, *Busana & MUA*, *Cincin & Seserahan*, *Undangan & Souvenir*, *Dana Darurat Nikah*).
   * Mendukung penambahan pos baru, pengubahan target dana per pos, dan klik pada kartu pos untuk memfilter tabel riwayat transaksi pada pos tersebut.

4. **Grafik Analitik Interaktif (Chart.js)**
   * **Grafik Pertumbuhan Tabungan:** Memvisualisasikan akumulasi saldo tabungan bersih dari waktu ke waktu dalam Rupiah (`IDR`).
   * **Porsi Kontribusi & Pos:** Grafik *doughnut* yang dapat dialihkan antara porsi kontribusi pasangan (`Pasangan`) dan alokasi dana bersih per pos (`Per Pos`).

5. **Riwayat Setoran & Pengeluaran Lengkap**
   * Pencarian teks bebas pada catatan/pos/kontributor serta filter berdasarkan **Jenis** (*Setoran* / *Pengeluaran*), **Kontributor**, dan **Pos Anggaran**.
   * Mendukung edit dan hapus transaksi secara langsung.

6. **Ruang Kode Pasangan, Real-Time Sync & Backup JSON**
   * **Kode Pasangan (*Shared Couple Space*):** Memisahkan ruang data berdasarkan kode (default: `FAJAR-SELVI-2026`) dan menyediakan tautan langsung (`?kode=...`) untuk dibagikan ke pasangan.
   * **Real-Time Multi-Device Sync:** Tersinkronisasi otomatis antar-tab browser via `localStorage`, dan dapat dihubungkan ke **Firebase Realtime Database** untuk sinkronisasi real-time lintas perangkat.
   * **Export & Import JSON:** Unduh cadangan data dalam format `.json` dan pulihkan kapan saja.

## Cara Menjalankan & Meng-host

### Menjalankan Secara Lokal
1. Simpan file HTML aplikasi (misalnya `index.html` atau `tabungan-wedding-fajar-selviana.html`).
2. Klik dua kali file tersebut untuk membukanya langsung di browser modern (Chrome, Edge, Firefox, Safari).

### Deploy ke GitHub Pages
1. Pastikan file HTML di folder utama (*root*) repository GitHub Anda diberi nama **`index.html`**.
2. Buka **Settings → Pages** pada repository GitHub.
3. Pada bagian **Build and deployment → Source**, pilih **Deploy from a branch**, pilih branch **`main`** dan folder **`/ (root)`**, lalu klik **Save**.
4. Akses tautan `https://<username-github>.github.io/<nama-repository>/`.

## Mengaktifkan Sinkronisasi Real-Time Lintas Perangkat (Firebase Realtime Database)

1. Buat proyek baru di [Firebase Console](https://console.firebase.google.com/) dan aktifkan **Realtime Database**.
2. Salin URL Realtime Database Anda (contoh: `https://nama-project-default-rtdb.firebaseio.com`).
3. Pada halaman aplikasi, klik badge status sinkronisasi di bagian atas (**Mode Lokal (Sinkron Antar-Tab)**), tempelkan URL Firebase Realtime Database Anda, lalu klik **Simpan & Hubungkan**.

## Kustomisasi Data

* Klik **✎ Edit Nama Pasangan, Tanggal & Target** untuk menyesuaikan nama pasangan, tanggal dan jam target pernikahan, serta total target tabungan.
* Gunakan **Export JSON** secara berkala sebagai cadangan data pribadi Anda.