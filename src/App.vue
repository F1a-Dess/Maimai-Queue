<script setup>
import io from 'socket.io-client';
import PlayerList from './components/PlayerList.vue';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to server', socket.id);
  socket.emit('message', 'Hello from frontend');
});

socket.on('message', (data) => {
  console.log('Message from server:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// Listen for current player updates
socket.on('currentPlayerUpdate', (player) => {
  console.log('Current player updated:', player);
  // Emit the event to update the current player in PlayerList
  socket.emit('updateCurrentPlayer', player);
});
</script>

<template>
  <PlayerList />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
