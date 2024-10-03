// Initialize socket connection to the server
const socket = io('/');

// Get reference to the video grid element where video streams will be displayed
const videoGrid = document.getElementById('video-grid');

// Create a new Peer connection with specified host and port (for P2P video)
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
});

var myVideoStream;  // Stores the local video stream
const myVideo = document.createElement('video');  // Create a video element for the local video
myVideo.muted = true;  // Mute own video to avoid hearing own audio feedback
const peers = {};  // Store peer connections by userId
var participants = [];  // Track participant userIds

// Request access to the user's media (video and audio)
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;  // Save the stream
  addVideoStream(myVideo, stream);  // Add local video stream to the video grid

  // Handle incoming calls from other users
  myPeer.on('call', call => {
    call.answer(stream);  // Answer the call with the local stream
    const video = document.createElement('video');  // Create video element for the incoming stream
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);  // Display the other user's video stream
    });
  });

  // When a new user connects, establish a P2P connection and add them to participants
  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream);
    participants.push(userId);  // Add the new user to participants list
  });

  // Handle chat input, send message on Enter key or button click
  const text = $("#chat_message");

  $('html').keypress(function (e) {
    if (e.which == 13 && text.val().length !== 0) {  // If Enter is pressed
      sendMessage();  // Send message
    }
  });

  $(".send_button").click(function () {
    if (text.val().length !== 0) {  // If message input is not empty
      sendMessage();  // Send message
    }
  });

  // Function to send message to the server with the client's ID
  function sendMessage() {
    socket.emit('message', { message: text.val(), userId: myPeer.id });
    text.val('');  // Clear message input after sending
  }

  // Receive and display messages in the chat
  socket.on("createMessage", data => {
    $("ul").append(`<li class="message"><b>${data.userId}</b><br/>${data.message}</li>`);
    scrollToBottom();  // Auto-scroll chat to the bottom
  });
});

// Handle user disconnection
socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close();  // Close the connection with the disconnected user
  participants = participants.filter(id => id !== userId);  // Remove the user from participants list
});

// Update participant list with existing users
socket.on('current-participants', (existingParticipants) => {
  participants = [...new Set([...participants, ...existingParticipants])];  // Merge existing participants
});

// Notify the server when the peer connection is open (user joins the room)
myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);  // Send room ID and peer ID to the server
  participants.push(id);  // Add self to participants list
});

// Connect to a new user and establish a P2P call
function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);  // Initiate call with the new user
  const video = document.createElement('video');  // Create video element for the new user's stream
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);  // Display their video stream
  });
  call.on('close', () => {
    video.remove();  // Remove video when call is closed
  });
  peers[userId] = call;  // Store the call object for future reference
}

// Add a video stream to the video grid
function addVideoStream(video, stream) {
  video.srcObject = stream;  // Set the video source to the stream
  video.addEventListener('loadedmetadata', () => {
    video.play();  // Start playing the video once metadata is loaded
  });
  videoGrid.append(video);  // Add the video element to the grid
}

// Auto-scroll the chat window to the latest message
const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}

// Toggle mute/unmute of the microphone
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;  // Mute the audio
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;  // Unmute the audio
  }
}

// Toggle video play/stop (turn on/off the camera)
const playStop = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;  // Stop the video
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;  // Start the video
  }
}

// Handle the chat window toggle (open/close chat)
$(document).ready(function () {
  const chatButton = document.querySelector('.chat__button');
  const chatWindow = document.querySelector('.main__right');
  const videoContainer = document.querySelector('.main__left');
  
  $(chatButton).click(function () {
    if (chatWindow.style.display === 'none') {
      chatWindow.style.display = 'flex';  // Show chat window
      videoContainer.style.flex = '0.8';  // Adjust video container size
    } else {
      chatWindow.style.display = 'none';  // Hide chat window
      videoContainer.style.flex = '1';  // Full video container width
    }
  });
});

// Function to generate a random password for the Security feature
function generateRandomPassword(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
      result += characters[Math.floor(Math.random() * charactersLength)];
  }
  return result;
}

// Handle the Security button click (display client ID and password)
const password = generateRandomPassword(8);  // Generate an 8-character password
$('.security_button').click(function () {
  const clientId = myPeer.id;
  alert(`Client ID: ${clientId}\nPassword: ${password}`);  // Show an alert with client ID and password
});

// Set the Mute button UI
const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `;
  document.querySelector('.main__mute_button').innerHTML = html;
}

// Set the Unmute button UI
const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `;
  document.querySelector('.main__mute_button').innerHTML = html;
}

// Set the Stop Video button UI
const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `;
  document.querySelector('.main__video_button').innerHTML = html;
}

// Set the Play Video button UI
const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `;
  document.querySelector('.main__video_button').innerHTML = html;
}

// Handle participant button click (show a list of current participants)
$(document).ready(function () {
  
  $(".main__controls__participant").click(function () {
    alert('Participants:\n' + participants.join('\n'));  // Show participants in an alert
  });
});
