/**
 * Student Profile Component
 * Comprehensive 6-tab profile inspector (Overview, Attendance, Billing, Payments, Deductions, History)
 */

window.MessMateProfile = {
  render(profile, state) {
    if (!profile || !profile.student) {
      return `<div class="p-12 text-center text-stone-500">Student not found.</div>`;
    }

    const { student, active_cycle, cycles, payments, deductions, recent_attendance, leave_requests, lifetime_paid, lifetime_deductions } = profile;
    const currentTab = state.profileTab || 'overview';
    const meals = student.meal_selection || [];

    const isPaid = active_cycle ? active_cycle.is_paid : true;
    const pendingAmount = active_cycle ? active_cycle.current_pending : 0;
    const baseBill = active_cycle ? active_cycle.base_bill : student.monthly_fee;
    const prevPending = active_cycle ? active_cycle.previous_pending : 0;
    const totalDeductions = active_cycle ? active_cycle.total_deductions : 0;
    const totalPaid = active_cycle ? active_cycle.total_paid : 0;
    const missedMeals = active_cycle ? active_cycle.missed_stats.total_missed : 0;

    return `
      <div class="space-y-6 animate-fade-in pb-16">
        
        <!-- Top Back Navigation & Header Card -->
        <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
          
          <button 
            onclick="MessMateApp.navigateTo('students')" 
            class="text-xs font-bold text-stone-500 hover:text-orange-600 flex items-center space-x-1 mb-4 transition">
            <span>← Back to Student List</span>
          </button>

          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <!-- Student Avatar & Basic Info -->
            <div class="flex items-start sm:items-center space-x-4">
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-stone-200 shadow-sm">
                ${window.MessMateAvatars.getAvatarHtml(student.photo_url, student.name, 'w-16 h-16 sm:w-20 sm:h-20 text-xl')}
              </div>
              <div>
                <div class="flex items-center space-x-3">
                  <h1 class="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">${student.name}</h1>
                  <span class="px-2.5 py-1 rounded-full text-xs font-bold ${student.status === 'active' ? 'bg-emerald-100 text-emerald-800' : student.status === 'paused' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}">
                    ${student.status.toUpperCase()}
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 mt-1.5">
                  <span>📞 ${student.phone}</span>
                  <span>📍 ${student.address}</span>
                  <span>📅 Joined: <strong>${student.joining_date}</strong></span>
                </div>
                <div class="flex items-center space-x-2 mt-2">
                  <span class="px-2.5 py-0.5 bg-orange-100 text-orange-800 text-xs font-bold rounded-md">
                    ${meals.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ')}
                  </span>
                  <span class="text-xs font-extrabold text-stone-700">₹${student.monthly_fee.toLocaleString('en-IN')}/mo</span>
                </div>
              </div>
            </div>

            <!-- Header Quick Actions -->
            <div class="flex flex-wrap items-center gap-2">
              <button 
                onclick="MessMateApp.openRecordPaymentModal(${student.id})"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5">
                <span>💰 Record Payment</span>
              </button>

              <button 
                onclick="MessMateApp.openAddDeductionModal(${student.id})"
                class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5">
                <span>✂️ Add Deduction</span>
              </button>

              <button 
                onclick="MessMateApp.openEditStudentModal(${student.id})"
                class="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition">
                ✏️ Edit
              </button>
            </div>

          </div>

          <!-- Profile Navigation Tabs -->
          <div class="flex space-x-2 sm:space-x-4 border-t border-stone-100 mt-6 pt-3 overflow-x-auto text-xs sm:text-sm font-bold scrollbar-none">
            <button onclick="MessMateApp.setProfileTab('overview')" class="py-2 px-3 rounded-lg transition ${currentTab === 'overview' ? 'bg-orange-50 text-orange-700' : 'text-stone-500 hover:text-stone-800'}">
              📊 Overview
            </button>
            <button onclick="MessMateApp.setProfileTab('attendance')" class="py-2 px-3 rounded-lg transition ${currentTab === 'attendance' ? 'bg-orange-50 text-orange-700' : 'text-stone-500 hover:text-stone-800'}">
              ✅ Attendance History
            </button>
            <button onclick="MessMateApp.setProfileTab('billing')" class="py-2 px-3 rounded-lg transition ${currentTab === 'billing' ? 'bg-orange-50 text-orange-700' : 'text-stone-500 hover:text-stone-800'}">
              💳 Billing Cycles (${cycles.length})
            </button>
            <button onclick="MessMateApp.setProfileTab('payments')" class="py-2 px-3 rounded-lg transition ${currentTab === 'payments' ? 'bg-orange-50 text-orange-700' : 'text-stone-500 hover:text-stone-800'}">
              💰 Payments (${payments.length})
            </button>
            <button onclick="MessMateApp.setProfileTab('deductions')" class="py-2 px-3 rounded-lg transition ${currentTab === 'deductions' ? 'bg-orange-50 text-orange-700' : 'text-stone-500 hover:text-stone-800'}">
              ✂️ Deductions (${deductions.length})
            </button>
            <button onclick="MessMateApp.setProfileTab('history')" class="py-2 px-3 rounded-lg transition ${currentTab === 'history' ? 'bg-orange-50 text-orange-700' : 'text-stone-500 hover:text-stone-800'}">
              📜 Timeline & Leaves
            </button>
          </div>

        </div>

        <!-- TAB CONTENTS -->

        <!-- 1. OVERVIEW TAB -->
        ${currentTab === 'overview' ? `
          <div class="space-y-6">
            
            <!-- Current Cycle Financial Highlight Card -->
            <div class="mess-card p-6 bg-gradient-to-r from-orange-50/50 via-white to-amber-50/50">
              <div class="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                <div>
                  <h2 class="text-base font-extrabold text-stone-900">Current Billing Cycle #${active_cycle ? active_cycle.cycle_number : 1}</h2>
                  <p class="text-xs text-stone-500">${active_cycle ? `${active_cycle.start_date} → ${active_cycle.end_date}` : 'Active'}</p>
                </div>
                <div>
                  <span class="px-3 py-1 text-xs font-extrabold rounded-full ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                    ${isPaid ? '✓ ALL PAID' : `PENDING: ₹${pendingAmount.toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>

              <!-- Clear Formula Breakdown -->
              <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
                
                <div class="p-3 bg-white rounded-xl border border-stone-200">
                  <p class="text-[10px] uppercase font-bold text-stone-400">Base Bill</p>
                  <p class="text-lg font-black text-stone-800 mt-1">₹${baseBill.toLocaleString('en-IN')}</p>
                </div>

                <div class="p-3 bg-white rounded-xl border border-stone-200">
                  <p class="text-[10px] uppercase font-bold text-stone-400">+ Prev Pending</p>
                  <p class="text-lg font-black text-amber-700 mt-1">₹${prevPending.toLocaleString('en-IN')}</p>
                </div>

                <div class="p-3 bg-white rounded-xl border border-stone-200">
                  <p class="text-[10px] uppercase font-bold text-stone-400">Missed Meals</p>
                  <p class="text-lg font-black text-stone-600 mt-1">${missedMeals}</p>
                </div>

                <div class="p-3 bg-white rounded-xl border border-stone-200">
                  <p class="text-[10px] uppercase font-bold text-stone-400">− Deduction</p>
                  <p class="text-lg font-black text-rose-600 mt-1">₹${totalDeductions.toLocaleString('en-IN')}</p>
                </div>

                <div class="p-3 bg-orange-50 rounded-xl border border-orange-200">
                  <p class="text-[10px] uppercase font-bold text-orange-700">Adjusted Bill</p>
                  <p class="text-lg font-black text-orange-900 mt-1">₹${(active_cycle ? active_cycle.adjusted_bill : baseBill).toLocaleString('en-IN')}</p>
                </div>

                <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p class="text-[10px] uppercase font-bold text-emerald-700">− Paid Amount</p>
                  <p class="text-lg font-black text-emerald-700 mt-1">₹${totalPaid.toLocaleString('en-IN')}</p>
                </div>

                <div class="p-3 ${isPaid ? 'bg-emerald-100 border-emerald-300' : 'bg-rose-100 border-rose-300'} rounded-xl border col-span-2 sm:col-span-1">
                  <p class="text-[10px] uppercase font-bold ${isPaid ? 'text-emerald-800' : 'text-rose-800'}">Current Due</p>
                  <p class="text-lg font-black ${isPaid ? 'text-emerald-900' : 'text-rose-900'} mt-1">₹${pendingAmount.toLocaleString('en-IN')}</p>
                </div>

              </div>

              <!-- Missed Meal Helper & Manual Deduction Recommendation -->
              ${missedMeals > 0 && totalDeductions === 0 ? `
                <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
                  <div class="flex items-center space-x-2">
                    <span>⚠️</span>
                    <span>This student missed <strong>${missedMeals} meals</strong> in this cycle. Would you like to enter a manual deduction?</span>
                  </div>
                  <button 
                    onclick="MessMateApp.openAddDeductionModal(${student.id})"
                    class="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition shadow-xs">
                    Apply Deduction
                  </button>
                </div>
              ` : ''}

            </div>

            <!-- Lifetime Summary Stats -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="mess-card p-4 text-center">
                <p class="text-xs text-stone-500 font-semibold uppercase">Lifetime Paid</p>
                <p class="text-2xl font-black text-emerald-700 mt-1">₹${lifetime_paid.toLocaleString('en-IN')}</p>
              </div>
              <div class="mess-card p-4 text-center">
                <p class="text-xs text-stone-500 font-semibold uppercase">Lifetime Deductions</p>
                <p class="text-2xl font-black text-rose-600 mt-1">₹${lifetime_deductions.toLocaleString('en-IN')}</p>
              </div>
              <div class="mess-card p-4 text-center">
                <p class="text-xs text-stone-500 font-semibold uppercase">Total Cycles Completed</p>
                <p class="text-2xl font-black text-stone-800 mt-1">${cycles.filter(c => c.status === 'closed').length}</p>
              </div>
            </div>

            <!-- Notes Section -->
            ${student.notes ? `
              <div class="mess-card p-5 bg-white">
                <h3 class="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">📝 Student Notes</h3>
                <p class="text-sm text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200">${student.notes}</p>
              </div>
            ` : ''}

          </div>
        ` : ''}

        <!-- 2. ATTENDANCE TAB -->
        ${currentTab === 'attendance' ? `
          <div class="mess-card p-5 bg-white space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-stone-800 uppercase tracking-wider">Attendance Log (Last 45 Days)</h2>
              <span class="text-xs text-stone-500">Showing recorded meals</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-stone-50 text-stone-500 font-bold border-b border-stone-200">
                  <tr>
                    <th class="py-2.5 px-3">Date</th>
                    <th class="py-2.5 px-3">Meal</th>
                    <th class="py-2.5 px-3">Status</th>
                    <th class="py-2.5 px-3">Recorded At</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-stone-100">
                  ${recent_attendance.length === 0 ? `
                    <tr><td colspan="4" class="p-6 text-center text-stone-400">No attendance logs available.</td></tr>
                  ` : recent_attendance.map(a => `
                    <tr class="hover:bg-stone-50/60">
                      <td class="py-2.5 px-3 font-semibold text-stone-800">${a.date}</td>
                      <td class="py-2.5 px-3 capitalize font-bold text-stone-700">${a.meal_type}</td>
                      <td class="py-2.5 px-3">
                        <span class="px-2 py-0.5 rounded-full font-bold ${a.status === 'ate' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                          ${a.status === 'ate' ? '✓ Ate' : '✕ Missed'}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 text-stone-400 text-[11px]">${a.recorded_at}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- 3. BILLING CYCLES TAB -->
        ${currentTab === 'billing' ? `
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-stone-800 uppercase tracking-wider">All Billing Cycles</h2>
              <button 
                onclick="MessMateApp.startNextBillingCycle(${student.id})"
                class="px-3.5 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-xs">
                + Close & Start Next Cycle ↻
              </button>
            </div>

            <div class="space-y-3">
              ${cycles.map(c => `
                <div class="mess-card p-5 bg-white border-l-4 ${c.status === 'active' ? 'border-orange-500' : 'border-stone-400'}">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3 mb-3">
                    <div>
                      <div class="flex items-center space-x-2">
                        <span class="font-black text-base text-stone-900">Cycle #${c.cycle_number}</span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'active' ? 'bg-orange-100 text-orange-800' : 'bg-stone-100 text-stone-700'}">
                          ${c.status.toUpperCase()}
                        </span>
                      </div>
                      <p class="text-xs text-stone-500 mt-0.5">${c.start_date} to ${c.end_date}</p>
                    </div>

                    <div class="text-right">
                      <p class="text-xs text-stone-400">Current Outstanding</p>
                      <p class="text-lg font-black ${c.current_pending === 0 ? 'text-emerald-700' : 'text-rose-700'}">
                        ₹${c.current_pending.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <!-- Details Grid -->
                  <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-stone-600">
                    <div><span class="text-stone-400">Base Bill:</span> <strong class="text-stone-800">₹${c.base_bill}</strong></div>
                    <div><span class="text-stone-400">Prev Pending:</span> <strong class="text-amber-800">₹${c.previous_pending}</strong></div>
                    <div><span class="text-stone-400">Deductions:</span> <strong class="text-rose-700">₹${c.total_deductions}</strong></div>
                    <div><span class="text-stone-400">Paid:</span> <strong class="text-emerald-700">₹${c.total_paid}</strong></div>
                    <div><span class="text-stone-400">Missed Meals:</span> <strong class="text-stone-700">${c.missed_stats.total_missed}</strong></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 4. PAYMENTS TAB -->
        ${currentTab === 'payments' ? `
          <div class="mess-card p-5 bg-white space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-stone-800 uppercase tracking-wider">Payment Transactions</h2>
              <button 
                onclick="MessMateApp.openRecordPaymentModal(${student.id})"
                class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs">
                + Record Payment
              </button>
            </div>

            <div class="divide-y divide-stone-100">
              ${payments.length === 0 ? `
                <div class="p-8 text-center text-stone-400">No payments recorded for this student yet.</div>
              ` : payments.map(p => `
                <div class="py-3.5 flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center">
                      ₹
                    </div>
                    <div>
                      <div class="flex items-center space-x-2">
                        <span class="font-extrabold text-stone-900 text-sm">₹${p.amount.toLocaleString('en-IN')}</span>
                        <span class="px-2 py-0.5 bg-stone-100 text-stone-700 text-[10px] font-bold rounded-md">${p.payment_method}</span>
                        <span class="text-xs text-stone-400">${p.payment_date}</span>
                      </div>
                      <p class="text-xs text-stone-500 mt-0.5">Receipt: <strong class="text-stone-700">${p.receipt_number || 'N/A'}</strong> ${p.notes ? `• ${p.notes}` : ''}</p>
                    </div>
                  </div>

                  <button 
                    onclick="MessMateApp.viewReceipt(${p.id})"
                    class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg transition">
                    📄 Print Receipt
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 5. DEDUCTIONS TAB -->
        ${currentTab === 'deductions' ? `
          <div class="mess-card p-5 bg-white space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-stone-800 uppercase tracking-wider">Manual Deductions Applied</h2>
              <button 
                onclick="MessMateApp.openAddDeductionModal(${student.id})"
                class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition shadow-xs">
                + Add Deduction
              </button>
            </div>

            <div class="divide-y divide-stone-100">
              ${deductions.length === 0 ? `
                <div class="p-8 text-center text-stone-400">No deductions recorded for this student.</div>
              ` : deductions.map(d => `
                <div class="py-3.5 flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-black text-sm flex items-center justify-center">
                      ✂️
                    </div>
                    <div>
                      <div class="flex items-center space-x-2">
                        <span class="font-extrabold text-rose-700 text-sm">−₹${d.amount.toLocaleString('en-IN')}</span>
                        <span class="text-xs text-stone-400">${d.deduction_date}</span>
                        ${d.missed_meal_count ? `<span class="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-md">${d.missed_meal_count} meals</span>` : ''}
                      </div>
                      <p class="text-xs text-stone-700 font-medium mt-0.5">${d.reason} ${d.notes ? `(${d.notes})` : ''}</p>
                    </div>
                  </div>
                  <span class="text-xs text-stone-400 font-semibold">Cycle #${d.cycle_number || 1}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 6. HISTORY & LEAVES TAB -->
        ${currentTab === 'history' ? `
          <div class="space-y-4">
            
            <!-- Leave Requests Card -->
            <div class="mess-card p-5 bg-white space-y-3">
              <h2 class="text-sm font-bold text-stone-800 uppercase tracking-wider">Leave & Absence Records</h2>
              <div class="divide-y divide-stone-100">
                ${leave_requests.length === 0 ? `
                  <div class="p-6 text-center text-stone-400 text-xs">No leave requests recorded.</div>
                ` : leave_requests.map(l => `
                  <div class="py-3 flex items-center justify-between">
                    <div>
                      <div class="flex items-center space-x-2">
                        <span class="font-bold text-stone-900 text-xs">${l.start_date} to ${l.end_date}</span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${l.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                          ${l.status.toUpperCase()}
                        </span>
                      </div>
                      <p class="text-xs text-stone-600 mt-0.5">${l.reason} (${(l.meals_skipped || []).join(', ')})</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Discontinuation info if inactive -->
            ${student.status === 'inactive' ? `
              <div class="mess-card p-5 bg-rose-50 border-rose-200">
                <h3 class="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">Discontinuation Record</h3>
                <p class="text-xs text-rose-900"><strong>Date:</strong> ${student.discontinue_date || 'N/A'}</p>
                <p class="text-xs text-rose-900 mt-1"><strong>Reason:</strong> ${student.discontinue_reason || 'Not specified'}</p>
                <p class="text-[11px] text-rose-700 mt-2">All financial, attendance, and receipt histories remain completely preserved and accessible.</p>
              </div>
            ` : ''}

          </div>
        ` : ''}

      </div>
    `;
  }
};
