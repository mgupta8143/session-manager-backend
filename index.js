const express = require('express');
const app = express();
const cors = require('cors');

const PORT = process.env.PORT | 3030;
app.use(express.json());
app.use(cors());

const sessions = {}

const createNewSession = (sessionInfo) => {
    if (!sessionInfo) return;

    sessions[sessionInfo.sessionId] = {
        sessionName: sessionInfo.sessionName,
        participants: [sessionInfo.name]
    };
}

app.post("/create-session", (req, res) => {
    createNewSession(req.body);
    res.end();
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`); 
});