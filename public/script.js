var nameFormDiv = document.querySelector("#name-form-div");
var nameForm = document.querySelector("#name-form");

var appDiv = document.querySelector("#app-container");
var userNameDiv = document.querySelector("#user-name");
var chatForm = document.querySelector("#chat-form");
var chat = document.querySelector("#chat");
var onlineUsers = document.querySelector("#online-users");
var addedUsers = document.querySelector("#added-users");

var usersAddedToChat = {};
var userName;


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
                                               name, socketId, addUser);

  user.innerText = name;
  user.id = "add-" + socketId;

  user.appendChild(addUserButton);
  onlineUsers.appendChild(user);
}


function addMessageToChat(isUser, name, message){
  let messageDiv = document.createElement("div");
  let className = "message";
  
  messageDiv.className = className;
  messageDiv.innerText = name + " -> " + message;
  
  chat.appendChild(messageDiv);
  
  if(isUser){
    className += " user-message";
  } else {
    const socketId = getSocketIdByName(name);
    
    const addButton = createButtonForUserEvent("add", "add add-"+socketId, 
                                             name, socketId, addUser);
    
    const blockButton = createButtonForUserEvent("block", "block block-"+socketId, 
                                               name, socketId, blockUser);
    
    messageDiv.appendChild(addButton);
    messageDiv.appendChild(blockButton);
  }
}


function addUser(event){
  const socketId = event.target.getAttribute("socketId");
  const name = event.target.getAttribute("name");
  
  if(usersAddedToChat[socketId]){
    alert("User has already been added to chat.")
    return;
  }
  
  usersAddedToChat[socketId] = name;
  
  let user = document.createElement("div");
  let removeUserButton = createButtonForUserEvent("Remove", "remove-button", 
                                                  name, socketId, removeUser);

  user.innerText = name;
  user.id = "del-" + socketId;

  user.appendChild(removeUserButton);
  addedUsers.appendChild(user);
}


function removeUser(event){
  const socketId = event.target.getAttribute("socketId");
  const user = addedUsers.querySelector(`#del-${socketId}`);
  
  delete usersAddedToChat[socketId];
  addedUsers.removeChild(user);
}


function blockUser(event){
  const socketId = event.target.getAttribute("socketId");
  socket.emit("block user", socketId);
}


nameForm.addEventListener("submit", function (event) {
  event.preventDefault();
  
  userName = nameForm.name.value.trim();
  
  if(userName.toLowerCase() == "you"){
    alert("Messages sended by users will be rendered in their device with the sender name 'You'. To prevent confusion please enter another name.");
    return;
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


socket.on("disconnected", (response) => {
  let user = onlineUsers.querySelector(`#add-${response}`);
  onlineUsers.removeChild(user);
  
  if(usersAddedToChat[response]){
    user = addedUsers.querySelector(`#del-${response}`);
    addedUsers.removeChild(user);
    delete usersAddedToChat[response];
  }
});


socket.on("name registered", (response) => {
  let alertMessage = "Username '" + response + "' has already been in use."; 
  alertMessage += " Please enter another username.";
  alert(alertMessage)
});