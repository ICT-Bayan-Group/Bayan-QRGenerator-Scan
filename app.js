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

// Initialize peserta.json if it doesn't exist
if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([]));
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('a user connected');

    // Client bisa join room sesuai MejaID
    socket.on('joinRoom', (meja) => {
        socket.join(meja);
        console.log(`Socket joined room: ${meja}`);
    });

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
                socket.emit('barcodeExists', {
                    message: 'Barcode already scanned',
                    timestamp: existingEntry.timestamp
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
