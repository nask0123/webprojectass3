const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const session = require("express-session");
// const multer = require("multer");
// const path = require("path");

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "https://webproject-jdv7.onrender.com", // ✅ Adjust for frontend
    credentials: true
}));
app.use(express.static("public"));

app.set("view engine", "ejs");

// ✅ Session setup
app.use(session({
    secret: "664ebf1f9c5ff3b89bcab52e2d16729f9a023e829fe1037de7ce0e2c6d6397be",  
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 } // Secure false for localhost
}));

// ✅ Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/ass3", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Mongoose User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model("users", userSchema);

app.get("/", (req, res) => {
    res.render("login");
});

// ✅ Render Signup Page
app.get("/signup", (req, res) => {
    res.render("signup");
});

// ✅ Register User
app.post("/signup", async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.send("User already exists. Choose a different username.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        console.log("User registered:", newUser);
        res.redirect("/");
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).send("Error signing up");
    }
});

// ✅ Login User
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.send("Invalid credentials.");
        }

        req.session.userId = user._id;
        console.log("✅ User logged in:", req.session.userId);

        res.redirect("/index");
    } catch (error) {
        console.error("❌ Login error:", error);
        res.status(500).send("Error logging in");
    }
});

// ✅ Protected Index Route
app.get("/index", (req, res) => {
    console.log("🔍 Checking session:", req.session.userId);

    if (!req.session.userId) {
        return res.redirect("/");
    }

    res.send(`<h2>Welcome, you are logged in!</h2>`);
});

const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
