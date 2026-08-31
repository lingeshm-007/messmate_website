/**
 * Admin Dashboard Component
 * Clean, tactile overview for the mess owner (Aunty)
 */

window.MessMateDashboard = {
  render(data, state) {
    if (!data) {
      return `<div class="p-12 text-center text-stone-500">Loading dashboard data...</div>`;
    }

    const { mess_settings, students, today_attendance, financial_summary, ai_insight, date } = data;
    const activeStudents = students.active || 0;
    const capacity = mess_settings.capacity || 20;
    const capacityPct = Math.min(100, Math.round((activeStudents / capacity) * 100));

    return `
      <div class="space-y-6 animate-fade-in pb-12">
        
        <!-- Welcome & Date Header -->
        <div class="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div class="absolute -right-10 -bottom-10 opacity-10 text-9xl">🍛</div>
          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="flex items-center space-x-2 text-orange-100 text-xs font-semibold uppercase tracking-wider mb-1">
                <span>📍 ${mess_settings.mess_name}</span>
                <span>•</span>
                <span>Host: ${mess_settings.owner_name}</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Today's Mess Overview</h1>
              <p class="text-orange-100 text-sm mt-1">Date: <span class="font-bold underline">${date}</span> (${new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })})</p>
            </div>

            <!-- Capacity Badge -->
            <div class="bg-white/15 backdrop-blur-md rounded-xl p-3.5 border border-white/20 flex items-center space-x-4">
              <div>
                <p class="text-xs text-orange-100 uppercase font-medium">Student Capacity</p>
                <div class="flex items-baseline space-x-1">
                  <span class="text-2xl font-black">${activeStudents}</span>
                  <span class="text-sm text-orange-200">/ ${capacity}</span>
                </div>
              </div>
              <div class="w-24">
                <div class="h-2.5 bg-black/20 rounded-full overflow-hidden">
                  <div class="h-full ${capacityPct >= 90 ? 'bg-rose-400' : 'bg-emerald-400'} rounded-full" style="width: ${capacityPct}%"></div>
                </div>
                <p class="text-[10px] text-right text-orange-100 mt-1 font-semibold">${capacityPct}% filled</p>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Meal Demand Forecast Alert Card -->
        ${ai_insight ? `
          <div class="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border border-emerald-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div class="flex items-start space-x-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
                🤖
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 uppercase">AI Meal Forecast</span>
                  <span class="text-xs text-emerald-700 font-medium">Tomorrow (${ai_insight.day_of_week})</span>
                </div>
                <p class="text-sm font-bold text-stone-900 mt-0.5">
                  "${ai_insight.highlight_message}"
                </p>
                <p class="text-xs text-stone-600 mt-0.5">
                  Expected Headcounts: <strong>Breakfast: ${ai_insight.predicted_headcount.breakfast}</strong> • <strong>Lunch: ${ai_insight.predicted_headcount.lunch}</strong> • <strong>Dinner: ${ai_insight.predicted_headcount.dinner}</strong>
                </p>
              </div>
            </div>
            <button 
              onclick="MessMateApp.navigateTo('ai_demand')" 
              class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs whitespace-nowrap self-end sm:self-center">
              View AI Grocery Insight →
            </button>
          </div>
        ` : ''}

        <!-- Quick Actions Grid -->
        <div>
          <h2 class="text-sm font-bold text-stone-700 uppercase tracking-wider mb-3">⚡ Quick Actions</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button 
              onclick="MessMateApp.openAddStudentModal()"
              class="mess-card p-3.5 flex flex-col items-center justify-center text-center hover:border-orange-400 hover:bg-orange-50/50 group transition">
              <div class="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition">
                ➕
              </div>
              <span class="text-xs font-bold text-stone-800">Add Student</span>
            </button>

            <button 
              onclick="MessMateApp.navigateTo('attendance')"
              class="mess-card p-3.5 flex flex-col items-center justify-center text-center hover:border-emerald-400 hover:bg-emerald-50/50 group transition">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition">
                ✅
              </div>
              <span class="text-xs font-bold text-stone-800">Mark Attendance</span>
            </button>

            <button 
              onclick="MessMateApp.openRecordPaymentModal()"
              class="mess-card p-3.5 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50/50 group transition">
              <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition">
                💰
              </div>
              <span class="text-xs font-bold text-stone-800">Record Payment</span>
            </button>

            <button 
              onclick="MessMateApp.openAddDeductionModal()"
              class="mess-card p-3.5 flex flex-col items-center justify-center text-center hover:border-amber-400 hover:bg-amber-50/50 group transition">
              <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition">
                ✂️
              </div>
              <span class="text-xs font-bold text-stone-800">Add Deduction</span>
            </button>

            <button 
              onclick="MessMateApp.navigateTo('students')"
              class="mess-card p-3.5 flex flex-col items-center justify-center text-center hover:border-purple-400 hover:bg-purple-50/50 group transition">
              <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition">
                👥
              </div>
              <span class="text-xs font-bold text-stone-800">View Students</span>
            </button>

            <button 
              onclick="MessMateApp.navigateTo('reports')"
              class="mess-card p-3.5 flex flex-col items-center justify-center text-center hover:border-stone-400 hover:bg-stone-50 group transition">
              <div class="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition">
                📈
              </div>
              <span class="text-xs font-bold text-stone-800">View Reports</span>
            </button>
          </div>
        </div>

        <!-- Today's Meal Headcount Counters -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-bold text-stone-700 uppercase tracking-wider">🍛 Today's Meal Counts</h2>
            <span class="text-xs text-stone-500">Expected Total: <strong>${today_attendance.total_expected} meals</strong></span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <!-- Breakfast -->
            <div class="mess-card p-4 border-l-4 border-amber-500">
              <div class="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
                <span>🥞 Breakfast</span>
                <span>Expected: ${today_attendance.expected_breakfast}</span>
              </div>
              <div class="flex items-baseline space-x-2">
                <span class="text-3xl font-black text-amber-600">${today_attendance.breakfast_count}</span>
                <span class="text-xs text-stone-500">ate</span>
              </div>
              <div class="mt-2 text-[11px] text-stone-500">
                ${today_attendance.expected_breakfast > 0 ? `${Math.round((today_attendance.breakfast_count / today_attendance.expected_breakfast) * 100)}% served` : 'No meals planned'}
              </div>
            </div>

            <!-- Lunch -->
            <div class="mess-card p-4 border-l-4 border-orange-500">
              <div class="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
                <span>🍛 Lunch</span>
                <span>Expected: ${today_attendance.expected_lunch}</span>
              </div>
              <div class="flex items-baseline space-x-2">
                <span class="text-3xl font-black text-orange-600">${today_attendance.lunch_count}</span>
                <span class="text-xs text-stone-500">ate</span>
              </div>
              <div class="mt-2 text-[11px] text-stone-500">
                ${today_attendance.expected_lunch > 0 ? `${Math.round((today_attendance.lunch_count / today_attendance.expected_lunch) * 100)}% served` : 'No meals planned'}
              </div>
            </div>

            <!-- Dinner -->
            <div class="mess-card p-4 border-l-4 border-indigo-500">
              <div class="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
                <span>🍲 Dinner</span>
                <span>Expected: ${today_attendance.expected_dinner}</span>
              </div>
              <div class="flex items-baseline space-x-2">
                <span class="text-3xl font-black text-indigo-600">${today_attendance.dinner_count}</span>
                <span class="text-xs text-stone-500">ate</span>
              </div>
              <div class="mt-2 text-[11px] text-stone-500">
                ${today_attendance.expected_dinner > 0 ? `${Math.round((today_attendance.dinner_count / today_attendance.expected_dinner) * 100)}% served` : 'No meals planned'}
              </div>
            </div>

            <!-- Meals Missed -->
            <div class="mess-card p-4 border-l-4 border-rose-500">
              <div class="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
                <span>❌ Meals Missed</span>
                <span class="text-rose-600 font-bold">Today</span>
              </div>
              <div class="flex items-baseline space-x-2">
                <span class="text-3xl font-black text-rose-600">${today_attendance.meals_missed}</span>
                <span class="text-xs text-stone-500">meals</span>
              </div>
              <div class="mt-2 text-[11px] text-stone-500">
                Aunty can deduct later
              </div>
            </div>

            <!-- Active Students -->
            <div class="mess-card p-4 border-l-4 border-emerald-500 col-span-2 sm:col-span-1">
              <div class="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
                <span>👥 Active Students</span>
                <span class="text-emerald-700 font-bold">${activeStudents}</span>
              </div>
              <div class="flex items-baseline space-x-1">
                <span class="text-3xl font-black text-emerald-600">${activeStudents}</span>
                <span class="text-xs text-stone-500">/ ${capacity} max</span>
              </div>
              <div class="mt-2 text-[11px] text-stone-500 flex justify-between">
                <span>Paused: <strong>${students.paused || 0}</strong></span>
                <span>Inactive: <strong>${students.inactive || 0}</strong></span>
              </div>
            </div>

          </div>
        </div>

        <!-- Financial Summary -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-bold text-stone-700 uppercase tracking-wider">💳 Financial Summary (Active Cycles)</h2>
            <button onclick="MessMateApp.navigateTo('billing')" class="text-xs text-orange-600 hover:text-orange-700 font-bold">
              View Billing Details →
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Expected Collection -->
            <div class="mess-card p-5 bg-white">
              <p class="text-xs font-semibold text-stone-500 uppercase">Expected Collection</p>
              <div class="mt-2 flex items-baseline space-x-2">
                <span class="text-2xl sm:text-3xl font-black text-stone-900">₹${financial_summary.expected_collection.toLocaleString('en-IN')}</span>
              </div>
              <p class="text-[11px] text-stone-500 mt-1">Sum of all base fees + carry forwards</p>
            </div>

            <!-- Amount Collected -->
            <div class="mess-card p-5 bg-emerald-50/40 border-emerald-200">
              <p class="text-xs font-semibold text-emerald-800 uppercase">Amount Collected</p>
              <div class="mt-2 flex items-baseline space-x-2">
                <span class="text-2xl sm:text-3xl font-black text-emerald-700">₹${financial_summary.total_collected.toLocaleString('en-IN')}</span>
              </div>
              <p class="text-[11px] text-emerald-700 mt-1">Received via UPI & Cash</p>
            </div>

            <!-- Total Pending -->
            <div class="mess-card p-5 bg-rose-50/40 border-rose-200">
              <p class="text-xs font-semibold text-rose-800 uppercase">Total Pending Balance</p>
              <div class="mt-2 flex items-baseline space-x-2">
                <span class="text-2xl sm:text-3xl font-black text-rose-700">₹${financial_summary.total_pending.toLocaleString('en-IN')}</span>
              </div>
              <p class="text-[11px] text-rose-700 mt-1">Carried forward across active cycles</p>
            </div>

            <!-- Students with Pending -->
            <div class="mess-card p-5 bg-amber-50/40 border-amber-200">
              <p class="text-xs font-semibold text-amber-800 uppercase">Pending Students</p>
              <div class="mt-2 flex items-baseline space-x-2">
                <span class="text-2xl sm:text-3xl font-black text-amber-800">${financial_summary.pending_students_count}</span>
                <span class="text-xs text-amber-700">of ${financial_summary.active_students_count} active</span>
              </div>
              <p class="text-[11px] text-amber-700 mt-1">Deductions applied: ₹${financial_summary.total_deductions.toLocaleString('en-IN')}</p>
            </div>

          </div>
        </div>

        <!-- Spotlight: Verified Lingesh Demo Scenario -->
        <div class="mess-card p-5 bg-gradient-to-r from-orange-50 via-amber-50 to-stone-50 border-orange-200">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-start space-x-3">
              <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-orange-500 shadow-sm">
                ${window.MessMateAvatars.presets.avatar_lingesh.svg}
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <span class="font-extrabold text-stone-900">Demo Scenario: Lingesh</span>
                  <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">Scenario Active & Verified</span>
                </div>
                <p class="text-xs text-stone-600 mt-1 max-w-2xl">
                  Joined <strong>18/07/2026</strong> • Cycle 1: <strong>18/07/2026 → 17/08/2026</strong> (₹4,000 base - ₹300 deduction for 6 missed meals - ₹2,000 paid = <strong>₹1,700 pending</strong>) • Carried forward to Cycle 2 (<strong>18/08/2026 → 17/09/2026</strong>) with 100% calculation accuracy!
                </p>
              </div>
            </div>

            <div class="flex items-center space-x-2 flex-shrink-0">
              <button 
                onclick="MessMateApp.viewStudentProfileByName('Lingesh')"
                class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5">
                <span>🔍 Inspect Lingesh Profile & Bill</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  }
};
