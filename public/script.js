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


function addUserToOnlineList(name, id) {
  let user = document.createElement("div");
  let addUserButton = document.createElement("button");

  user.innerText = name;
  user.id = "add-" + id;
  addUserButton.innerText = "Add";
  addUserButton.setAttribute("socketId", id);
  addUserButton.setAttribute("name", name);
  addUserButton.addEventListener("click", addUser);

  user.appendChild(addUserButton);
  onlineUsers.appendChild(user);
}


function addUser(event){
  let socketId = event.target.getAttribute("socketId");
  let name = event.target.getAttribute("name");
  
  if(usersAddedToChat[socketId]){
    alert("User has already been added to chat.")
    return;
  }
  
  usersAddedToChat[socketId] = name;
  
  let user = document.createElement("div");
  let removeUserButton = document.createElement("button");

  user.innerText = name;
  user.id = "del-" + socketId;
  removeUserButton.innerText = "Remove";
  removeUserButton.setAttribute("socketId", socketId);
  removeUserButton.setAttribute("name", name);
  removeUserButton.addEventListener("click", removeUser);

  user.appendChild(removeUserButton);
  addedUsers.appendChild(user);
}


function removeUser(event){
  let socketId = event.target.getAttribute("socketId");
  let user = addedUsers.querySelector(`#del-${socketId}`);
  
  delete usersAddedToChat[socketId];
  addedUsers.removeChild(user);
}


nameForm.addEventListener("submit", function (event) {
  event.preventDefault();
  
  userName = nameForm.name.value;

  socket.emit("submit name", userName);
});


chatForm.addEventListener("submit", function (event) {
  event.preventDefault();
  
  if(Object.keys(usersAddedToChat).length == 0){
    alert("No users added to chat.");
    return;
  }
  
  let message = chatForm.message.value;
  let messageDiv = document.createElement("div");
  
  messageDiv.innerText = userName + " -> " + message;
  chat.appendChild(messageDiv);

  socket.emit("send message", {message, usersAddedToChat});
});


socket.on("submitted name for user", (response) => {
  let name = response.name;
  let id = response.id;
  
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
  
  let messageDiv = document.createElement("div");
  messageDiv.innerText = name + " -> " + message;
  
  chat.appendChild(messageDiv);
});


socket.on("connected", (response) => {
  const {id, users} = response;
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