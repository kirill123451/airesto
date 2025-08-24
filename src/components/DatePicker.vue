<template>
  <div class="date-picker">
    <label>Дата:</label>
    <select :value="currentDay" @change="$emit('date-change', $event.target.value)">
      <option v-for="day in availableDays" :key="day" :value="day">
        {{ formatDate(day) }}
      </option>
    </select>
  </div>
</template>

<script>
import { formatDate } from '../utils/dateUtils'

export default {
  props: {
    availableDays: {
      type: Array,
      required: true,
    },
    currentDay: {
      type: String,
      required: true,
    },
  },
  methods: {
    formatDate(dateString) {
      return formatDate(dateString)
    },
  },
}
</script>

<style scoped>
.date-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-picker label {
  font-weight: 600;
  color: #333;
}

.date-picker select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}
</style>
