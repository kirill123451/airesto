// Мок-данные для тестирования
export const mockRestaurantData = {
  available_days: ['2025-04-04', '2025-04-05', '2025-04-06', '2025-04-07', '2025-04-08'],
  current_day: '2025-04-04',
  restaurant: {
    id: 11100,
    timezone: 'Asia/Vladivostok',
    restaurant_name: 'Супра',
    opening_time: '11:00',
    closing_time: '23:40',
  },
  tables: [
    {
      id: 'table-1',
      capacity: 4,
      number: '1',
      zone: '1 этаж',
      orders: [
        {
          id: 'order-1',
          status: 'New',
          start_time: '2025-04-04T12:00:00+10:00',
          end_time: '2025-04-04T13:30:00+10:00',
        },
      ],
      reservations: [
        {
          id: 1,
          name_for_reservation: 'Анна',
          num_people: 3,
          phone_number: '+79991234567',
          status: 'Новая',
          seating_time: '2025-04-04T14:00:00+10:00',
          end_time: '2025-04-04T16:00:00+10:00',
        },
      ],
    },
    {
      id: 'table-2',
      capacity: 6,
      number: '2',
      zone: '1 этаж',
      orders: [
        {
          id: 'order-2',
          status: 'Bill',
          start_time: '2025-04-04T15:00:00+10:00',
          end_time: '2025-04-04T16:30:00+10:00',
        },
      ],
      reservations: [
        {
          id: 2,
          name_for_reservation: 'Иван',
          num_people: 5,
          phone_number: '+79997654321',
          status: 'Открыт',
          seating_time: '2025-04-04T17:00:00+10:00',
          end_time: '2025-04-04T19:00:00+10:00',
        },
      ],
    },
    {
      id: 'table-3',
      capacity: 2,
      number: '3',
      zone: '2 этаж',
      orders: [],
      reservations: [
        {
          id: 3,
          name_for_reservation: 'Мария',
          num_people: 2,
          phone_number: '+79998887766',
          status: 'Живая очередь',
          seating_time: '2025-04-04T13:00:00+10:00',
          end_time: '2025-04-04T14:30:00+10:00',
        },
      ],
    },
    {
      id: 'table-4',
      capacity: 8,
      number: '4',
      zone: 'Банкетный зал',
      orders: [
        {
          id: 'order-4',
          status: 'Banquet',
          start_time: '2025-04-04T19:00:00+10:00',
          end_time: '2025-04-04T22:00:00+10:00',
        },
      ],
      reservations: [],
    },
    {
      id: 'table-5',
      capacity: 4,
      number: '5',
      zone: '2 этаж',
      orders: [
        {
          id: 'order-5',
          status: 'Closed',
          start_time: '2025-04-04T12:30:00+10:00',
          end_time: '2025-04-04T14:00:00+10:00',
        },
      ],
      reservations: [
        {
          id: 5,
          name_for_reservation: 'Ольга',
          num_people: 4,
          phone_number: '+79995554433',
          status: 'Заявка',
          seating_time: '2025-04-04T18:00:00+10:00',
          end_time: '2025-04-04T20:00:00+10:00',
        },
      ],
    },
    {
      id: 'table-6',
      capacity: 6,
      number: '6',
      zone: '1 этаж',
      orders: [],
      reservations: [
        {
          id: 6,
          name_for_reservation: 'Дмитрий',
          num_people: 6,
          phone_number: '+79993332211',
          status: 'Новая',
          seating_time: '2025-04-04T16:00:00+10:00',
          end_time: '2025-04-04T18:00:00+10:00',
        },
      ],
    },
    {
      id: 'table-7',
      capacity: 4,
      number: '7',
      zone: '2 этаж',
      orders: [
        {
          id: 'order-7',
          status: 'New',
          start_time: '2025-04-04T14:00:00+10:00',
          end_time: '2025-04-04T15:30:00+10:00',
        },
      ],
      reservations: [],
    },
    {
      id: 'table-8',
      capacity: 10,
      number: '8',
      zone: 'Банкетный зал',
      orders: [],
      reservations: [
        {
          id: 8,
          name_for_reservation: 'Сергей',
          num_people: 10,
          phone_number: '+79991112233',
          status: 'Открыт',
          seating_time: '2025-04-04T20:00:00+10:00',
          end_time: '2025-04-04T23:00:00+10:00',
        },
      ],
    },
  ],
}

// Имитация API вызовов
export const bookingApi = {
  getBookingData: async (date) => {
    // Имитация задержки сети
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Клонируем данные чтобы избежать мутаций
    const data = JSON.parse(JSON.stringify(mockRestaurantData))

    // Обновляем current_day если указана дата
    if (date) {
      data.current_day = date
    }

    return data
  },

  createBooking: async (bookingData) => {
    // Имитация задержки сети
    await new Promise((resolve) => setTimeout(resolve, 800))

    console.log('Бронирование создано:', bookingData)

    // В реальном приложении здесь был бы вызов API
    return {
      success: true,
      id: `booking-${Date.now()}`,
      ...bookingData,
    }
  },

  getAvailableDays: async () => {
    return mockRestaurantData.available_days
  },
}
