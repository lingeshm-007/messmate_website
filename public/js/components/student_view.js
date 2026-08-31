/**
 * Student Self-Service Portal Component
 * Clean, mobile-friendly interface for students to view their meal plan, today's meals,
 * billing statement, payment history, weekly menu, and submit leave requests.
 */

window.MessMateStudentView = {
  render(profile, menu, state) {
    if (!profile || !profile.student) {
      return `<div class="p-12 text-center text-stone-500">Student data not found. Please select a student from the top bar.</div>`;
    }

    const { student, active_cycle, cycles, payments, deductions, recent_attendance, leave_requests } = profile;
    const meals = student.meal_selection || [];
    const isPaid = active_cycle ? active_cycle.is_paid : true;
    const pendingAmount = active_cycle ? active_cycle.current_pending : 0;
    const cycleRange = active_cycle ? `${active_cycle.start_date} to ${active_cycle.end_date}` : 'Active';

    // Find today's menu
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = days[new Date().getDay()];
    const todayMenu = (menu || []).find(m => m.day_of_week === todayName) || {};

    return `
      <div class="space-y-6 animate-fade-in pb-16 max-w-4xl mx-auto">
        
        <!-- Student Greeting Banner -->
        <div class="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div class="absolute -right-6 -bottom-6 opacity-10 text-9xl">🎓</div>
          
          <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/40 shadow-sm">
                ${window.MessMateAvatars.getAvatarHtml(student.photo_url, student.name, 'w-16 h-16 text-xl')}
              </div>
              <div>
                <span class="px-2.5 py-0.5 bg-white/20 text-white text-[11px] font-bold rounded-full uppercase">Student Portal</span>
                <h1 class="text-2xl font-black mt-1">Hello, ${student.name}!</h1>
                <p class="text-xs text-emerald-100 mt-0.5">📞 ${student.phone} • Plan: <strong>${meals.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ')}</strong></p>
              </div>
            </div>

            <!-- Leave Request Button -->
            <button 
              onclick="MessMateApp.openStudentLeaveModal(${student.id})"
              class="px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-black rounded-xl shadow-xs transition self-start sm:self-center flex items-center space-x-1.5">
              <span>✈️ Request Leave / Skip Meal</span>
            </button>
          </div>
        </div>

        <!-- Financial Due Alert Card -->
        <div class="mess-card p-6 bg-white border-l-4 ${isPaid ? 'border-emerald-500' : 'border-rose-500'}">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3 mb-4">
            <div>
              <span class="text-xs font-bold text-stone-400 uppercase">Current Billing Cycle #${active_cycle ? active_cycle.cycle_number : 1}</span>
              <h2 class="text-base font-extrabold text-stone-900 mt-0.5">Period: ${cycleRange}</h2>
            </div>
            <div>
              <span class="px-3.5 py-1 text-xs font-black rounded-full ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                ${isPaid ? '✓ ALL DUES CLEARED' : `PENDING BALANCE: ₹${pendingAmount.toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>

          <!-- Billing Breakdown Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-center text-xs">
            <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <p class="text-[10px] uppercase font-bold text-stone-400">Monthly Plan</p>
              <p class="text-base font-black text-stone-800 mt-1">₹${(active_cycle ? active_cycle.base_bill : student.monthly_fee).toLocaleString('en-IN')}</p>
            </div>
            <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <p class="text-[10px] uppercase font-bold text-stone-400">Prev Balance</p>
              <p class="text-base font-black text-amber-700 mt-1">₹${(active_cycle ? active_cycle.previous_pending : 0).toLocaleString('en-IN')}</p>
            </div>
            <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <p class="text-[10px] uppercase font-bold text-stone-400">Missed Meals</p>
              <p class="text-base font-black text-stone-700 mt-1">${active_cycle ? active_cycle.missed_stats.total_missed : 0}</p>
            </div>
            <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <p class="text-[10px] uppercase font-bold text-stone-400">Deductions</p>
              <p class="text-base font-black text-rose-600 mt-1">−₹${(active_cycle ? active_cycle.total_deductions : 0).toLocaleString('en-IN')}</p>
            </div>
            <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <p class="text-[10px] uppercase font-bold text-emerald-800">Total Paid</p>
              <p class="text-base font-black text-emerald-700 mt-1">₹${(active_cycle ? active_cycle.total_paid : 0).toLocaleString('en-IN')}</p>
            </div>
            <div class="p-3 ${isPaid ? 'bg-emerald-100 border-emerald-300' : 'bg-rose-100 border-rose-300'} rounded-xl border col-span-2 sm:col-span-1">
              <p class="text-[10px] uppercase font-bold ${isPaid ? 'text-emerald-800' : 'text-rose-800'}">Amount Due</p>
              <p class="text-base font-black ${isPaid ? 'text-emerald-900' : 'text-rose-900'} mt-1">₹${pendingAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <!-- Today's Menu Highlight -->
        <div class="mess-card p-5 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <div class="flex items-center justify-between border-b border-orange-200/60 pb-3 mb-3">
            <h3 class="font-extrabold text-stone-900 text-sm flex items-center space-x-2">
              <span>🍲 Today's Mess Special (${todayName})</span>
            </h3>
            <span class="text-[11px] text-orange-800 font-bold">Home Cooked Food</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div class="p-3 bg-white rounded-xl border border-orange-100">
              <span class="text-[10px] uppercase font-bold text-stone-400 block mb-1">🥞 Breakfast</span>
              <p class="font-semibold text-stone-800">${todayMenu.breakfast_items || 'Fresh Idli & Sambar'}</p>
            </div>
            <div class="p-3 bg-white rounded-xl border border-orange-100">
              <span class="text-[10px] uppercase font-bold text-stone-400 block mb-1">🍛 Lunch</span>
              <p class="font-semibold text-stone-800">${todayMenu.lunch_items || 'Full Meals with Poriyal & Curd'}</p>
            </div>
            <div class="p-3 bg-white rounded-xl border border-orange-100">
              <span class="text-[10px] uppercase font-bold text-stone-400 block mb-1">🍲 Dinner</span>
              <p class="font-semibold text-stone-800">${todayMenu.dinner_items || 'Hot Chapathi & Gravy'}</p>
            </div>
          </div>
        </div>

        <!-- Recent Payments & Receipts -->
        <div class="mess-card p-5 bg-white space-y-3">
          <h3 class="text-sm font-bold text-stone-800 uppercase tracking-wider">My Payments & Receipts</h3>
          <div class="divide-y divide-stone-100">
            ${payments.length === 0 ? `
              <div class="p-4 text-center text-stone-400 text-xs">No payment records found.</div>
            ` : payments.map(p => `
              <div class="py-3 flex items-center justify-between">
                <div>
                  <div class="flex items-center space-x-2">
                    <span class="font-extrabold text-stone-900 text-sm">₹${p.amount.toLocaleString('en-IN')}</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 bg-stone-100 rounded-md text-stone-700">${p.payment_method}</span>
                    <span class="text-xs text-stone-400">${p.payment_date}</span>
                  </div>
                  <p class="text-xs text-stone-500 mt-0.5">Receipt: <strong>${p.receipt_number}</strong></p>
                </div>
                <button 
                  onclick="MessMateApp.viewReceipt(${p.id})"
                  class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg transition">
                  📄 View Receipt
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Recent Attendance History -->
        <div class="mess-card p-5 bg-white space-y-3">
          <h3 class="text-sm font-bold text-stone-800 uppercase tracking-wider">My Recent Meal Attendance</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead class="bg-stone-50 text-stone-500 font-bold border-b border-stone-200">
                <tr>
                  <th class="py-2 px-3">Date</th>
                  <th class="py-2 px-3">Meal</th>
                  <th class="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100">
                ${recent_attendance.slice(0, 15).map(a => `
                  <tr>
                    <td class="py-2 px-3 font-semibold text-stone-800">${a.date}</td>
                    <td class="py-2 px-3 capitalize font-bold text-stone-700">${a.meal_type}</td>
                    <td class="py-2 px-3">
                      <span class="px-2 py-0.5 rounded-full font-bold ${a.status === 'ate' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                        ${a.status === 'ate' ? '✓ Ate' : '✕ Missed'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }
};
