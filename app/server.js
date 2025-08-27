const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Tambahin whitelist origin
app.use(cors({
  origin: [
    "https://kasir-neon.vercel.app", // frontend vercel kamu
    "http://localhost:3000"          // biar bisa test lokal juga
  ],
  methods: ["GET", "POST", "DELETE"],
  credentials: true
}));

app.use(bodyParser.json());

// Setup Socket.io dengan CORS juga
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://kasir-neon.vercel.app",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"]
  }
});

// ---- API kamu tetap sama ---- //
const DATA_FILE = path.join(__dirname, "belanja.json");

let belanja = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    belanja = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch (err) {
    belanja = [];
  }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(belanja, null, 2));
}
function emitUpdate() {
  io.emit("updateBelanja", belanja);
}

app.get("/api/belanja", (req, res) => res.json(belanja));

app.post("/api/belanja", (req, res) => {
  const { nama, harga } = req.body;
  if (!nama || !harga) return res.status(400).json({ message: "Nama dan harga wajib diisi" });

  const newItem = { id: belanja.length ? belanja[belanja.length - 1].id + 1 : 1, nama, harga };
  belanja.push(newItem);
  saveData();
  emitUpdate();
  res.status(201).json(newItem);
});

app.delete("/api/belanja/:id", (req, res) => {
  const id = parseInt(req.params.id);
  belanja = belanja.filter(item => item.id !== id);
  saveData();
  emitUpdate();
  res.json({ message: `Item dengan id ${id} dihapus` });
});

// ---- Socket.io ---- //
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.emit("updateBelanja", belanja);

  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
