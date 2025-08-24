const API_BASE_URL = 'https://hh.frontend.ark.software'

// Функция для обработки HTTP-запросов
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

export const bookingApi = {
  // Получение данных о бронированиях
  getBookingData: (date) => apiRequest(`/api/booking?date=${date}`),

  // Создание нового бронирования
  createBooking: (bookingData) =>
    apiRequest('/api/booking', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),

  // Получение доступных дней
  getAvailableDays: () => apiRequest('/api/booking/available-days'),
}
