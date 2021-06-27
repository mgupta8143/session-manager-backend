const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
const cors = require('cors');

const PORT = process.env.PORT | 3030;
app.use(express.json());
app.use(cors());

const sessions = {};

io.on('connection', socket => {


    socket.on("connect_session", (userData) => {

        if(!(userData.sessionId in sessions)) {
            socket.emit("session_not_available");
            return;
        } 

        socket.room = userData.sessionId;
        socket.join(socket.room);

        sessions[socket.room].participants[socket.id] = userData.name;
        const participantList = getDictionaryValues(sessions[socket.room].participants)
        
        io.to(socket.room).emit("update_participant_list", participantList);
    });

    socket.on('disconnect', () => {
        delete sessions[socket.room].participants[socket.id];
        const participantList = getDictionaryValues(sessions[socket.room].participants)
        io.to(socket.room).emit("update_participant_list", participantList);
        io.to(socket.room).emit("clear_local_storage");

        if(Object.keys(sessions[socket.room].participants).length === 0) {
            delete sessions[socket.room];
        }

        socket.room = null;
    })
});

const getDictionaryValues = (dic) => {
    list = [];
    for(let key in dic) {
        list.push(dic[key]);
    }
    return list;
}

const createNewSession = (sessionInfo) => {
    if (!sessionInfo) return;
    if (sessionInfo.sessionId in sessions) return;

    sessions[sessionInfo.sessionId] = {
        participants: {},
        participantList: {}
    };
}

app.post("/create-session", (req, res) => {
    createNewSession(req.body);
    res.end();
});


http.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`); 
});