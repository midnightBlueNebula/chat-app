const path = require("path");
var app = require('fastify')();
var io = require('socket.io')(app.server);

// Removes first element equals to argument from array.
Array.prototype.remove = function(el){
  const index = this.indexOf(el);
  
  if(index == -1){
    return false;
  }

  this.splice(index, 1);
  return true;
}

var users = {}; // socket id -> key, username -> value.
var blockedUsers = {}; // socket id of blocked user - > key, array of
                       // blocking users's socket ids -> value.


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
    this.id = socket.id;
    this.socket.emit("connected", users);
  }
  
  registerUser(name){
    if(Object.values(users).indexOf(name) != -1){
      this.socket.emit("name registered", name);
    } else {
      this.name = name;
      users[this.id] = name;
      const response = {name: name, id: this.id};
      this.socket.emit("submitted name for user", name);
      this.socket.broadcast.emit("submitted name", response);
    }
  }
  
  sendMessage(response){
    const {message, usersAddedToChat} = response;
    
    for(let id in usersAddedToChat){
      if(this.isBlockedBy(id)){
        this.socket.emit("You are blocked", users[id]);
        continue;
      }
      
      this.socket.broadcast.to(id).emit("sended message", {message: message, 
                                                      name: users[this.id],
                                                      id: this.id});
    }
  }
  
  blockUser(response){
    const blockedId = response;
    
    if(!blockedUsers[blockedId]){
      blockedUsers[blockedId] = [];
    } else if(this.isBlocked(blockedId)) {
      return;
    }
    
    blockedUsers[blockedId].push(this.id);
  }
  
  unblockUser(response){
    const blockedId = response;
    
    if(!blockedUsers[blockedId]){
      return;
    } 
    
    blockedUsers[blockedId].remove(this.id);
  }
  
  // returns true if argument id is blocked by this user.
  isBlocked(blockedId){
    return blockedUsers[blockedId] && blockedUsers[blockedId].indexOf(this.id) != -1; 
  }
  
  // returns true if this user is blocked by argument id.
  isBlockedBy(blockerId){
    return blockedUsers[this.id] && blockedUsers[this.id].indexOf(blockerId) != -1; 
  }
  
  disconnect(){
    delete users[this.id];
    this.socket.broadcast.emit("disconnected", this.id);
    console.log('user disconnected ->', this.id);
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
  
  socket.on("block user", (response) => {
    user.blockUser(response);
  })
  
  socket.on('disconnect', () => {
    user.disconnect();
  });
});


app.get("/", function (request, reply) {
  return reply.view("/src/pages/index.hbs");
});


// Run the server and report out to the logs
app.listen({port: 3000});
