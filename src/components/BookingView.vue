<template>
  <div class="booking-view" :class="theme">
    <div class="header">
      <h1>Бронирования - {{ restaurant.restaurant_name }}</h1>
      <div class="header-controls">
        <div class="current-time">
          Текущее время ресторана: {{ currentRestaurantTime }} ({{ restaurant.timezone }})
        </div>
        <button @click="toggleTheme" class="theme-toggle">
          {{ theme === 'light' ? '🌙 Тёмная' : '☀️ Светлая' }}
        </button>
      </div>
    </div>

    <div class="controls">
      <div class="control-group">
        <div class="date-control">
          <label>Дата:</label>
          <select v-model="selectedDate" @change="loadData">
            <option v-for="day in availableDays" :key="day" :value="day">
              {{ formatDate(day) }}
            </option>
          </select>
        </div>

        <div class="search-control">
          <label>Поиск по имени:</label>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Введите имя"
            @input="handleSearch"
          />
        </div>
      </div>

      <div class="zone-control">
        <label>Зоны:</label>
        <div class="zone-checkboxes">
          <div v-for="zone in availableZones" :key="zone" class="zone-checkbox">
            <input type="checkbox" :value="zone" :id="'zone-' + zone" v-model="enabledZones" />
            <label :for="'zone-' + zone">{{ zone }}</label>
          </div>
        </div>
      </div>
    </div>

    <TimeGrid
      ref="timeGrid"
      :tables="filteredTables"
      :opening-time="restaurant.opening_time"
      :closing-time="restaurant.closing_time"
      :current-date="selectedDate"
      :theme="theme"
      @create-booking="handleCreateBooking"
      v-if="!isLoading && restaurantData"
    />

    <div v-else class="loading">Загрузка данных...</div>

    <!-- Кнопка создания бронирования -->
    <div v-if="selection.active" class="create-booking-fab">
      <button @click="openCreateModal" class="fab-button">📅 Создать бронирование</button>
    </div>

    <!-- Модальное окно создания бронирования -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Создание бронирования</h2>
          <button class="close-btn" @click="closeCreateModal">×</button>
        </div>

        <div class="modal-body">
          <div class="booking-info">
            <p><strong>Выбранные столы:</strong> {{ selectedTableNumbers }}</p>
            <p><strong>Дата:</strong> {{ formatModalDate(selection.startTime) }}</p>
            <p>
              <strong>Время:</strong>
              {{ formatModalTime(selection.startTime, selection.endTime) }}
            </p>
          </div>

          <form @submit.prevent="submitBooking" class="booking-form">
            <div class="form-group">
              <label for="customerName">Имя клиента *</label>
              <input
                id="customerName"
                type="text"
                v-model="bookingForm.customerName"
                required
                placeholder="Введите имя клиента"
              />
            </div>

            <div class="form-group">
              <label for="phoneNumber">Телефон</label>
              <input
                id="phoneNumber"
                type="tel"
                v-model="bookingForm.phoneNumber"
                placeholder="+7 (999) 999-99-99"
              />
            </div>

            <div class="form-group">
              <label for="numPeople">Количество гостей *</label>
              <input
                id="numPeople"
                type="number"
                v-model="bookingForm.numPeople"
                min="1"
                :max="maxCapacity"
                required
                placeholder="Введите количество гостей"
              />
              <span class="hint">Макс. вместимость выбранных столов: {{ maxCapacity }} чел.</span>
            </div>

            <div class="form-group">
              <label for="notes">Дополнительная информация</label>
              <textarea
                id="notes"
                v-model="bookingForm.notes"
                placeholder="Особые пожелания или комментарии"
                rows="3"
              />
            </div>

            <div class="form-actions">
              <button type="button" class="btn-cancel" @click="closeCreateModal">Отмена</button>
              <button type="submit" class="btn-submit">Создать бронирование</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { bookingApi } from '../services/mockData'
import TimeGrid from './TimeGrid.vue'

