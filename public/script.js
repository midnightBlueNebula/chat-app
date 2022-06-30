var nameFormDiv = document.querySelector("#name-form-div");
var nameForm = document.querySelector("#name-form");

var appDiv = document.querySelector("#app-container");
var userNameDiv = document.querySelector("#user-name");
var chatForm = document.querySelector("#chat-form");
var chat = document.querySelector("#chat");
var onlineUsers = document.querySelector("#online-users");
var addedUsers = document.querySelector("#added-users");


var userName;
// key -> socket id, value -> username.
var usersAddedToChat = {};
var blockedUsers = {};


function getSocketIdByName(name){
  const target = onlineUsers.querySelector(`button[name='${name}']`)
  
  if(target){
    return target.getAttribute("socketId"); 
  }
}


function createButtonForUserEvent(buttonName, className, username, socketId, event){
  let button = document.createElement("button");
  
  button.innerText = buttonName;
  button.className = className; 
  button.setAttribute("name", username);
  button.setAttribute("socketId", socketId);
  button.addEventListener("click", event);
  
  return button;
}


function addUserToOnlineList(name, socketId) {
  let user = document.createElement("div");
  let addUserButton = createButtonForUserEvent("Add", "add-button", 
                                               name, socketId, addUserToChat);

  user.innerText = name;
  user.id = "add-" + socketId;

  user.appendChild(addUserButton);
  onlineUsers.appendChild(user);
}


function removeUserFromClient(socketId){
  let user = onlineUsers.querySelector(`#add-${socketId}`);
  onlineUsers.removeChild(user);
  
  if(usersAddedToChat[socketId]){
    user = addedUsers.querySelector(`#del-${socketId}`);
    addedUsers.removeChild(user);
    delete usersAddedToChat[socketId];
  }
  
  const messages = chat.querySelectorAll("div.message-"+socketId);
  
  if(messages.length){
    messages.forEach((message) => {chat.removeChild(message)}); 
  }
}


function addMessageToChat(isUser, name, message){
  let messageDiv = document.createElement("div");
  messageDiv.innerText = name + " -> " + message;
  
  chat.appendChild(messageDiv);
  
  if(isUser){
    messageDiv.className = "user-message";
    return;
  }
  
  const socketId = getSocketIdByName(name);
    
  messageDiv.className = "message-" + socketId;
  
  const addButton = createButtonForUserEvent("add", "add add-"+socketId, 
                                             name, socketId, addUserToChat);
    
  const blockButton = createButtonForUserEvent("block", "block block-"+socketId, 
                                               name, socketId, blockUser);
    
  messageDiv.appendChild(addButton);
  messageDiv.appendChild(blockButton);
}


function addUserToChat(event){
  const socketId = event.target.getAttribute("socketId");
  const name = event.target.getAttribute("name");
  
  if(usersAddedToChat[socketId]){
    alert("User has already been added to chat.")
    return;
  }
  
  usersAddedToChat[socketId] = name;
  
  let user = document.createElement("div");
  let removeUserButton = createButtonForUserEvent("Remove", "remove-button", 
                                                  name, socketId, removeUserFromChat);

  user.innerText = name;
  user.id = "del-" + socketId;

  user.appendChild(removeUserButton);
  addedUsers.appendChild(user);
}


function removeUserFromChat(event){
  const socketId = event.target.getAttribute("socketId");
  const user = addedUsers.querySelector(`#del-${socketId}`);
  
  delete usersAddedToChat[socketId];
  addedUsers.removeChild(user);
}


function blockUser(event){
  const socketId = event.target.getAttribute("socketId");
  const name     = event.target.getAttribute("name");
  
  if(blockedUsers[socketId]){
    alert("User has already been blocked.");
    return;
  }
  
  blockedUsers[socketId] = name;
  removeUserFromClient(socketId);
  
  socket.emit("block user", socketId);
}


nameForm.addEventListener("submit", function (event) {
  event.preventDefault();
  
  userName = nameForm.name.value.trim();
  
  if(userName.toLowerCase() == "you"){
    alert("Messages sended by users will be rendered in their device with the sender name 'You'. To prevent confusion please enter another name.");
    return;
  }
  
  if(userName == ""){
    alert("You must enter a username.");
    return
  }

  socket.emit("submit name", userName);
});


chatForm.addEventListener("submit", function (event) {
  event.preventDefault();
  
  if(Object.keys(usersAddedToChat).length == 0){
    alert("No users added to chat.");
    return;
  }
  
  let message = chatForm.message.value.trim();
  
  if(message == ""){
    alert("You can't send empty message");
    return;
  }
  
  addMessageToChat(true, "You", message);

  socket.emit("send message", {message, usersAddedToChat});
});


socket.on("submitted name for user", (response) => {
  const name = response
  
  nameFormDiv.style.display = "none";
  appDiv.style.display = "block";
  userNameDiv.innerText = name;
});


socket.on("submitted name", (response) => {
  let name = response.name;
  let id = response.id;
  
  addUserToOnlineList(name, id);
});


socket.on("sended message", (response) => {
  const {message, name, id} = response;
  
  addMessageToChat(false, name, message);
});


socket.on("blocking news", (response) => {
  const {name, socketId} = response;
  const alertMessage = name + " has blocked you.";
  
  alert(alertMessage);
  removeUserFromClient(socketId);
})


socket.on("You are blocked", (response) => {
  const alertMessage = "You are blocked by " + response + ".";
  
  alert(alertMessage);
})


socket.on("connected", (response) => {
  const users = response;
  for(let id in users){
    addUserToOnlineList(users[id], id);
  }
})


socket.on("name registered", (response) => {
  let alertMessage = "Username '" + response + "' has already been in use."; 
  alertMessage += " Please enter another username.";
  alert(alertMessage)
});


socket.on("disconnected", (response) => {
  removeUserFromClient(response);
});