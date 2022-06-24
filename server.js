const path = require("path");
var app = require('fastify')();
var io = require('socket.io')(app.server);


var users = {};


app.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// Formbody lets us parse incoming forms
app.register(require("@fastify/formbody"));

// View is a templating manager for fastify
app.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
});


// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}


io.on('connection', (socket) => {
  console.log('a user connected ->', socket.id);
  
  socket.emit("connected", {id: socket.id, users: users});
  
  socket.on("submit name", (response) => {
    if(Object.values(users).indexOf(response) != -1){
      socket.emit("name registered", response);
    } else {
      users[socket.id] = response;
      socket.broadcast.emit("submitted name", {name: response, id: socket.id});
    }
  });
  
  socket.on("send message", (response) => {
    const {message, usersAddedToChat} = response;
    
    for(let id in usersAddedToChat){
      socket.broadcast.to(id).emit("sended message", {message: message, 
                                                      name: users[socket.id],
                                                      id: socket.id});
    }
  });
  
  socket.on('disconnect', () => {
    delete users[socket.id];
    socket.broadcast.emit("disconnected", socket.id);
    console.log('user disconnected ->', socket.id);
  });
});


app.get("/", function (request, reply) {
  return reply.view("/src/pages/index.hbs");
});


// Run the server and report out to the logs
app.listen({port: 3000});
