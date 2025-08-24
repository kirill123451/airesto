<template>
  <div
    class="event-block"
    :class="[event.type, event.status]"
    :style="eventStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="event-content">
      <div class="event-name">{{ eventName }}</div>
      <div class="event-time">{{ eventTime }}</div>
    </div>
  </div>
</template>

<script>
import { formatTime } from '../utils/timeUtils'

export default {
  props: {
    event: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      isHovered: false,
    }
  },
  computed: {
    eventName() {
      if (this.event.type === 'reservation') {
        return this.event.name_for_reservation
      } else {
        return 'Заказ'
      }
    },
    eventTime() {
      const start = new Date(this.event.start)
      const end = new Date(this.event.end)
      return `${formatTime(start)}-${formatTime(end)}`
    },
    eventStyle() {
      return {
        position: 'absolute',
        top: '2px',
        left: '2px',
        right: '2px',
        bottom: '2px',
      }
    },
  },
  methods: {
    handleMouseEnter() {
      this.isHovered = true
    },
    handleMouseLeave() {
      this.isHovered = false
    },
  },
}
</script>

<style scoped>
.event-block {
  padding: 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  overflow: hidden;
  z-index: 2;
  transition: all 0.2s ease;
}

.event-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.event-name {
  font-weight: bold;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-time {
  font-size: 9px;
  opacity: 0.8;
}

.event-block.reservation {
  background: #e8f5e9;
  border: 1px solid #66bb6a;
  color: #2e7d32;
}

.event-block.order {
  background: #fff3e0;
  border: 1px solid #ffa726;
  color: #ef6c00;
}

.event-block:hover {
  opacity: 0.9;
  transform: scale(1.02);
  z-index: 3;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.event-block.reservation.Новая {
  background: #bbdefb;
  border-color: #64b5f6;
  color: #0d47a1;
}

.event-block.reservation.Живая очередь {
  background: #ffecb3;
  border-color: #ffd54f;
  color: #ff6f00;
}

.event-block.order.New {
  background: #c8e6c9;
  border-color: #81c784;
  color: #1b5e20;
}

.event-block.order.Closed {
  opacity: 0.6;
  background: #f5f5f5;
  border-color: #bdbdbd;
  color: #757575;
}
</style>