export default {
  name: 'BookingView',
  components: {
    TimeGrid,
  },
  setup() {
    const restaurantData = ref(null)
    const selectedDate = ref('')
    const enabledZones = ref([])
    const isLoading = ref(true)
    const currentRestaurantTime = ref('')
    const updateInterval = ref(null)
    const searchQuery = ref('')
    const theme = ref('light')
    const selection = ref({
      active: false,
      tables: [],
      startTime: null,
      endTime: null,
    })
    const showCreateModal = ref(false)
    const bookingForm = ref({
      customerName: '',
      numPeople: 1,
      phoneNumber: '',
      notes: '',
    })
    const timeGrid = ref(null)

    const availableDays = computed(() => {
      return restaurantData.value ? restaurantData.value.available_days : []
    })

    const restaurant = computed(() => {
      return restaurantData.value ? restaurantData.value.restaurant : {}
    })

    const availableZones = computed(() => {
      if (!restaurantData.value) return []
      const zones = new Set(restaurantData.value.tables.map((table) => table.zone))
      return Array.from(zones)
    })

    const tables = computed(() => {
      return restaurantData.value ? restaurantData.value.tables : []
    })

    const filteredTables = computed(() => {
      if (!restaurantData.value) return []

      let filtered = restaurantData.value.tables.filter((table) =>
        enabledZones.value.includes(table.zone),
      )

      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter((table) => {
          return table.reservations.some((res) =>
            res.name_for_reservation.toLowerCase().includes(query),
          )
        })
      }

      return filtered
    })

    const selectedTableNumbers = computed(() => {
      if (!selection.value.tables.length) return ''

      return selection.value.tables
        .map((tableId) => {
          const table = tables.value.find((t) => t.id === tableId)
          return table ? `Стол ${table.number}` : ''
        })
        .filter(Boolean)
        .join(', ')
    })

    const maxCapacity = computed(() => {
      if (!selection.value.tables.length) return 0

      return selection.value.tables.reduce((max, tableId) => {
        const table = tables.value.find((t) => t.id === tableId)
        return table ? Math.max(max, table.capacity) : max
      }, 0)
    })

    const loadData = async () => {
      isLoading.value = true
      try {
        const data = await bookingApi.getBookingData(selectedDate.value)
        restaurantData.value = data

        // Автоматически выбираем все зоны
        if (enabledZones.value.length === 0) {
          enabledZones.value = [...availableZones.value]
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
        // В случае ошибки показываем сообщение
        alert('Не удалось загрузить данные. Пожалуйста, проверьте подключение к интернету.')
      } finally {
        isLoading.value = false
      }
    }

    const updateRestaurantTime = () => {
      if (restaurantData.value) {
        const now = new Date()
        const options = {
          timeZone: restaurant.value.timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }
        try {
          currentRestaurantTime.value = now.toLocaleTimeString('ru-RU', options)
        } catch (e) {
          // Fallback на локальное время, если временная зона не поддерживается
          currentRestaurantTime.value = now.toLocaleTimeString('ru-RU')
        }
      }
    }

    const startTimeUpdate = () => {
      updateRestaurantTime()
      updateInterval.value = setInterval(updateRestaurantTime, 1000)
    }

    const stopTimeUpdate = () => {
      if (updateInterval.value) {
        clearInterval(updateInterval.value)
      }
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    }

    const formatModalDate = (dateTimeString) => {
      if (!dateTimeString) return ''
      const date = new Date(dateTimeString)
      return date.toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    const formatModalTime = (startTime, endTime) => {
      if (!startTime || !endTime) return ''

      const start = new Date(startTime)
      const end = new Date(endTime)

      return `${start.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })} - ${end.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    }

    const toggleTheme = () => {
      theme.value = theme.value === 'light' ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', theme.value)
    }

    const handleSearch = () => {
      // Поиск происходит в computed свойстве
    }

    const handleCreateBooking = (bookingData) => {
      selection.value = bookingData
    }

    const openCreateModal = () => {
      if (selection.value.active) {
        // Установим количество людей по умолчанию равное максимальной вместимости
        bookingForm.value.numPeople = maxCapacity.value
        showCreateModal.value = true
      }
    }

    const closeCreateModal = () => {
      showCreateModal.value = false
      bookingForm.value = {
        customerName: '',
        numPeople: 1,
        phoneNumber: '',
        notes: '',
      }
    }

    const submitBooking = async () => {
      try {
        const bookingPayload = {
          table_ids: selection.value.tables,
          start_time: selection.value.startTime,
          end_time: selection.value.endTime,
          customer_name: bookingForm.value.customerName,
          num_people: parseInt(bookingForm.value.numPeople),
          phone_number: bookingForm.value.phoneNumber,
          notes: bookingForm.value.notes,
          status: 'Новая',
        }

        console.log('Отправка данных бронирования:', bookingPayload)

        // Отправляем данные на сервер
        await bookingApi.createBooking(bookingPayload)

        // Обновляем данные после успешного создания бронирования
        await loadData()

        // Закрываем модальное окно и сбрасываем выделение
        closeCreateModal()
        selection.value = {
          active: false,
          tables: [],
          startTime: null,
          endTime: null,
        }

        // Сбрасываем выделение в TimeGrid
        if (timeGrid.value) {
          timeGrid.value.resetSelection()
        }

        // Показываем уведомление об успехе
        alert('Бронирование успешно создано!')
      } catch (error) {
        console.error('Ошибка при создании бронирования:', error)
        alert('Произошла ошибка при создании бронирования. Попробуйте еще раз.')
      }
    }

    onMounted(() => {
      // Загружаем текущую дату по умолчанию
      const today = new Date().toISOString().split('T')[0]
      selectedDate.value = today
      loadData()
      startTimeUpdate()
    })

    onUnmounted(() => {
      stopTimeUpdate()
    })

    return {
      restaurantData,
      selectedDate,
      enabledZones,
      isLoading,
      currentRestaurantTime,
      searchQuery,
      theme,
      selection,
      showCreateModal,
      bookingForm,
      availableDays,
      restaurant,
      availableZones,
      tables,
      filteredTables,
      selectedTableNumbers,
      maxCapacity,
      timeGrid,
      loadData,
      formatDate,
      formatModalDate,
      formatModalTime,
      toggleTheme,
      handleSearch,
      handleCreateBooking,
      openCreateModal,
      closeCreateModal,
      submitBooking,
    }
  },
}
</script>

<style scoped>
.booking-view {
  padding: 20px;
  font-family: 'Arial', sans-serif;
  max-width: 100%;
  overflow-x: auto;
  min-height: 100vh;
  transition: all 0.3s ease;
}

.booking-view.light {
  background-color: #ffffff;
  color: #333333;
}

.booking-view.dark {
  background-color: #1a1a1a;
  color: #ffffff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.current-time {
  font-size: 14px;
  color: #666;
}

.booking-view.dark .current-time {
  color: #ccc;
}

.theme-toggle {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.booking-view.dark .theme-toggle {
  background: #333;
  border-color: #555;
  color: white;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.booking-view.dark .controls {
  background: #2a2a2a;
}

.control-group {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.date-control,
.search-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 250px;
}

.date-control select,
.search-control input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: all 0.3s ease;
}

.booking-view.dark .date-control select,
.booking-view.dark .search-control input {
  background: #333;
  color: white;
  border-color: #555;
}

.zone-control {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.zone-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.zone-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.loading {
  text-align: center;
  padding: 60px;
  font-size: 18px;
  color: #666;
  background: #f9f9f9;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.booking-view.dark .loading {
  background: #2a2a2a;
  color: #ddd;
}

.create-booking-fab {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

.fab-button {
  padding: 16px 24px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.fab-button:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.booking-view.dark .modal-content {
  background: #2a2a2a;
  color: #fff;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.booking-view.dark .modal-header {
  border-color: #444;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.booking-view.dark .modal-header h2 {
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.booking-view.dark .close-btn {
  color: #ccc;
}

.booking-view.dark .close-btn:hover {
  color: #fff;
}

.modal-body {
  padding: 20px;
}

.booking-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.booking-view.dark .booking-info {
  background: #333;
}

.booking-info p {
  margin: 5px 0;
  color: #555;
}

.booking-view.dark .booking-info p {
  color: #ccc;
}

.booking-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: 600;
  color: #333;
}

.booking-view.dark .form-group label {
  color: #fff;
}

.form-group input,
.form-group textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.booking-view.dark .form-group input,
.booking-view.dark .form-group textarea {
  background: #333;
  color: #fff;
  border-color: #555;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  display: block;
}

.booking-view.dark .hint {
  color: #999;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel,
.btn-submit {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: #f5f5f5;
  color: #333;
}

.booking-view.dark .btn-cancel {
  background: #555;
  color: #fff;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.booking-view.dark .btn-cancel:hover {
  background: #666;
}

.btn-submit {
  background: #4caf50;
  color: white;
}

.btn-submit:hover {
  background: #45a049;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .control-group {
    flex-direction: column;
    gap: 15px;
  }

  .date-control,
  .search-control {
    min-width: 100%;
  }

  .zone-checkboxes {
    flex-direction: column;
    gap: 8px;
  }

  .create-booking-fab {
    bottom: 20px;
    right: 20px;
  }

  .fab-button {
    padding: 12px 20px;
    font-size: 14px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-submit {
    width: 100%;
  }
}
</style>
