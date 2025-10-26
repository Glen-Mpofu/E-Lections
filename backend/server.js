const express = require("express");
const { Pool } = require("pg");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const students = require("./students/students");
const candidates = require("./candidates/candidates");

const app = express();

// PostgreSQL Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
});

// CORS
const allowedOrigins = ["http://localhost:8081", "https://your-frontend-domain.com"];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Logging
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
});

// JSON parser
app.use(express.json({ limit: "10mb" }));

// Session middleware
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: "user_sessions"
    }),
    secret: process.env.SESSION_SECRET || "electionssession1",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24, secure: false } // set secure:true in production with HTTPS
}));

// Static folder for candidate photos
const cDir = path.join(__dirname, "candidate_photos");
app.use("/candidate_photos", express.static(cDir));

// Connect to DB
pool.connect()
    .then(() => console.log("✅ Connected to PostgreSQL Database"))
    .catch(err => console.error("❌ Database Connection Error:", err));

// Initialize tables
async function initTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS STUDENT (
            StudentNumber VARCHAR(9) PRIMARY KEY,
            PIN VARCHAR(3),
            hasVoted BOOLEAN DEFAULT FALSE
        );
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS CANDIDATE (
            StudentNumber VARCHAR(9) PRIMARY KEY,
            PIN VARCHAR(3) NOT NULL,
            Photo VARCHAR(255) NOT NULL,
            Names VARCHAR(100) NOT NULL
        );
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS VOTE (
            StudentNumber VARCHAR(9) REFERENCES STUDENT(StudentNumber) NOT NULL,
            VOTE INT NOT NULL,
            CANDIDATENUMBER VARCHAR(9) REFERENCES CANDIDATE(StudentNumber) NOT NULL
        );
    `);
}
initTables().then(() => {
    console.log("Tables are ready.");
    registerStudents();
    registerCandidates();
});

// Seed data
async function registerStudents() {
    for (let student of students) {
        await pool.query(
            `INSERT INTO STUDENT (STUDENTNUMBER, PIN) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [student.studentNumber, student.pin]
        );
    }
}
async function registerCandidates() {
    for (let candidate of candidates) {
        await pool.query(
            `INSERT INTO CANDIDATE (STUDENTNUMBER, PIN, PHOTO, NAMES)
             VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
            [candidate.studentNumber, candidate.studentNumber.substring(6), candidate.photo, candidate.names]
        );
    }
}

// Helpers
async function getStudent(studentNum) {
    const res = await pool.query(`SELECT * FROM STUDENT WHERE StudentNumber=$1`, [studentNum]);
    return res.rows[0];
}

async function getCandidates() {
    const res = await pool.query(`SELECT * FROM CANDIDATE`);
    return res.rows;
}

async function getVotes(studNumber) {
    const res = await pool.query(`SELECT * FROM VOTE WHERE StudentNumber=$1`, [studNumber]);
    return res.rows;
}

function getStudentNumberFromToken(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");
    return decoded.studentnumber;
}

// Routes
app.get("/", (req, res) => res.send({ status: "ok", data: "Server is up" }));

app.get("/getCandidates", async (req, res) => {
    const candidates = await getCandidates();
    res.send({ status: "ok", data: candidates });
});

app.post("/getStudent", async (req, res) => {
    const { studentData } = req.body;
    const student = await getStudent(studentData.studNumber);

    if (!student) return res.send({ status: "notFromLajazz", data: "Only Students From La-Jazz Can Participate" });
    if (student.PIN.trim() !== studentData.pin.trim()) return res.send({ status: "passwordWrong", data: "Wrong Pin" });

    if ((await getVotes(studentData.studNumber)).length > 0) {
        return res.send({ status: "alreadyVoted", data: "You've already voted" });
    }

    const token = jwt.sign({ studentnumber: studentData.studNumber }, process.env.JWT_SECRET || "SECRET_KEY", { expiresIn: "2d" });
    req.session.user = { studentnumber: studentData.studNumber };

    res.send({ status: "ok", data: "Student can now place votes", token });
});

app.post("/placeVotes", async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).send({ status: "error", data: "No auth token" });
    const token = auth.split(" ")[1];
    const studentNumber = getStudentNumberFromToken(token);
    const { studentVote } = req.body;

    for (let vote of studentVote) {
        await pool.query(
            `INSERT INTO VOTE(StudentNumber, Vote, CandidateNumber) VALUES($1, $2, $3)`,
            [studentNumber, vote.votes, vote.studentNumber]
        );
    }

    await pool.query(`UPDATE STUDENT SET hasVoted = TRUE WHERE StudentNumber = $1`, [studentNumber]);
    res.send({ status: "ok", data: "Student vote placed" });
});

// Start server
const port = process.env.PORT || 5002;
app.listen(port, () => console.log(`Listening on port ${port}`));
