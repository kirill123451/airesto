<template>
  <div id="app">
    <BookingView />
  </div>
</template>

<script>
import BookingView from './components/BookingView.vue'

export default {
  name: 'App',
  components: {
    BookingView,
  },
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
}

#app {
  width: 100%;
  min-height: 100vh;
}

[data-theme='dark'] {
  color-scheme: dark;
}
</style>
