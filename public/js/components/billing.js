/**
 * Billing & Deductions Hub Component
 * Handles individual billing cycles, manual meal deductions, and carry-forward balances.
 */

window.MessMateBilling = {
  render(students, state) {
    return `
      <div class="space-y-6 animate-fade-in pb-16">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">Billing & Manual Deductions</h1>
              <span class="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">Individual Cycles</span>
            </div>
            <p class="text-xs text-stone-500 mt-1">Each student has their own cycle based on joining date. Deductions are manual and balances carry forward automatically.</p>
          </div>

          <div class="flex items-center space-x-2">
            <button 
              onclick="MessMateApp.openAddDeductionModal()"
              class="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5">
              <span>✂️ Add Deduction</span>
            </button>
            <button 
              onclick="MessMateApp.openRecordPaymentModal()"
              class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5">
              <span>💰 Record Payment</span>
            </button>
          </div>
        </div>

        <!-- Formula Callout Banner -->
        <div class="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-2.5">
            <span class="text-xl">💡</span>
            <div>
              <p class="font-bold">Carry-Forward Formula</p>
              <p class="font-mono text-amber-900 text-[11px] mt-0.5">Current Due = Previous Due + (Base Bill − Manual Deductions) − Payments</p>
            </div>
          </div>
          <div class="text-[11px] text-amber-800 italic">
            *Deductions are never deducted automatically; you decide the amount.
          </div>
        </div>

        <!-- Student Billing Cards -->
        <div class="space-y-4">
          ${students.filter(s => s.status !== 'inactive').map(s => {
            const billing = s.billing || {};
            const meals = s.meal_selection || [];
            const isPaid = billing.current_pending === 0;
            const missedMeals = billing.missed_stats ? billing.missed_stats.total_missed : 0;
            const cycleNumber = billing.cycle_number || 1;
            const cycleDates = billing.start_date && billing.end_date ? `${billing.start_date} → ${billing.end_date}` : 'Initial';

            return `
              <div class="mess-card p-5 bg-white border-l-4 ${isPaid ? 'border-emerald-500' : 'border-rose-500'}">
                
                <!-- Card Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3 mb-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-stone-200 shadow-sm">
                      ${window.MessMateAvatars.getAvatarHtml(s.photo_url, s.name, 'w-12 h-12')}
                    </div>
                    <div>
                      <div class="flex items-center space-x-2">
                        <span class="font-extrabold text-base text-stone-900 hover:text-orange-600 cursor-pointer" onclick="MessMateApp.viewStudentProfile(${s.id})">
                          ${s.name}
                        </span>
                        <span class="text-xs px-2 py-0.5 bg-stone-100 text-stone-700 font-semibold rounded-md">
                          Cycle #${cycleNumber}
                        </span>
                      </div>
                      <p class="text-xs text-stone-500 mt-0.5">
                        Cycle Period: <strong class="text-stone-700">${cycleDates}</strong> (Joined: ${s.joining_date})
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center space-x-2">
                    <span class="px-3 py-1 text-xs font-black rounded-full ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                      ${isPaid ? '✓ ALL PAID' : `PENDING: ₹${billing.current_pending.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>

                <!-- Financial Breakdown Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center text-xs">
                  
                  <div class="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <p class="text-[10px] uppercase font-bold text-stone-400">Base Bill</p>
                    <p class="text-base font-black text-stone-800 mt-0.5">₹${(billing.base_bill || s.monthly_fee).toLocaleString('en-IN')}</p>
                  </div>

                  <div class="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <p class="text-[10px] uppercase font-bold text-stone-400">+ Prev Pending</p>
                    <p class="text-base font-black text-amber-700 mt-0.5">₹${(billing.previous_pending || 0).toLocaleString('en-IN')}</p>
                  </div>

                  <div class="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <p class="text-[10px] uppercase font-bold text-stone-400">Missed Meals</p>
                    <p class="text-base font-black text-stone-700 mt-0.5">${missedMeals}</p>
                  </div>

                  <div class="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <p class="text-[10px] uppercase font-bold text-stone-400">− Deduction</p>
                    <p class="text-base font-black text-rose-600 mt-0.5">₹${(billing.total_deductions || 0).toLocaleString('en-IN')}</p>
                  </div>

                  <div class="p-2.5 bg-orange-50/60 rounded-xl border border-orange-200">
                    <p class="text-[10px] uppercase font-bold text-orange-800">Adjusted Bill</p>
                    <p class="text-base font-black text-orange-900 mt-0.5">₹${(billing.adjusted_bill || billing.base_bill || s.monthly_fee).toLocaleString('en-IN')}</p>
                  </div>

                  <div class="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <p class="text-[10px] uppercase font-bold text-emerald-800">− Paid</p>
                    <p class="text-base font-black text-emerald-700 mt-0.5">₹${(billing.total_paid || 0).toLocaleString('en-IN')}</p>
                  </div>

                  <div class="p-2.5 ${isPaid ? 'bg-emerald-100 border-emerald-300' : 'bg-rose-100 border-rose-300'} rounded-xl border col-span-2 sm:col-span-1">
                    <p class="text-[10px] uppercase font-bold ${isPaid ? 'text-emerald-800' : 'text-rose-800'}">Current Due</p>
                    <p class="text-base font-black ${isPaid ? 'text-emerald-900' : 'text-rose-900'} mt-0.5">₹${(billing.current_pending || 0).toLocaleString('en-IN')}</p>
                  </div>

                </div>

                <!-- Footer Quick Action Toolbar -->
                <div class="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                  <div class="text-xs text-stone-500">
                    Plan: <span class="font-semibold text-stone-700">${meals.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ')}</span>
                  </div>

                  <div class="flex items-center space-x-2">
                    <button 
                      onclick="MessMateApp.openAddDeductionModal(${s.id}, ${billing.cycle_id})"
                      class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition">
                      ✂️ Add Deduction
                    </button>
                    <button 
                      onclick="MessMateApp.openRecordPaymentModal(${s.id}, ${billing.cycle_id})"
                      class="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold transition">
                      💰 Record Payment
                    </button>
                    <button 
                      onclick="MessMateApp.startNextBillingCycle(${s.id})"
                      title="Roll over remaining balance to next month cycle"
                      class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold transition">
                      Next Cycle ↻
                    </button>
                  </div>
                </div>

              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;
  }
};
