const express = require('express');
const https = require('https');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

// Generate self-signed certificates using node-forge
const forge = require('node-forge');
const certPath = path.join(__dirname, 'cert');
if (!fs.existsSync(certPath)) {
    fs.mkdirSync(certPath);
}

const keyPath = path.join(certPath, 'key.pem');
const certPathFile = path.join(certPath, 'cert.pem');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPathFile)) {
    // Generate a key pair
    const keys = forge.pki.rsa.generateKeyPair(4096);

    // Create a certificate
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    const attrs = [
        { name: 'commonName', value: 'localhost' }
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);

    cert.setExtensions([
        {
            name: 'basicConstraints',
            cA: false
        },
        {
            name: 'keyUsage',
            keyCertSign: true,
            digitalSignature: true,
            nonRepudiation: true,
            keyEncipherment: true,
            dataEncipherment: true
        },
        {
            name: 'extKeyUsage',
            serverAuth: true,
            clientAuth: true
        }
    ]);

    // Sign the certificate
    cert.sign(keys.privateKey, forge.md.sha256.create());

    // Convert to PEM format
    const pem = {
        privateKey: forge.pki.privateKeyToPem(keys.privateKey),
        certificate: forge.pki.certificateToPem(cert)
    };

    fs.writeFileSync(keyPath, pem.privateKey);
    fs.writeFileSync(certPathFile, pem.certificate);
}

const app = express();
const server = https.createServer({
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPathFile)
}, app);
const io = new Server(server);

const dataPath = path.join(__dirname, 'peserta.json');
const scanHadiahPath = path.join(__dirname, 'scanhadiah.json');

// Initialize peserta.json if it doesn't exist
if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([]));
}

// Initialize scanhadiah.json if it doesn't exist
if (!fs.existsSync(scanHadiahPath)) {
    fs.writeFileSync(scanHadiahPath, JSON.stringify([]));
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Add custom route for your message
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hayo Nyari Apa?</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    height: 100vh;
                    margin: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: white;
                }
                .container {
                    text-align: center;
                    padding: 2rem;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                }
                h1 {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                }
                .emoji {
                    font-size: 3rem;
                    margin: 1rem 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="emoji">🤔</div>
                <h1>hayo nyari apa disinii?</h1>
                <h2>gaada apa apa WWKWKWK</h2>
                <div class="emoji">😂</div>
            </div>
        </body>
        </html>
    `);
});

// You can also add a simple API route if needed
app.get('/api/message', (req, res) => {
    res.json({ 
       message: "hayo nyari apa disinii? gaada apa apa WWKWKWK",
        timestamp: new Date().toISOString()
    });
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('a user connected');

    // Client bisa join room sesuai MejaID
    socket.on('joinRoom', (meja) => {
        socket.join(meja);
        console.log(`Socket joined room: ${meja}`);
    });

    // Handler untuk scan peserta (original logic - unchanged)
    socket.on('barcodeScanned', (data) => {
        try {
            const barcode = data.barcodeData;
            const meja = data.MejaID;

            console.log(`Barcode scanned dari Meja ${meja}: ${barcode}`);

            let peserta = [];
            if (fs.existsSync(dataPath)) {
                const fileContent = fs.readFileSync(dataPath, 'utf8');
                peserta = JSON.parse(fileContent);
            }

            const existingEntry = peserta.find(entry => entry.barcode === barcode);
            let entryToBroadcast = null;

            if (!existingEntry) {
                const newEntry = {
                    barcode,
                    meja,
                    timestamp: new Date().toISOString()
                };
                peserta.push(newEntry);
                entryToBroadcast = newEntry;
                console.log('New barcode added:', newEntry);
            } else {
                console.log('Barcode already exists:', existingEntry);
                console.log('markotop');

                io.emit('barcodeExists', {
                    message: 'Barcode already scanned',
                    timestamp: existingEntry.timestamp,
                    meja: data.MejaID
                });
                entryToBroadcast = existingEntry;
            }

            fs.writeFileSync(dataPath, JSON.stringify(peserta, null, 2));

            console.log(`Data saved. Total entries: ${peserta.length}`);

            // Broadcast ke semua client
            io.emit('scanSuccess', { qrString: barcode, meja });

            if (entryToBroadcast) {
                io.emit('barcodeAdded', entryToBroadcast);
            }

        } catch (error) {
            console.error('Error saving data:', error);
            socket.emit('saveError', { message: 'Failed to save data' });
        }
    });

    // Handler BARU untuk scan hadiah
    socket.on('hadiahScanned', (data) => {
        try {
            const barcode = data.barcodeData;
            const meja = data.MejaID;
            const parsedData = data.parsedData || {};

            console.log(`Hadiah scanned dari Meja ${meja}: ${barcode}`);

            let scanHadiah = [];
            if (fs.existsSync(scanHadiahPath)) {
                const fileContent = fs.readFileSync(scanHadiahPath, 'utf8');
                scanHadiah = JSON.parse(fileContent);
            }

            const existingEntry = scanHadiah.find(entry => entry.barcode === barcode);
            let entryToBroadcast = null;

            if (!existingEntry) {
                const newEntry = {
                    barcode,
                    meja,
                    name: parsedData.name || 'Unknown',
                    email: parsedData.email || 'Unknown',
                    timestamp: new Date().toISOString()
                };
                scanHadiah.push(newEntry);
                entryToBroadcast = newEntry;
                console.log('New hadiah scan added:', newEntry);
            } else {
                console.log('Hadiah already scanned:', existingEntry);

                io.emit('hadiahExists', {
                    message: 'Hadiah already scanned',
                    timestamp: existingEntry.timestamp,
                    name: existingEntry.name
                });
                entryToBroadcast = existingEntry;
            }

            fs.writeFileSync(scanHadiahPath, JSON.stringify(scanHadiah, null, 2));

            console.log(`Hadiah data saved. Total entries: ${scanHadiah.length}`);

            // Broadcast ke semua client
            io.emit('hadiahScanSuccess', { 
                qrString: barcode, 
                meja,
                name: entryToBroadcast.name,
                email: entryToBroadcast.email
            });

            if (entryToBroadcast) {
                io.emit('hadiahAdded', entryToBroadcast);
            }

        } catch (error) {
            console.error('Error saving hadiah data:', error);
            socket.emit('hadiahSaveError', { message: 'Failed to save hadiah data' });
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`Accessible from other devices on your network using your computer's IP address`);
});