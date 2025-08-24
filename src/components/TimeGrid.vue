<template>
  <div class="time-grid-container" :class="theme">
    <div class="zoom-controls">
      <button @click="zoomOut" title="Уменьшить масштаб" :disabled="zoomLevel <= minZoom">
        🔍➖
      </button>
      <span>Масштаб: {{ Math.round(100 + zoomLevel * 20) }}%</span>
      <button @click="zoomIn" title="Увеличить масштаб" :disabled="zoomLevel >= maxZoom">
        🔍➕
      </button>
    </div>

    <div class="grid-wrapper">
      <!-- Фиксированный заголовок времени -->
      <div class="grid-header" ref="header">
        <div class="time-header">
          <div class="table-header-placeholder" :style="{ width: tableHeaderWidth + 'px' }">
            <div class="placeholder-content">Стол / Время</div>
          </div>
          <div
            v-for="timeSlot in timeSlots"
            :key="timeSlot"
            class="time-slot-header"
            :style="{ width: cellWidth + 'px' }"
          >
            {{ formatTimeDisplay(timeSlot) }}
          </div>
        </div>
      </div>

      <!-- Основная таблица с прокруткой -->
      <div class="grid-body" ref="body" @scroll="syncScroll">
        <div
          v-for="table in tables"
          :key="table.id"
          class="table-row"
          :style="{ height: cellHeight + 'px' }"
        >
          <!-- Фиксированный заголовок стола -->
          <div class="table-header" :style="{ width: tableHeaderWidth + 'px' }">
            <div class="table-info">
              <div class="table-number">Стол {{ table.number }}</div>
              <div class="table-capacity">{{ table.capacity }} чел.</div>
              <div class="table-zone">{{ table.zone }}</div>
            </div>
          </div>

          <!-- Ячейки времени -->
          <div
            v-for="timeSlot in timeSlots"
            :key="timeSlot"
            class="time-cell"
            :style="{ width: cellWidth + 'px' }"
            @mousedown="startSelection(table, timeSlot, $event)"
            @mouseenter="updateSelection(table, timeSlot)"
            @mouseup="endSelection"
            :class="{
              selected: isCellSelected(table.id, timeSlot),
              'has-event': hasEvent(table, timeSlot),
            }"
          >
            <!-- Отображение событий -->
            <template v-if="getEventsAtTime(table, timeSlot).length > 0">
              <div
                v-for="(event, index) in getEventsAtTime(table, timeSlot)"
                :key="`${event.id}-${index}`"
                class="event-display"
                :class="getEventClasses(event)"
                :style="getEventStyle(event, timeSlot, index)"
                @mouseenter="hoverEvent = event"
                @mouseleave="hoverEvent = null"
              >
                <div class="event-content">
                  <div class="event-name">
                    {{ getEventShortName(event) }}
                  </div>
                  <div class="event-time">
                    {{ getEventTime(event) }}
                  </div>
                  <div class="event-guests">{{ getEventGuests(event) }} чел.</div>
                </div>
              </div>
            </template>

            <!-- Подсказка при наведении -->
            <div v-if="isHoveringEvent(table, timeSlot)" class="event-tooltip">
              {{ getEventTooltip(getEventsAtTime(table, timeSlot)[0]) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Индикатор выделения -->
    <div v-if="selection.active" class="selection-info">
      Выбрано: {{ selection.tables.size }} столов, {{ Math.round(selectionDuration / 60) }} минут
      <button @click="confirmSelection" class="confirm-btn">Создать</button>
      <button @click="cancelSelection" class="cancel-btn">Отмена</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'TimeGrid',
  props: {
    tables: Array,
    openingTime: String,
    closingTime: String,
    currentDate: String,
    theme: {
      type: String,
      default: 'light',
    },
  },
  emits: ['create-booking'],
  setup(props, { emit }) {
    const zoomLevel = ref(0)
    const minZoom = -2
    const maxZoom = 3
    const baseCellWidth = 80
    const baseCellHeight = 50
    const tableHeaderWidth = 150
    const header = ref(null)
    const body = ref(null)
    const hoverEvent = ref(null)
    const isMouseDown = ref(false)

    const selection = ref({
      active: false,
      startTable: null,
      startTime: null,
      tables: new Set(),
      timeSlots: new Set(),
    })

    const timeSlots = computed(() => {
      const slots = []
      const [startHour, startMinute] = props.openingTime.split(':').map(Number)
      const [endHour, endMinute] = props.closingTime.split(':').map(Number)

      let currentHour = startHour
      let currentMinute = startMinute

      while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
        slots.push(
          `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`,
        )
        currentMinute += 30
        if (currentMinute >= 60) {
          currentHour++
          currentMinute = 0
        }
      }

      return slots
    })

    const cellWidth = computed(() => baseCellWidth + zoomLevel.value * 16)
    const cellHeight = computed(() => baseCellHeight + zoomLevel.value * 4)

    const selectionDuration = computed(() => {
      if (selection.value.timeSlots.size === 0) return 0
      return selection.value.timeSlots.size * 30
    })

    const zoomIn = () => {
      if (zoomLevel.value < maxZoom) {
        zoomLevel.value++
      }
    }

    const zoomOut = () => {
      if (zoomLevel.value > minZoom) {
        zoomLevel.value--
      }
    }

    const syncScroll = () => {
      if (header.value && body.value) {
        header.value.scrollLeft = body.value.scrollLeft
      }
    }

    const formatTimeDisplay = (timeSlot) => {
      const [hours, minutes] = timeSlot.split(':')
      return minutes === '00' ? `${hours}:00` : `${hours}:${minutes}`
    }

    const startSelection = (table, timeSlot, event) => {
      // Проверяем, не начали ли мы выделение на событии
      if (event.target.closest('.event-display')) {
        return
      }

      isMouseDown.value = true
      selection.value = {
        active: true,
        startTable: table,
        startTime: timeSlot,
        tables: new Set([table.id]),
        timeSlots: new Set([timeSlot]),
      }
    }

    const updateSelection = (table, timeSlot) => {
      if (!isMouseDown.value || !selection.value.active) return

      selection.value.tables.add(table.id)
      selection.value.timeSlots.add(timeSlot)
    }

    const endSelection = () => {
      isMouseDown.value = false
      if (!selection.value.active) return

      // Если выделена только одна ячейка, активируем выделение
      if (selection.value.tables.size > 0 && selection.value.timeSlots.size > 0) {
        selection.value.active = true
      } else {
        selection.value.active = false
      }
    }

    const isCellSelected = (tableId, timeSlot) => {
      return selection.value.tables.has(tableId) && selection.value.timeSlots.has(timeSlot)
    }

    const confirmSelection = () => {
      if (selection.value.tables.size > 0 && selection.value.timeSlots.size > 0) {
        const timeSlotsArray = Array.from(selection.value.timeSlots).sort()
        const startTime = timeSlotsArray[0]
        const endTime = calculateEndTime(timeSlotsArray[timeSlotsArray.length - 1])

        emit('create-booking', {
          active: true,
          tables: Array.from(selection.value.tables),
          startTime: `${props.currentDate}T${startTime}:00`,
          endTime: `${props.currentDate}T${endTime}:00`,
        })
      }
    }

    const cancelSelection = () => {
      selection.value = {
        active: false,
        tables: new Set(),
        timeSlots: new Set(),
      }
    }

    const resetSelection = () => {
      cancelSelection()
    }

    const calculateEndTime = (lastSlot) => {
      const [hours, minutes] = lastSlot.split(':').map(Number)
      let endHour = hours
      let endMinute = minutes + 30

      if (endMinute >= 60) {
        endHour++
        endMinute = endMinute - 60
      }

      return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
    }

    const hasEvent = (table, timeSlot) => {
      return getEventsAtTime(table, timeSlot).length > 0
    }

    const getEventsAtTime = (table, timeSlot) => {
      const slotTime = new Date(`${props.currentDate}T${timeSlot}:00+10:00`)
      const events = []

      // Проверяем бронирования
      for (const reservation of table.reservations) {
        const start = new Date(reservation.seating_time)
        const end = new Date(reservation.end_time)
        if (slotTime >= start && slotTime < end) {
          events.push({ ...reservation, type: 'reservation' })
        }
      }

      // Проверяем заказы
      for (const order of table.orders) {
        const start = new Date(order.start_time)
        const end = new Date(order.end_time)
        if (slotTime >= start && slotTime < end) {
          events.push({ ...order, type: 'order' })
        }
      }

      return events
    }

    const getEventStyle = (event, timeSlot, index) => {
      const slotTime = new Date(`${props.currentDate}T${timeSlot}:00+10:00`)
      const start = new Date(event.type === 'reservation' ? event.seating_time : event.start_time)
      const end = new Date(event.type === 'reservation' ? event.end_time : event.end_time)

      const duration = (end - start) / (1000 * 60) // длительность в минутах
      const position = (slotTime - start) / (1000 * 60) // позиция от начала в минутах

      const width = (duration / 30) * 100 - 4
      const left = (position / 30) * 100 + 2

      // Для нескольких событий в одной ячейке немного смещаем их
      const top = 2 + ((index * 20) % 40)

      return {
        width: `${width}%`,
        left: `${left}%`,
        top: `${top}%`,
        height: '60px',
        zIndex: index + 1,
      }
    }

    const getEventClasses = (event) => {
      const classes = [event.type, event.status]
      if (event.type === 'reservation') {
        classes.push(event.status.toLowerCase().replace(' ', '-'))
      }
      return classes
    }

    const getEventShortName = (event) => {
      if (event.type === 'reservation') {
        return event.name_for_reservation.split(' ')[0]
      }
      return 'Заказ'
    }

    const getEventTime = (event) => {
      const start = new Date(event.type === 'reservation' ? event.seating_time : event.start_time)
      const end = new Date(event.type === 'reservation' ? event.end_time : event.end_time)

      return `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
    }

    const getEventGuests = (event) => {
      return event.type === 'reservation' ? event.num_people : '-'
    }

    const getEventTooltip = (event) => {
      if (event.type === 'reservation') {
        return `${event.name_for_reservation} - ${event.num_people} чел. (${event.status})`
      }
      return `Заказ (${event.status})`
    }

    const isHoveringEvent = (table, timeSlot) => {
      const events = getEventsAtTime(table, timeSlot)
      return hoverEvent.value && events.length > 0 && events[0].id === hoverEvent.value.id
    }

    // Обработка событий мыши для всего документа
    const handleDocumentMouseUp = () => {
      endSelection()
    }

    onMounted(() => {
      if (body.value) {
        body.value.addEventListener('scroll', syncScroll)
      }
      document.addEventListener('mouseup', handleDocumentMouseUp)
    })

    onUnmounted(() => {
      if (body.value) {
        body.value.removeEventListener('scroll', syncScroll)
      }
      document.removeEventListener('mouseup', handleDocumentMouseUp)
    })

    return {
      zoomLevel,
      minZoom,
      maxZoom,
      timeSlots,
      cellWidth,
      cellHeight,
      tableHeaderWidth,
      header,
      body,
      selection,
      selectionDuration,
      hoverEvent,
      zoomIn,
      zoomOut,
      syncScroll,
      formatTimeDisplay,
      startSelection,
      updateSelection,
      endSelection,
      isCellSelected,
      confirmSelection,
      cancelSelection,
      resetSelection,
      hasEvent,
      getEventsAtTime,
      getEventStyle,
      getEventClasses,
      getEventShortName,
      getEventTime,
      getEventGuests,
      getEventTooltip,
      isHoveringEvent,
    }
  },
}
</script>

<style scoped>
.time-grid-container {
  width: 100%;
  height: 70vh;
  overflow: hidden;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  position: relative;
  transition: all 0.3s ease;
}

.time-grid-container.dark {
  background: #1a1a1a;
  border-color: #444;
}

.zoom-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
  background: white;
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.time-grid-container.dark .zoom-controls {
  background: #2a2a2a;
  border-color: #444;
  color: white;
}

.zoom-controls button {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 16px;
  transition: border-color 0.3s;
}

.zoom-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.time-grid-container.dark .zoom-controls button {
  border-color: #666;
}

.zoom-controls button:hover:not(:disabled) {
  background: #f5f5f5;
}

.time-grid-container.dark .zoom-controls button:hover:not(:disabled) {
  background: #333;
}

.grid-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.grid-header {
  flex-shrink: 0;
  background: white;
  border-bottom: 2px solid #eee;
  overflow: hidden;
  z-index: 10;
  transition: all 0.3s ease;
}

.time-grid-container.dark .grid-header {
  background: #2a2a2a;
  border-color: '444';
}

.time-header {
  display: flex;
  background: #f8f9fa;
  height: 60px;
  transition: background-color 0.3s;
}

.time-grid-container.dark .time-header {
  background: #2a2a2a;
}

.table-header-placeholder {
  border-right: 2px solid #ddd;
  background: #f8f9fa;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.3s ease;
}

.time-grid-container.dark .table-header-placeholder {
  background: #2a2a2a;
  border-color: #444;
  color: white;
}

.time-slot-header {
  padding: 10px 5px;
  border-right: 1px solid #ddd;
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 100%;
  transition: all 0.3s ease;
}

.time-grid-container.dark .time-slot-header {
  border-color: #444;
  background: #2a2a2a;
  color: white;
}

.grid-body {
  overflow: auto;
  flex-grow: 1;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #eee;
  min-height: 60px;
  transition: border-color 0.3s;
}

.time-grid-container.dark .table-row {
  border-color: #444;
}

.table-header {
  position: sticky;
  left: 0;
  background: white;
  z-index: 5;
  border-right: 2px solid #ddd;
  display: flex;
  align-items: center;
  padding: 0 10px;
  background: #f8f9fa;
  flex-shrink: 0;
  height: 100%;
  transition: all 0.3s ease;
}

.time-grid-container.dark .table-header {
  background: #2a2a2a;
  border-color: #444;
  color: white;
}

.table-info {
  text-align: center;
  width: 100%;
  line-height: 1.3;
}

.table-number {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 2px;
}

.table-capacity {
  font-size: 12px;
  color: #666;
}

.time-grid-container.dark .table-capacity {
  color: #ccc;
}

.table-zone {
  font-size: 10px;
  color: #888;
  margin-top: 2px;
}

.time-grid-container.dark .table-zone {
  color: #999;
}

.time-cell {
  border-right: 1px solid #eee;
  position: relative;
  padding: 2px;
  flex-shrink: 0;
  cursor: pointer;
  min-height: 60px;
  transition: all 0.3s ease;
  user-select: none;
}

.time-grid-container.dark .time-cell {
  border-color: #444;
}

.time-cell:hover {
  background-color: #f0f8ff;
}

.time-grid-container.dark .time-cell:hover {
  background-color: #2a3a4a;
}

.time-cell.selected {
  background-color: rgba(33, 150, 243, 0.2);
}

.time-grid-container.dark .time-cell.selected {
  background-color: rgba(33, 150, 243, 0.3);
}

.time-cell.has-event {
  background-color: rgba(76, 175, 80, 0.1);
}

.time-grid-container.dark .time-cell.has-event {
  background-color: rgba(76, 175, 80, 0.2);
}

.event-display {
  position: absolute;
  padding: 4px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s ease;
  z-index: 2;
}

.event-content {
  overflow: hidden;
}

.event-name {
  font-weight: bold;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
}

.event-time {
  font-size: 9px;
  opacity: 0.8;
}

.event-guests {
  font-size: 9px;
  opacity: 0.8;
}

.event-display.reservation {
  background: #e8f5e9;
  border: 1px solid #66bb6a;
  color: #2e7d32;
}

.event-display.order {
  background: #fff3e0;
  border: 1px solid #ffa726;
  color: #ef6c00;
}

.event-display.Новая {
  background: #bbdefb;
  border-color: #64b5f6;
  color: #0d47a1;
}

.event-display.Живая-очередь {
  background: #ffecb3;
  border-color: #ffd54f;
  color: #ff6f00;
}

.event-display.New {
  background: #c8e6c9;
  border-color: #81c784;
  color: #1b5e20;
}

.event-display.Closed {
  opacity: 0.6;
  background: #f5f5f5;
  border-color: #bdbdbd;
  color: #757575;
}

.time-grid-container.dark .event-display {
  opacity: 0.9;
}

.event-display:hover {
  opacity: 0.9;
  transform: scale(1.02);
  z-index: 3;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.event-tooltip {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
}

.selection-info {
  position: fixed;
  bottom: 80px;
  right: 30px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s ease;
}

.time-grid-container.dark .selection-info {
  background: #2a2a2a;
  color: white;
}

.confirm-btn,
.cancel-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.confirm-btn {
  background: #4caf50;
  color: white;
}

.cancel-btn {
  background: #f5f5f5;
  color: #333;
}

.time-grid-container.dark .confirm-btn {
  background: #388e3c;
}

.time-grid-container.dark .cancel-btn {
  background: #666;
  color: white;
}

.confirm-btn:hover {
  background: #45a049;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.time-grid-container.dark .confirm-btn:hover {
  background: #2e7d32;
}

.time-grid-container.dark .cancel-btn:hover {
  background: #555;
}

@media (max-width: 1200px) {
  .time-slot-header {
    font-size: 11px;
    padding: 5px 3px;
  }
}
</style>
