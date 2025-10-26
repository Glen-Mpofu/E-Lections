const express = require("express")
const { Pool } = require("pg")
const students = require("./students/students")
const candidates = require("./candidates/candidates")
const app = express()
const bcrypt = require("bcrypt")
const session = require("express-session")
const cors = require("cors")
const path = require('path');
const database = process.env.DATABASE_URL

const jwt = require("jsonwebtoken")
require("dotenv").config();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

pool.connect()
    .then(() => console.log("✅ Connected to PostgreSQL Database"))
    .catch(err => console.error("❌ Database Connection Error:", err));

app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
});

app.use(express.json({ limit: "10mb" }));
app.use(session({
    secret: "electionssession1",
    remove: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 // 1 day. the session stays alive for 1 day
    },
    rolling: true
}));

const port = process.env.PORT || 5002
app.listen(port, () => {
    console.log(`Listening in on Port ${port}`)
})

const JWT_SECRET = process.env.JWT_SECRET

const cDir = path.join(__dirname, "candidate_photos")
app.use("/candidate_photos", express.static(cDir))
console.log(cDir)

pool.query("Select version();").
    then((res) => {
        console.log("Database Connected")
        console.log("Version " + res.rows[0].version)
    }).catch((e) => console.log("Database Connection Error: " + e))

// STUDENT TABLE
pool.query(`
        CREATE TABLE IF NOT EXISTS STUDENT 
        (
            StudentNumber VARCHAR(9) PRIMARY KEY,
            PIN VARCHAR(3),
            hasVoted BOOLEAN DEFAULT FALSE
        );
    `).then((res) => {
    console.log("Student Table Ready")

    registerStudents()
    console.log("Students Registered")
}).catch(err => {
    console.log(err)
});

// CANDIDATE TABLE
pool.query(`
    CREATE TABLE IF NOT EXISTS Candidate 
    (
        StudentNumber VARCHAR(9) PRIMARY KEY,
        PIN VARCHAR(3) NOT NULL, 
        Photo VARCHAR(255) NOT NULL,
        Names VARCHAR(100) NOT NULL
    )
`).then((res) => {
    console.log("Candidate Table Ready")
    registerCandidates()
    console.log("Candidates Registered")
}).catch(err => {
    console.log(err)
});

//VOTE TABLE
pool.query(
    `
    CREATE TABLE IF NOT EXISTS VOTE
    (
        StudentNumber VARCHAR(9) REFERENCES STUDENT(StudentNumber) NOT NULL,
        VOTE int NOT NULL,
        CANDIDATENUMBER VARCHAR(9) REFERENCES Candidate(StudentNumber) NOT NULL
    );
    `
).then((res) => {
    console.log("Vote Table Ready")
}).catch(err => {
    console.log(err)
});

async function registerStudents() {

    for (let index = 0; index < students.length; index++) {
        const student = students[index]
        pool.query(
            `
                INSERT INTO STUDENT (STUDENTNUMBER, PIN)
                VALUES($1, $2)
                ON CONFLICT DO NOTHING
            `,
            [student.studentNumber, student.pin]
        )
    }

    const insertStudents = ``
}

async function registerCandidates() {

    for (let index = 0; index < candidates.length; index++) {
        const candidate = candidates[index]
        pool.query(`
            INSERT INTO CANDIDATE (STUDENTNUMBER, PIN, PHOTO, NAMES)
            values($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
            `,
            [candidate.studentNumber, candidate.studentNumber.substring(6), candidate.photo, candidate.names])
    }

}

async function getCandidates() {
    const results = await pool.query(
        `
            SELECT * FROM CANDIDATE;
        `
    )
    return results.rows
}

async function getStudent(studentNum) {
    const results = await pool.query(
        `
            SELECT * FROM Student where StudentNumber = $1 ;
        `,
        [studentNum]
    )
    return results.rows
}

function getStudentNumberFromToken(token) {
    const decoded = jwt.verify(token, "SECRET_KEY");
    const studentnumber = decoded.studentnumber;

    return studentnumber;
}

async function getVotes(studNumber) {
    const result = await pool.query(`
        Select * from VOTE WHERE STUDENTNUMBER = $1
        `, [studNumber]
    )

    return result.rows
}

app.get("/getCandidates", async (req, res) => {
    console.log("GET /getCandidates hit");
    const candidates = await getCandidates();
    console.log("Candidates from DB:", candidates)

    res.send({ status: "ok", data: candidates })
})

app.post("/getStudent", async (req, res) => {
    console.log(req.body)

    const student = req.body.studentData
    const studCheck = await getStudent(student.studNumber);
    const studentnumber = req.body.studentData.studNumber

    if (studCheck.length === 0) {
        return res.send({ status: "notFromLajazz", data: "Only Students From La-Jazz Can Participate in the Elections" })
    }

    if (studCheck[0].pin.trim() != student.pin.trim()) {
        return res.send({ status: "passwordWrong", data: "Wrong Pin" })
    }

    if ((await getVotes(studentnumber)).length > 0) {
        return res.send({ status: "alreadyVoted", data: "You've already voted though we appreciate your dedication" })
    }

    const token = jwt.sign({ studentnumber: studentnumber }, "SECRET_KEY", { expiresIn: "2d" })
    req.session.user = { studentnumber }
    console.log("Session Created: ", req.session)

    res.send({ status: "ok", data: "Student Can Now Place Their Votes", token: token })
})

app.post("/placeVotes", async (req, res) => {
    console.log("Here in place votes")
    const auth = req.headers.authorization
    const token = auth.substring(7)
    const studentVotes = req.body.studentVote
    console.log(studentVotes)
    const studentNumber = getStudentNumberFromToken(token)
    console.log(studentNumber)

    //inserting into the Votes table
    for (let index = 0; index < studentVotes.length; index++) {
        //console.log(studentVotes[index])
        const studentVote = studentVotes[index]
        pool.query(
            `
                INSERT INTO VOTE(studentnumber, vote, candidatenumber)
                VALUES($1, $2, $3);
            `, [studentNumber, studentVote.votes, studentVote.studentNumber]
        ).then((result) => {
            if (result <= 0) {
                console.log("Couldn't insert vote")
            } else {
                console.log("Vote inserted")
            }
        }).catch(err => {
            console.error(err)
        })
    }

    //UPDATE THE STUDENT TABLE TO SHOW THEY'VE VOTED
    pool.query(
        `
            UPDATE STUDENT SET HASVOTED = $1 WHERE STUDENTNUMBER = $2;
        `, [true, studentNumber]
    ).then((result) => {
        if (result <= 0) {
            console.log("hasVoted value wasn't changed")
        } else {
            console.log("hasVoted value was changed")
        }
    }).catch(err => {
        console.error(err)
    })

    res.send({ status: "ok", data: "Student Vote Placed" })
})

app.get("/", async (req, res) => {
    console.log("Server")
    res.send({ status: "ok", data: "Server is up" })
})
