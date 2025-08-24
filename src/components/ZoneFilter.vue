<template>
  <div class="zone-filter">
    <label>Зоны:</label>
    <div class="zone-checkboxes">
      <label v-for="zone in zones" :key="zone">
        <input
          type="checkbox"
          :checked="isZoneEnabled(zone)"
          @change="$emit('zone-toggle', zone, $event.target.checked)"
        />
        {{ zone }}
      </label>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    zones: {
      type: Array,
      required: true,
    },
    enabledZones: {
      type: Array,
      required: true,
    },
  },
  methods: {
    isZoneEnabled(zone) {
      return this.enabledZones.includes(zone)
    },
  },
}
</script>

<style scoped>
.zone-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.zone-filter label {
  font-weight: 600;
  color: #333;
}

.zone-checkboxes {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.zone-checkboxes label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-weight: normal;
}
</style>
