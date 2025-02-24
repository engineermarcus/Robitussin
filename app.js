const { makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');

// Load authentication state
const { state, saveState } = useSingleFileAuthState('./auth_info.json');

// Create the WhatsApp connection
const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
});

// Save authentication state on change
sock.ev.on('creds.update', saveState);

// Handle incoming messages
sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;

    const sender = msg.key.remoteJid;
    const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text;

    console.log(`Received from ${sender}: ${messageText}`);

    if (messageText === 'hi') {
        await sock.sendMessage(sender, { text: 'Hello! How can I help you?' });
    }
});

// Handle connection updates
sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
        console.log('Connection closed, reconnecting...');
        process.exit(1);
    } else if (connection === 'open') {
        console.log('Connected to WhatsApp!');
    }
});
