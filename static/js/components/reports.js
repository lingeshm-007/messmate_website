/**
 * Reports & Analytics Component
 * Student roster metrics, meal consumption stats, financial ledger, and CSV export.
 */

window.MessMateReports = {
  render(reportData, state) {
    if (!reportData) {
      return `<div class="p-12 text-center text-stone-500">Loading reports...</div>`;
    }

    const { student_stats, financial_stats, meal_stats, daily_trends } = reportData;

    return `
      <div class="space-y-6 animate-fade-in pb-16">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">Mess Analytics & Reports</h1>
            <p class="text-xs text-stone-500 mt-1">Comprehensive student, attendance, and revenue reporting.</p>
          </div>

          <div class="flex items-center space-x-2">
            <button 
              onclick="window.print()" 
              class="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition flex items-center space-x-1.5">
              <span>🖨️ Print Report</span>
            </button>
            <button 
              onclick="MessMateApp.exportReportsCSV()" 
              class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5">
              <span>📥 Export CSV</span>
            </button>
          </div>
        </div>

        <!-- 1. Student Demographics & Status Cards -->
        <div>
          <h2 class="text-sm font-bold text-stone-700 uppercase tracking-wider mb-3">👥 Student Roster Breakdown</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="mess-card p-4 bg-white border-l-4 border-emerald-500">
              <p class="text-xs font-bold text-stone-400 uppercase">Active Students</p>
              <p class="text-3xl font-black text-emerald-700 mt-1">${student_stats.active}</p>
              <p class="text-[11px] text-stone-500 mt-1">Currently taking meals</p>
            </div>
            <div class="mess-card p-4 bg-white border-l-4 border-amber-500">
              <p class="text-xs font-bold text-stone-400 uppercase">Paused Students</p>
              <p class="text-3xl font-black text-amber-700 mt-1">${student_stats.paused}</p>
              <p class="text-[11px] text-stone-500 mt-1">Temporary leave / home</p>
            </div>
            <div class="mess-card p-4 bg-white border-l-4 border-rose-500">
              <p class="text-xs font-bold text-stone-400 uppercase">Discontinued</p>
              <p class="text-3xl font-black text-rose-700 mt-1">${student_stats.inactive}</p>
              <p class="text-[11px] text-stone-500 mt-1">Soft-preserved in DB</p>
            </div>
            <div class="mess-card p-4 bg-white border-l-4 border-stone-800">
              <p class="text-xs font-bold text-stone-400 uppercase">All-Time Students</p>
              <p class="text-3xl font-black text-stone-900 mt-1">${student_stats.total}</p>
              <p class="text-[11px] text-stone-500 mt-1">Lifetime registrations</p>
            </div>
          </div>
        </div>

        <!-- 2. Financial Overview Cards -->
        <div>
          <h2 class="text-sm font-bold text-stone-700 uppercase tracking-wider mb-3">💳 Financial Metrics</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="mess-card p-5 bg-white">
              <p class="text-xs font-bold text-stone-400 uppercase">Total Billed Base</p>
              <p class="text-2xl font-black text-stone-900 mt-1">₹${financial_stats.total_billed.toLocaleString('en-IN')}</p>
              <p class="text-[11px] text-stone-500 mt-1">Sum of all billing cycles</p>
            </div>
            <div class="mess-card p-5 bg-emerald-50/50 border-emerald-200">
              <p class="text-xs font-bold text-emerald-800 uppercase">Total Collected</p>
              <p class="text-2xl font-black text-emerald-700 mt-1">₹${financial_stats.total_collected.toLocaleString('en-IN')}</p>
              <p class="text-[11px] text-emerald-700 mt-1">Actual revenue received</p>
            </div>
            <div class="mess-card p-5 bg-amber-50/50 border-amber-200">
              <p class="text-xs font-bold text-amber-800 uppercase">Total Deductions</p>
              <p class="text-2xl font-black text-amber-800 mt-1">₹${financial_stats.total_deductions.toLocaleString('en-IN')}</p>
              <p class="text-[11px] text-amber-700 mt-1">Owner discounts applied</p>
            </div>
            <div class="mess-card p-5 bg-rose-50/50 border-rose-200">
              <p class="text-xs font-bold text-rose-800 uppercase">Current Pending</p>
              <p class="text-2xl font-black text-rose-700 mt-1">₹${financial_stats.current_pending.toLocaleString('en-IN')}</p>
              <p class="text-[11px] text-rose-700 mt-1">Carried forward balances</p>
            </div>
          </div>
        </div>

        <!-- 3. Meal Attendance Trends -->
        <div>
          <h2 class="text-sm font-bold text-stone-700 uppercase tracking-wider mb-3">🍛 Meal Consumption Stats (All-Time)</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div class="mess-card p-4 text-center bg-amber-50/40 border-amber-200">
              <p class="text-xs text-amber-800 font-bold">Breakfasts Served</p>
              <p class="text-2xl font-black text-amber-900 mt-1">${meal_stats.b_ate || 0}</p>
            </div>
            <div class="mess-card p-4 text-center bg-orange-50/40 border-orange-200">
              <p class="text-xs text-orange-800 font-bold">Lunches Served</p>
              <p class="text-2xl font-black text-orange-900 mt-1">${meal_stats.l_ate || 0}</p>
            </div>
            <div class="mess-card p-4 text-center bg-indigo-50/40 border-indigo-200">
              <p class="text-xs text-indigo-800 font-bold">Dinners Served</p>
              <p class="text-2xl font-black text-indigo-900 mt-1">${meal_stats.d_ate || 0}</p>
            </div>
            <div class="mess-card p-4 text-center bg-rose-50/40 border-rose-200">
              <p class="text-xs text-rose-800 font-bold">Total Missed Meals</p>
              <p class="text-2xl font-black text-rose-900 mt-1">${meal_stats.total_missed || 0}</p>
            </div>
          </div>

          <!-- Daily Attendance Breakdown Table -->
          <div class="mess-card bg-white p-5 space-y-3">
            <h3 class="text-xs font-bold text-stone-600 uppercase">Recent Daily Meal Attendance Log</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-stone-50 text-stone-500 font-bold border-b border-stone-200">
                  <tr>
                    <th class="py-2.5 px-3">Date</th>
                    <th class="py-2.5 px-3">Breakfast (Ate)</th>
                    <th class="py-2.5 px-3">Lunch (Ate)</th>
                    <th class="py-2.5 px-3">Dinner (Ate)</th>
                    <th class="py-2.5 px-3">Missed Meals</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-stone-100">
                  ${(daily_trends || []).map(d => `
                    <tr class="hover:bg-stone-50/60">
                      <td class="py-2.5 px-3 font-bold text-stone-800">${d.date}</td>
                      <td class="py-2.5 px-3 font-semibold text-amber-700">${d.breakfast}</td>
                      <td class="py-2.5 px-3 font-semibold text-orange-700">${d.lunch}</td>
                      <td class="py-2.5 px-3 font-semibold text-indigo-700">${d.dinner}</td>
                      <td class="py-2.5 px-3 font-semibold text-rose-600">${d.missed}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    `;
  }
};
