const fs = require('fs');
const xlsx = require('xlsx');

// Baca file JSON
const jsonData = JSON.parse(fs.readFileSync('peserta.json', 'utf8'));

// Buat workbook dan worksheet
const workbook = xlsx.utils.book_new();
const worksheet = xlsx.utils.json_to_sheet(jsonData);

// Tambahkan worksheet ke workbook
xlsx.utils.book_append_sheet(workbook, worksheet, 'Winners');

// Simpan workbook ke file Excel
xlsx.writeFile(workbook, 'winners.xlsx');

console.log('File Excel berhasil dibuat: winners.xlsx');
