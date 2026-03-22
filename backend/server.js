const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/videos", express.static("videos"));

/* ---------------- STORAGE ---------------- */
const storage = multer.diskStorage({
  destination: "videos/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/* ---------------- DATABASE (TEMP) ---------------- */
let users = [];
let videos = [];
let comments = [];

/* ---------------- ACCOUNTS ---------------- */
app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: "User exists" });
  }

  const user = {
    id: Date.now(),
    username,
    password,
    followers: [],
    following: []
  };

  users.push(user);
  res.json(user);
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) return res.status(401).json({ error: "Invalid login" });

  res.json(user);
});

/* ---------------- FOLLOW ---------------- */
app.post("/follow/:id", (req, res) => {
  const target = users.find(u => u.id == req.params.id);
  const current = users[0]; // TEMP USER

  if (target && current) {
    if (!current.following.includes(target.id)) {
      current.following.push(target.id);
      target.followers.push(current.id);
    }
  }

  res.json({ success: true });
});

/* ---------------- UPLOAD VIDEO ---------------- */
app.post("/upload", upload.single("video"), (req, res) => {
  const video = {
    id: Date.now(),
    userId: users[0]?.id || 0,
    user: users[0]?.username || "@you",
    caption: req.body.caption || "New clip 🔥",
    game: req.body.game || "Unknown",
    url: `http://localhost:${PORT}/videos/${req.file.filename}`,
    likes: 0,
    createdAt: Date.now()
  };

  videos.unshift(video);
  res.json(video);
});

/* ---------------- GET VIDEOS ---------------- */
app.get("/videos", (req, res) => {
  const game = req.query.game;

  if (game) {
    return res.json(videos.filter(v => v.game === game));
  }

  res.json(videos);
});

/* ---------------- FOLLOWING FEED ---------------- */
app.get("/feed/following/:userId", (req, res) => {
  const user = users.find(u => u.id == req.params.userId);

  if (!user) return res.json([]);

  const feed = videos.filter(v =>
    user.following.includes(v.userId)
  );

  res.json(feed);
});

/* ---------------- LIKE ---------------- */
app.post("/like/:id", (req, res) => {
  const video = videos.find(v => v.id == req.params.id);
  if (video) video.likes++;
  res.json(video);
});

/* ---------------- COMMENTS ---------------- */
app.post("/comment", (req, res) => {
  const { videoId, text } = req.body;

  const comment = {
    id: Date.now(),
    videoId,
    user: users[0]?.username || "@you",
    text
  };

  comments.push(comment);
  res.json(comment);
});

app.get("/comments/:videoId", (req, res) => {
  const result = comments.filter(c => c.videoId == req.params.videoId);
  res.json(result);
});

/* ---------------- PROFILE ---------------- */
app.get("/profile/:id", (req, res) => {
  const user = users.find(u => u.id == req.params.id);
  const userVideos = videos.filter(v => v.userId == req.params.id);

  res.json({
    user,
    videos: userVideos
  });
});

/* ---------------- SEARCH ---------------- */
app.get("/search", (req, res) => {
  const q = req.query.q?.toLowerCase() || "";

  const videoResults = videos.filter(v =>
    v.caption.toLowerCase().includes(q) ||
    v.game.toLowerCase().includes(q)
  );

  const userResults = users.filter(u =>
    u.username.toLowerCase().includes(q)
  );

  res.json({
    videos: videoResults,
    users: userResults
  });
});

/* ---------------- GAMES (CATEGORIES) ---------------- */
app.get("/games", (req, res) => {
  const games = [...new Set(videos.map(v => v.game))];
  res.json(games);
});

/* ---------------- TRENDING ---------------- */
app.get("/trending", (req, res) => {
  const sorted = [...videos].sort((a, b) => b.likes - a.likes);
  res.json(sorted.slice(0, 10));
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});