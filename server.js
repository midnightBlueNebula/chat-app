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


class User {
  constructor(socket){
    this.socket = socket;
    this.socket.emit("connected", {id: this.socket.id, users: users});
  }
  
  registerUser(name){
    if(Object.values(users).indexOf(name) != -1){
      this.socket.emit("name registered", name);
    } else {
      users[this.socket.id] = name;
      this.socket.broadcast.emit("submitted name", {name: name, 
                                                    id: this.socket.id});
    }
  }
  
  sendMessage(response){
    const {message, usersAddedToChat} = response;
    
    for(let id in usersAddedToChat){
      this.socket.broadcast.to(id).emit("sended message", {message: message, 
                                                      name: users[this.socket.id],
                                                      id: this.socket.id});
    }
  }
  
  disconnect(){
    delete users[this.socket.id];
    this.socket.broadcast.emit("disconnected", this.socket.id);
    console.log('user disconnected ->', this.socket.id);
  }
}


io.on('connection', (socket) => {
  console.log('a user connected ->', socket.id);
  
  var user = new User(socket);
    
  socket.on("submit name", (response) => {
    user.registerUser(response);
  });
  
  socket.on("send message", (response) => {
    user.sendMessage(response);
  });
  
  socket.on('disconnect', () => {
    user.disconnect();
  });
});


app.get("/", function (request, reply) {
  return reply.view("/src/pages/index.hbs");
});


// Run the server and report out to the logs
app.listen({port: 3000});
