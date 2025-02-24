const { default: makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const { unlinkSync } = require('fs');

// Load authentication state
const { state, saveState } = useSingleFileAuthState('./auth_info.json');

// Function to start the bot
async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    // Save authentication state on changes
    sock.ev.on('creds.update', saveState);

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            } else {
                unlinkSync('./auth_info.json');
                console.log('Logged out. Please delete auth_info.json and restart the bot.');
            }
        } else if (connection === 'open') {
            console.log('Connected successfully');
        }
    });

    // Handle incoming messages
    sock.ev.on('messages.upsert', async (m) => {
        console.log(JSON.stringify(m, undefined, 2));

        const msg = m.messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const messageType = Object.keys(msg.message)[0];

        // Example: Echo received messages
        if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
            const text = msg.message.conversation || msg.message.extendedTextMessage.text;
            await sock.sendMessage(from, { text: `You said: ${text}` });
        }
    });
}

// Start the bot
startBot();
