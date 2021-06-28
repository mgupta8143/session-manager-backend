const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "https://session-manager.vercel.app",
        methods: ["GET", "POST"]
    }
});
const cors = require('cors');
const host = '0.0.0.0';


const port = process.env.PORT || 3030;
app.use(express.json());
app.use(cors({origin:true,credentials: true}));



const sessions = {};

io.on('connection', socket => {


    socket.on("connect_session", (userData) => {

        //if the session hasn't been created or a name hasn't been inputted, go back to join page
        if(!(userData.sessionId in sessions) || !userData.name) {
            socket.emit("session_not_available");
            return;
        } 

        socket.room = userData.sessionId;
        socket.join(socket.room);

        //for the sockets session add a new participant 
        sessions[socket.room].participants[socket.id] = userData.name;

        //this takes O(n) time (could be reduced to O(1) but had no time)
        const participantList = getDictionaryValues(sessions[socket.room].participants);
        
        //update participant list
        io.to(socket.room).emit("update_participant_list", participantList);
    });

    socket.on('disconnect', () => {
        if(sessions[socket.room]) {
            //delete the participant from the dictionary
            delete sessions[socket.room].participants[socket.id];

            //update the participant list on all clients
            const participantList = getDictionaryValues(sessions[socket.room].participants)
            io.to(socket.room).emit("update_participant_list", participantList);

            //clear client local storage of name
            io.to(socket.room).emit("clear_local_storage");

            //if there are no participants in the session delete the session entirely
            if(sessions[socket.room] && Object.keys(sessions[socket.room].participants).length === 0) {
                delete sessions[socket.room];
            }
        }

        socket.room = null;
    })
});

/**
 * Returns the values of an object in list format
 * @param {Object} dic 
 * @returns {List} list 
 */
const getDictionaryValues = (dic) => {
    list = [];
    for(let key in dic) {
        list.push(dic[key]);
    }
    return list;
}

/**
 * Creates a new session 
 * @param {Object} sessionInfo 
 * @returns {void}
 */
const createNewSession = (sessionInfo) => {
    if (!sessionInfo) return;
    if (sessionInfo.sessionId in sessions) return;

    sessions[sessionInfo.sessionId] = {
        participants: {},
        participantList: {}
    };
}

app.get("/", (req, res) => {
    res.send("hello");
})

// POST Request to create new session
app.post("/create-session", (req, res) => {
    createNewSession(req.body);
    res.end();
});


http.listen(port, () => {
    console.log(`Listening on port ${PORT}`); 
});