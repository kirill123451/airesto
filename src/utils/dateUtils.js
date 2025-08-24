export const formatDate = (dateString, options = {}) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...options,
  })
}

export const isSameDay = (dateString1, dateString2) => {
  const d1 = new Date(dateString1)
  const d2 = new Date(dateString2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}
