// Match the per-guest chart to the monthly total chart without embedding expense data.
renderSpendPerGuestChart = function(months) {
  const section = document.getElementById("spendPerGuestSection");
  const el = document.getElementById("spendPerGuestChart");
  const points = months.map(month => ({month, value: spendPerGuestForMonth(month)}));
  const known = points.filter(p => p.value !== null);
  if (months.length < 2 || known.length < 2) { section.style.display = "none"; return; }
  section.style.display = "";
  const max = Math.max(...known.map(p => p.value), 0.01);
  el.innerHTML = '<div class="total-spend-scroll"><div class="month-bars" style="min-width:720px;height:190px">' + points.map(p => {
    const label = MONTH_LABELS[p.month] || p.month;
    const value = p.value === null ? "—" : eur(p.value);
    const height = p.value === null ? 0 : p.value / max * 100;
    return '<div class="month-col" style="min-width:64px">' +
      '<div class="month-val" style="white-space:nowrap">' + value + '</div>' +
      '<div class="month-bar-wrap"><div class="month-bar" style="background:#9183e6;height:' + height + '%;min-height:' + (height > 0 ? '2px' : '0') + '"></div></div>' +
      '<div class="month-lbl">' + label + '</div></div>';
  }).join("") + '</div></div>';
};
if (allMonthsUnion().length) renderSpendPerGuestChart(monthsInRange());
