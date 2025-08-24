import { ApiService } from './api'

export const getBookingData = async (date = null) => {
  try {
    const endpoint = date ? `/api/booking?date=${date}` : '/api/booking'
    const data = await ApiService.get(endpoint)

    // Преобразование данных API в ожидаемый формат
    return {
      available_days: data.availableDays || [],
      current_day: data.currentDay || new Date().toISOString().split('T')[0],
      restaurant: {
        id: data.restaurant?.id || 11100,
        timezone: data.restaurant?.timezone || 'Asia/Vladivostok',
        restaurant_name: data.restaurant?.name || 'Ресторан',
        opening_time: data.restaurant?.openingTime || '11:00',
        closing_time: data.restaurant?.closingTime || '23:00',
      },
      tables:
        data.tables?.map((table) => ({
          id: table.id,
          capacity: table.capacity,
          number: table.number,
          zone: table.zone,
          orders: table.orders || [],
          reservations: table.reservations || [],
        })) || [],
    }
  } catch (error) {
    console.error('Ошибка получения данных:', error)
    throw error
  }
}

export const createBooking = async (bookingData) => {
  try {
    // В реальном приложении:
    // const response = await ApiService.post('/api/booking', bookingData)
    // return response

    // Заглушка для демонстрации
    console.log('Creating booking:', bookingData)

    // Имитация успешного создания
    return {
      success: true,
      id: `booking-${Date.now()}`,
      ...bookingData,
    }
  } catch (error) {
    console.error('Ошибка создания бронирования:', error)
    throw error
  }
}
