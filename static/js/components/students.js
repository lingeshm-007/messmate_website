/**
 * Student Roster & Registration Component
 * Handles student listing, multi-field search without focus loss, filters, and registration.
 */

window.MessMateStudents = {
  // Multi-field search and filter logic
  filterStudents(allStudents, searchQuery, statusFilter = 'all') {
    const q = (searchQuery || '').trim().toLowerCase();
    const cleanIdQuery = q.replace(/^id[:\s#]*/i, '').trim();

    return (allStudents || []).filter(s => {
      // 1. Status Filter Tab
      if (statusFilter === 'active' && s.status !== 'active') return false;
      if (statusFilter === 'paused' && s.status !== 'paused') return false;
      if (statusFilter === 'inactive' && s.status !== 'inactive') return false;
      if (statusFilter === 'pending') {
        const pending = s.billing ? s.billing.current_pending : 0;
        if (pending <= 0) return false;
      }

      // 2. Search Query Multi-Field Filter
      if (!q) return true;

      const nameMatch = (s.name || '').toLowerCase().includes(q);
      const phoneMatch = (s.phone || '').toLowerCase().includes(q);
      const addressMatch = (s.address || '').toLowerCase().includes(q);
      const notesMatch = (s.notes || '').toLowerCase().includes(q);
      
      // ID Match (e.g. searching "1", "#1", "id 1", "id:1")
      const idMatch = String(s.id) === cleanIdQuery || String(s.id) === q || (`#${s.id}`).toLowerCase() === q;

      // Status Match (e.g. searching "active", "paused", "inactive", "discontinued")
      const statusMatch = (s.status || '').toLowerCase().includes(q) || (s.status === 'inactive' && q.includes('discontinue'));

      // Meal Plan Match (e.g. searching "breakfast", "lunch", "dinner", "three", "3", "two", "2")
      const meals = (s.meal_selection || []).map(m => m.toLowerCase());
      const mealsJoined = meals.join(' ');
      const mealMatch = mealsJoined.includes(q) ||
        (q.includes('three') || q === '3' || q.includes('3 meals') ? meals.length === 3 : false) ||
        (q.includes('two') || q === '2' || q.includes('2 meals') ? meals.length === 2 : false);

      // Payment Status Match (e.g. searching "pending", "due", "paid")
      const pending = s.billing ? s.billing.current_pending : 0;
      const paymentStatusMatch = (q === 'pending' || q === 'due') ? pending > 0 : (q === 'paid' || q === 'cleared') ? pending === 0 : false;

      return nameMatch || phoneMatch || addressMatch || idMatch || statusMatch || mealMatch || notesMatch || paymentStatusMatch;
    });
  },

  render(students, state) {
    const activeFilter = state.studentFilter || 'all';
    const searchQuery = state.studentSearch || '';
    const filteredStudents = this.filterStudents(students, searchQuery, activeFilter);

    return `
      <div class="space-y-6 animate-fade-in pb-16">
        
        <!-- Header & Action Bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">Student Management</h1>
            <p class="text-xs text-stone-500 mt-1">Manage active mess members, meal plans, and student registrations.</p>
          </div>

          <button 
            onclick="MessMateApp.openAddStudentModal()"
            class="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center space-x-2">
            <span>➕ Add New Student</span>
          </button>
        </div>

        <!-- Search & Filter Controls -->
        <div class="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
          <div class="flex flex-col sm:flex-row gap-3">
            
            <!-- Continuous Dynamic Search Input -->
            <div class="relative flex-1">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 text-base">
                🔍
              </span>
              <input 
                id="student-search-input"
                type="text" 
                placeholder="Search students by name, phone, address, ID, meal plan, status..."
                value="${searchQuery}"
                oninput="MessMateApp.handleStudentSearchInput(this.value)"
                class="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition"
                autocomplete="off"
                spellcheck="false"
              />
              <button 
                id="student-search-clear-btn"
                type="button"
                onclick="MessMateApp.clearStudentSearch()"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 font-bold text-sm ${searchQuery ? '' : 'hidden'}"
                title="Clear search">
                ✕
              </button>
            </div>

            <!-- Status Filter Tabs -->
            <div class="flex items-center space-x-1 overflow-x-auto text-xs font-semibold scrollbar-none" id="student-filter-tabs">
              <button 
                onclick="MessMateApp.filterStudentsStatus('all')"
                class="px-3 py-2 rounded-lg transition whitespace-nowrap ${activeFilter === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}">
                All (<span id="count-all">${students.length}</span>)
              </button>
              <button 
                onclick="MessMateApp.filterStudentsStatus('active')"
                class="px-3 py-2 rounded-lg transition whitespace-nowrap ${activeFilter === 'active' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}">
                🟢 Active (<span id="count-active">${students.filter(s => s.status === 'active').length}</span>)
              </button>
              <button 
                onclick="MessMateApp.filterStudentsStatus('paused')"
                class="px-3 py-2 rounded-lg transition whitespace-nowrap ${activeFilter === 'paused' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}">
                🟡 Paused (<span id="count-paused">${students.filter(s => s.status === 'paused').length}</span>)
              </button>
              <button 
                onclick="MessMateApp.filterStudentsStatus('inactive')"
                class="px-3 py-2 rounded-lg transition whitespace-nowrap ${activeFilter === 'inactive' ? 'bg-rose-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}">
                🔴 Inactive (<span id="count-inactive">${students.filter(s => s.status === 'inactive').length}</span>)
              </button>
              <button 
                onclick="MessMateApp.filterStudentsStatus('pending')"
                class="px-3 py-2 rounded-lg transition whitespace-nowrap ${activeFilter === 'pending' ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}">
                💳 Has Pending
              </button>
            </div>

          </div>

          <!-- Active Search Query Indicator -->
          <div id="search-feedback-bar" class="text-xs text-stone-500 flex items-center justify-between ${searchQuery ? '' : 'hidden'}">
            <span>Showing results for: <strong class="text-stone-800 font-bold" id="search-query-display">"${searchQuery}"</strong> (<span id="search-result-count">${filteredStudents.length}</span> students found)</span>
            <button onclick="MessMateApp.clearStudentSearch()" class="text-orange-600 hover:underline font-bold text-[11px]">Clear Filter</button>
          </div>
        </div>

        <!-- Student Cards Grid Container (Updated directly on keystrokes) -->
        <div id="students-cards-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${this.renderCardsHtml(filteredStudents)}
        </div>

      </div>
    `;
  },

  renderCardsHtml(studentsList) {
    if (!studentsList || studentsList.length === 0) {
      return `
        <div class="col-span-full p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 animate-fade-in">
          <div class="text-3xl mb-2">🔍</div>
          <p class="font-bold text-stone-800 text-sm">No students match your search criteria.</p>
          <p class="text-xs text-stone-400 mt-1">Try typing a different name, phone number, address, or ID.</p>
          <button onclick="MessMateApp.clearStudentSearch()" class="mt-4 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-lg transition">
            Clear Search Filter
          </button>
        </div>
      `;
    }

    return studentsList.map(s => {
      const meals = s.meal_selection || [];
      const billing = s.billing || {};
      const pendingAmount = billing.current_pending !== undefined ? billing.current_pending : 0;
      const isPaid = pendingAmount === 0;
      const cycleRange = billing.start_date && billing.end_date ? `${billing.start_date} to ${billing.end_date}` : 'Cycle not initialized';

      let statusBadge = `<span class="badge-active px-2.5 py-0.5 text-xs font-bold rounded-full">🟢 Active</span>`;
      if (s.status === 'paused') {
        statusBadge = `<span class="badge-paused px-2.5 py-0.5 text-xs font-bold rounded-full">🟡 Paused</span>`;
      } else if (s.status === 'inactive') {
        statusBadge = `<span class="badge-inactive px-2.5 py-0.5 text-xs font-bold rounded-full">🔴 Discontinued</span>`;
      }

      return `
        <div class="mess-card p-5 flex flex-col justify-between relative group animate-fade-in ${s.status === 'inactive' ? 'opacity-85 bg-stone-50/50' : 'bg-white'}">
          
          <div>
            <!-- Top Row: Photo, Name, ID, Status -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-stone-200 shadow-sm">
                  ${window.MessMateAvatars.getAvatarHtml(s.photo_url, s.name, 'w-12 h-12')}
                </div>
                <div>
                  <div class="flex items-center space-x-1.5">
                    <h2 class="font-extrabold text-stone-900 text-base hover:text-orange-600 cursor-pointer" onclick="MessMateApp.viewStudentProfile(${s.id})">
                      ${s.name}
                    </h2>
                    <span class="text-[10px] text-stone-400 font-mono">#${s.id}</span>
                  </div>
                  <p class="text-xs text-stone-500">📞 ${s.phone}</p>
                </div>
              </div>
              <div>
                ${statusBadge}
              </div>
            </div>

            <!-- Details List -->
            <div class="mt-4 space-y-2 text-xs border-t border-stone-100 pt-3">
              <div class="flex justify-between text-stone-600">
                <span class="text-stone-400 font-medium">Joined:</span>
                <span class="font-bold text-stone-800">${s.joining_date}</span>
              </div>

              <div class="flex justify-between text-stone-600">
                <span class="text-stone-400 font-medium">Selected Meals:</span>
                <span class="font-bold text-stone-800">${meals.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ')}</span>
              </div>

              <div class="flex justify-between text-stone-600">
                <span class="text-stone-400 font-medium">Monthly Plan:</span>
                <span class="font-extrabold text-stone-900">₹${s.monthly_fee.toLocaleString('en-IN')}/mo</span>
              </div>

              <div class="flex justify-between text-stone-600">
                <span class="text-stone-400 font-medium">Current Cycle:</span>
                <span class="font-medium text-stone-700 text-[11px]">${cycleRange}</span>
              </div>

              <!-- Pending Balance Highlight -->
              <div class="mt-2 p-2.5 rounded-xl ${isPaid ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'} flex items-center justify-between">
                <span class="font-semibold text-xs">${isPaid ? '✓ All Cleared' : 'Pending Balance:'}</span>
                <span class="font-black text-sm ${isPaid ? 'text-emerald-700' : 'text-rose-700'}">₹${pendingAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <!-- Card Actions Bottom -->
          <div class="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
            <button 
              onclick="MessMateApp.viewStudentProfile(${s.id})"
              class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg transition flex-1 text-center">
              Full Profile
            </button>

            ${s.status !== 'inactive' ? `
              <button 
                onclick="MessMateApp.openRecordPaymentModal(${s.id})"
                class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition">
                Pay ₹
              </button>
              <button 
                onclick="MessMateApp.openAddDeductionModal(${s.id})"
                class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition">
                Deduct
              </button>
              <button 
                onclick="MessMateApp.openDiscontinueModal(${s.id}, '${s.name}')"
                title="Discontinue Student (Preserves history)"
                class="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition text-xs">
                ✕
              </button>
            ` : `
              <button 
                onclick="MessMateApp.reactivateStudent(${s.id})"
                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex-1">
                Reactivate Student ↺
              </button>
            `}
          </div>

        </div>
      `;
    }).join('');
  }
};
