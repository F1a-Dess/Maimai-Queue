<template>
  <div class="player-list-container">
    <!-- Logo Placeholder -->
    <img src="/src/assets/logo/727.png" alt="Logo" class="logo-placeholder" />

    <!-- Current Time -->
    <div>
      <h2>Current Time</h2>
      <p>{{ currentTime || 'Loading...' }}</p>
    </div>

    <!-- Current Player Playing -->
    <h2>Current Player Playing</h2>
    <div class="current-player-playing">
      <div v-if="currentPlayers.length === 0">No one is playing rn.</div>
      <div v-else-if="currentPlayers.length === 1">
        <p>{{ currentPlayers[0] }} is playing solo!!</p>
      </div>
      <div v-else>
        <p>{{ currentPlayers[0] }} is playing with {{ currentPlayers[1] }}!!</p>
      </div>
      <button @click="clearCurrentPlayers">Clear Current Players</button>
    </div>

    <!-- Player list display -->
    <h2>Bemaco Queue List</h2>
    <div class="queue-table">
      <div v-for="(player, index) in players" :key="index" :class="{'selected-player': selectedIndex === index}">
        <div @click="toggleOptions(index)" style="cursor: pointer;">
          {{ player }}
        </div>
        <div v-if="selectedIndex === index" class="button-container">
          <button @click="moveUp(index)" :disabled="index === 0">⬆️</button>
          <button @click="moveDown(index)" :disabled="index === players.length - 1">⬇️</button>
          <button @click="removePlayer(player)">❌</button>
          <button 
            @click="addToCurrentPlayers(player)" 
            :disabled="currentPlayers.length >= 2 || currentPlayers.includes(player)"
          >
            Play
        </button>
        </div>
      </div>
    </div>

    <!-- Player Input Field -->
    <div>
      <div>
        <input
          v-model="newPlayerName"
          placeholder="Player Name"
          type="text"
          @input="checkInput"
        />
      </div>
      <div>
        <button
          @click="addPlayer"
          :disabled="!isInputValid"
        >Add Player
        </button>
      </div>
    </div>
    
    <!-- Refresh Control Section -->
    <div>
      <button @click="refreshQueue" :class="{'refreshed-button': isRefreshed}">
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import io from 'socket.io-client';
import './PlayerListStyle.css'; // Importing the new styles

// Initialize Socket.IO client
const socket = io('http://localhost:3000');
const currentTime = ref('');
const showNotification = ref(false);
const isRefreshed = ref(false);
const buttonText = ref('Refresh Queue');

// Reactive state for the player list
const players = ref([]);
const newPlayerName = ref('');
const isInputValid = ref(false);
const selectedIndex = ref(null); // New state to track the selected player's index
const currentPlayers = ref([]); // New state for current players, updated in real-time

// Check if the input field is valid
const checkInput = () => {
  isInputValid.value = newPlayerName.value.trim().length > 0;
};

// Toggle visibility of options for a player
const toggleOptions = (index) => {
  selectedIndex.value = selectedIndex.value === index ? null : index; // Toggle the selected index
};

// Add a player
const addPlayer = () => {
  if (newPlayerName.value.trim()) {
    console.log('Adding player:', newPlayerName.value.trim()); // Debugging line
    socket.emit('addPlayer', newPlayerName.value.trim());
    console.log('Player emitted:', newPlayerName.value.trim()); // New debugging line
    newPlayerName.value = ''; // Clear the Input field
    isInputValid.value = false; // Disable the button
  } else {
    console.log('Input is invalid'); // Debugging line
  }
};

// Remove a player
const removePlayer = (playerName) => {
  if (confirm(`Are you sure you want to remove ${playerName}?`)) {
    socket.emit('removePlayer', playerName);
  }
};

// Move a player up in the queue
const moveUp = (index) => {
  if (index > 0) {
    socket.emit('movePlayer', { from: index, to: index - 1 });
  }
};

// Move a player down in the queue
const moveDown = (index) => {
  if (index < players.value.length - 1) {
    socket.emit('movePlayer', { from: index, to: index + 1 });
  }
};

// Add player to current players
const addToCurrentPlayers = (player) => {
  if (currentPlayers.value.length < 2 && !currentPlayers.value.includes(player)) {
    const updatedCurrentPlayers = [...currentPlayers.value, player];
    currentPlayers.value = updatedCurrentPlayers;

    // Notify the server of the updated current players
    socket.emit('updateCurrentPlayers', updatedCurrentPlayers);
  }
};

// Clear the current players
const clearCurrentPlayers = () => {
  currentPlayers.value = [];
  socket.emit('updateCurrentPlayers', []); // Notify server to clear the current players
};

// Refresh the player queue
const refreshQueue = () => {
  socket.emit('getPlayers'); // Fetch the latest players
  showNotification.value = true; // Show notification
  buttonText.value = "Queue Refreshed"; // Change button text
  isRefreshed.value = true; // Set refreshed state
  setTimeout(() => {
    showNotification.value = false; // Hide notification after 3 seconds
    buttonText.value = "Refresh Queue"; // Reset button text
    isRefreshed.value = false; // Reset refreshed state
  }, 3000);
};

// Handle real-time updates
socket.on('updatePlayers', ({ players: updatedPlayers }) => {
  players.value = updatedPlayers;
  selectedIndex.value = null; // Reset selected index
});

// Listen for real-time updates for current players
socket.on('currentPlayerUpdate', (updatedCurrentPlayers) => {
  currentPlayers.value = updatedCurrentPlayers;
});

// Emit to all clients when current players are updated
socket.on('updateCurrentPlayers', (updatedCurrentPlayers) => {
  currentPlayers = updatedCurrentPlayers;
  io.emit('currentPlayerUpdate', currentPlayers); // Emits 'currentPlayerUpdate' event
});

socket.on('timeUpdate', (time) => {
  currentTime.value = time;
});

// Handle Socket.IO events
onMounted(() => {
  socket.emit('getPlayers');
});

onUnmounted(() => {
  // Clean up socket listeners when the component is unmounted
  socket.off('updatePlayers');
  socket.off('currentPlayerUpdate');
});
</script>

<style scoped>
.notification {
  background-color: green;
  color: white;
  border-radius: 10px;
  padding: 10px;
  margin: 10px 0;
  text-align: center;
  max-width: 400px;
  align-content: center;
}

.refreshed-button {
  background-color: green; /* Green background for refreshed state */
  color: white; /* White text */
}

.player-list-container {
  padding: 10px;
  display: flex; /* Enable flexbox */
  flex-direction: column; /* Stack items vertically */
}

.logo-placeholder {
  width: 100px; /* Adjust size as needed */
  height: auto;
}

.queue-table {
  background-color: #1a1a1a; /* Set your desired background color */
  border-radius: 15px; /* Rounded corners */
  padding: 10px;
}

.selected-player {
  border: 2px solid purple; /* Glowing purple border */
  border-radius: 7px; /* Rounded corners */
  box-shadow: 0 0 10px purple; /* Glowing effect */
}

.green-bordered-table {
  border: 2px solid green;
  width: 100%;
  margin-top: 10px;
}

.green-bordered-table td {
  border: 1px solid green;
  padding: 10px;
  text-align: center;
}

.button-container {
  display: flex; /* Enable flexbox */
  justify-content: space-between; /* Space between buttons */
  margin-top: 10px; /* Add some margin for spacing */
}
</style>
