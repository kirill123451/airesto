export const generateTimeSlots = (openingTime, closingTime, intervalMinutes = 30) => {
  const slots = []
  const [startHour, startMinute] = openingTime.split(':').map(Number)
  const [endHour, endMinute] = closingTime.split(':').map(Number)

  let currentHour = startHour
  let currentMinute = startMinute

  while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
    slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`)
    currentMinute += intervalMinutes
    if (currentMinute >= 60) {
      currentHour++
      currentMinute = 0
    }
  }

  return slots
}

export const getCurrentRestaurantTime = (timezone) => {
  try {
    return new Date().toLocaleTimeString('ru-RU', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch (error) {
    console.warn('Не удалось получить время ресторана, используется локальное время:', error)
    return new Date().toLocaleTimeString('ru-RU')
  }
}

export const timeSlotToDate = (currentDate, timeSlot, timezoneOffset = '+10:00') => {
  return new Date(`${currentDate}T${timeSlot}:00${timezoneOffset}`)
}

export const formatTime = (date) => {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
