<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Создание бронирования</h2>
        <button class="close-btn" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <div class="booking-info">
          <p><strong>Столы:</strong> {{ bookingData.tableIds.join(', ') }}</p>
          <p><strong>Дата:</strong> {{ formatDate(bookingData.startTime) }}</p>
          <p>
            <strong>Время:</strong>
            {{ formatTimeRange(bookingData.startTime, bookingData.endTime) }}
          </p>
        </div>

        <form @submit.prevent="submitBooking">
          <div class="form-group">
            <label for="customerName">Имя клиента *</label>
            <input
              id="customerName"
              type="text"
              v-model="formData.customerName"
              required
              placeholder="Введите имя клиента"
            />
          </div>

          <div class="form-group">
            <label for="numPeople">Количество гостей *</label>
            <input
              id="numPeople"
              type="number"
              v-model="formData.numPeople"
              min="1"
              :max="maxCapacity"
              required
              placeholder="Введите количество гостей"
            />
            <span class="hint">Макс. вместимость: {{ maxCapacity }} чел.</span>
          </div>

          <div class="form-group">
            <label for="phoneNumber">Телефон</label>
            <input
              id="phoneNumber"
              type="tel"
              v-model="formData.phoneNumber"
              placeholder="+7 (999) 999-99-99"
            />
          </div>

          <div class="form-group">
            <label for="notes">Дополнительная информация</label>
            <textarea
              id="notes"
              v-model="formData.notes"
              placeholder="Особые пожелания или комментарии"
              rows="3"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeModal">Отмена</button>
            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Создание...' : 'Создать бронирование' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { createBooking } from '../services/bookingService'

export default {
  props: {
    isVisible: Boolean,
    bookingData: {
      type: Object,
      default: () => ({}),
    },
    tables: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      formData: {
        customerName: '',
        numPeople: 1,
        phoneNumber: '',
        notes: '',
      },
      isSubmitting: false,
    }
  },
  computed: {
    maxCapacity() {
      // Находим максимальную вместимость выбранных столов
      const selectedTables = this.tables.filter((table) =>
        this.bookingData.tableIds.includes(table.id),
      )
      return Math.max(...selectedTables.map((table) => table.capacity), 1)
    },
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.resetForm()
        // Автоматически устанавливаем максимальное количество гостей
        this.formData.numPeople = this.maxCapacity
      }
    },
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },

    resetForm() {
      this.formData = {
        customerName: '',
        numPeople: this.maxCapacity,
        phoneNumber: '',
        notes: '',
      }
      this.isSubmitting = false
    },

    async submitBooking() {
      this.isSubmitting = true

      try {
        const bookingPayload = {
          table_ids: this.bookingData.tableIds,
          start_time: this.bookingData.startTime,
          end_time: this.bookingData.endTime,
          customer_name: this.formData.customerName,
          num_people: parseInt(this.formData.numPeople),
          phone_number: this.formData.phoneNumber,
          notes: this.formData.notes,
          status: 'Новая',
        }

        console.log('Отправка данных бронирования:', bookingPayload)

        // В реальном приложении:
        // const result = await createBooking(bookingPayload)
        const result = { success: true, id: 'new-booking-id' }

        if (result.success) {
          this.$emit('booking-created', {
            ...bookingPayload,
            id: result.id,
            name_for_reservation: this.formData.customerName,
          })
          this.closeModal()

          // Показываем уведомление об успехе
          alert('Бронирование успешно создано!')
        }
      } catch (error) {
        console.error('Ошибка при создании бронирования:', error)
        alert('Произошла ошибка при создании бронирования. Попробуйте еще раз.')
      } finally {
        this.isSubmitting = false
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },

    formatTimeRange(startTime, endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      return `${start.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })} - ${end.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    },
  },
}
</script>

<style scoped>
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  color: #333;
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

.modal-body {
  padding: 20px;
}

.booking-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.booking-info p {
  margin: 5px 0;
  color: #555;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  display: block;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 30px;
}

.btn-cancel,
.btn-submit {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.btn-cancel {
  background: #f5f5f5;
  color: #333;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-submit {
  background: #4caf50;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #45a049;
}

.btn-submit:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

/* Темная тема */
:global(.dark) .modal-content {
  background: #2a2a2a;
  color: #fff;
}

:global(.dark) .modal-header h2 {
  color: #fff;
}

:global(.dark) .close-btn {
  color: #ccc;
}

:global(.dark) .close-btn:hover {
  color: #fff;
}

:global(.dark) .booking-info {
  background: #333;
}

:global(.dark) .booking-info p {
  color: #ccc;
}

:global(.dark) .form-group label {
  color: #fff;
}

:global(.dark) .form-group input,
:global(.dark) .form-group textarea {
  background: #333;
  color: #fff;
  border-color: #555;
}

:global(.dark) .form-group input:focus,
:global(.dark) .form-group textarea:focus {
  border-color: #4caf50;
}

:global(.dark) .btn-cancel {
  background: #555;
  color: #fff;
}

:global(.dark) .btn-cancel:hover {
  background: #666;
}

@media (max-width: 600px) {
  .modal-content {
    width: 95%;
    margin: 20px;
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
