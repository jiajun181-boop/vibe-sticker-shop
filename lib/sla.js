function addBusinessDays(baseDate, days) {
  const date = new Date(baseDate);
  let remaining = Math.max(0, Number(days) || 0);
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return date;
}

function formatShort(date) {
  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
}

function getProductionDayRange(turnaroundKey) {
  switch (turnaroundKey) {
    case "sameDay":
      return { min: 0, max: 0 };
    case "1day":
      return { min: 1, max: 1 };
    case "3_5days":
      return { min: 3, max: 5 };
    case "custom":
      return { min: 5, max: 7 };
    case "2_3days":
    default:
      return { min: 2, max: 3 };
  }
}

export function getSlaWindow(turnaroundKey, baseDate = new Date()) {
  const { max } = getProductionDayRange(turnaroundKey);
  const shipBy = addBusinessDays(baseDate, max);
  const deliverStart = addBusinessDays(shipBy, 1);
  const deliverEnd = addBusinessDays(shipBy, 3);

  return {
    shipByDate: shipBy,
    deliveryStartDate: deliverStart,
    deliveryEndDate: deliverEnd,
    shipByLabel: formatShort(shipBy),
    deliveryLabel: `${formatShort(deliverStart)} - ${formatShort(deliverEnd)}`,
  };
}

