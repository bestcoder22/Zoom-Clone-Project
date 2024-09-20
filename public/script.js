const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})
let myVideoStream;
const myVideo = document.createElement('video')
myVideo.muted = true;
const peers = {}
let participants = [];

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream)
  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream);
    participants.push(userId);
  })

  // input value and send message on button click or pressing Enter
  let text = $("#chat_message");

  $('html').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {
      sendMessage();
    }
  });

  $(".send_button").click(function () {
    if (text.val().length !== 0) {
      sendMessage();
    }
  });

  function sendMessage() {
    // Send message with the client's ID
    socket.emit('message', { message: text.val(), userId: myPeer.id });
    text.val('');
  }

  socket.on("createMessage", data => {
    $("ul").append(`<li class="message"><b>${data.userId}</b><br/>${data.message}</li>`);
    scrollToBottom();
  });
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close();
  participants = participants.filter(id => id !== userId);
})

socket.on('current-participants', (existingParticipants) => {
  participants = [...new Set([...participants, ...existingParticipants])];
});

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
  participants.push(id);
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

// script.js
document.addEventListener('DOMContentLoaded', () => {
  const chatButton = document.querySelector('.main__controls__button:nth-child(3)');
  const chatWindow = document.querySelector('.main__right');
  const videoContainer = document.querySelector('.main__left');
  
  chatButton.addEventListener('click', () => {
    if (chatWindow.style.display === 'none') {
      chatWindow.style.display = 'flex';
      videoContainer.style.flex = '0.8';
    } else {
      chatWindow.style.display = 'none';
      videoContainer.style.flex = '1';
    }
  });
});


const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}
document.addEventListener('DOMContentLoaded', () => {
  const participantsDiv = document.querySelector('.main__controls__participant'); // Assuming this is your participant div class
  
  participantsDiv.addEventListener('click', () => {
    alert('Participants:\n' + participants.join('\n'));
  });
});