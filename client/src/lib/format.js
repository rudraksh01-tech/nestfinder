const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const rupees = (n) => inr.format(n)

// 45000 -> "₹45k", 252000 -> "₹2.5L"
export function shortRupees(n) {
  if (n >= 100000) return `₹${Math.round(n / 10000) / 10}L`
  if (n >= 1000) return `₹${Math.round(n / 100) / 10}k`
  return `₹${n}`
}

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export const floorLabel = (floor, total) => (floor === 0 ? `Ground of ${total}` : `${floor} of ${total}`)
