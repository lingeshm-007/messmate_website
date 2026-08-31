/**
 * Payments & Receipts Component
 * Complete transaction history, partial payment logger, and printable receipt vouchers.
 */

window.MessMatePayments = {
  render(payments, state) {
    const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    return `
      <div class="space-y-6 animate-fade-in pb-16">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">Payments & Receipts</h1>
              <span class="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Total: ₹${totalCollected.toLocaleString('en-IN')}</span>
            </div>
            <p class="text-xs text-stone-500 mt-1">Record partial or full student payments and generate digital receipt vouchers.</p>
          </div>

          <button 
            onclick="MessMateApp.openRecordPaymentModal()"
            class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center space-x-2">
            <span>➕ Record New Payment</span>
          </button>
        </div>

        <!-- Payments Table Card -->
        <div class="mess-card bg-white p-5 space-y-4">
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead class="bg-stone-50 text-stone-500 font-bold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="py-3 px-4">Receipt #</th>
                  <th class="py-3 px-4">Student</th>
                  <th class="py-3 px-4">Amount</th>
                  <th class="py-3 px-4">Date</th>
                  <th class="py-3 px-4">Method</th>
                  <th class="py-3 px-4">Cycle</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100">
                ${payments.length === 0 ? `
                  <tr><td colspan="7" class="p-8 text-center text-stone-400 text-sm">No payment records found.</td></tr>
                ` : payments.map(p => `
                  <tr class="hover:bg-stone-50/60">
                    <td class="py-3 px-4 font-mono font-bold text-stone-700">${p.receipt_number || `REC-${p.id}`}</td>
                    <td class="py-3 px-4">
                      <div class="flex items-center space-x-2.5">
                        <div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-stone-200">
                          ${window.MessMateAvatars.getAvatarHtml(p.photo_url, p.student_name, 'w-8 h-8 text-[10px]')}
                        </div>
                        <span class="font-bold text-stone-900 text-xs hover:text-orange-600 cursor-pointer" onclick="MessMateApp.viewStudentProfile(${p.student_id})">
                          ${p.student_name}
                        </span>
                      </div>
                    </td>
                    <td class="py-3 px-4 font-black text-emerald-700 text-sm">₹${p.amount.toLocaleString('en-IN')}</td>
                    <td class="py-3 px-4 font-medium text-stone-600">${p.payment_date}</td>
                    <td class="py-3 px-4">
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold ${p.payment_method === 'UPI' ? 'bg-purple-100 text-purple-800' : p.payment_method === 'Cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-800'}">
                        ${p.payment_method}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-stone-500 text-[11px]">
                      Cycle #${p.cycle_number || 1}
                    </td>
                    <td class="py-3 px-4 text-right">
                      <button 
                        onclick="MessMateApp.viewReceipt(${p.id})"
                        class="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg transition">
                        📄 Receipt
                      </button>
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
