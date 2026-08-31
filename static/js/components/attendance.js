/**
 * Daily Meal Attendance Component
 * High-contrast, mobile-first attendance marking interface for Aunty while serving food.
 */

window.MessMateAttendance = {
  render(data, state) {
    const dateStr = data ? data.date : state.selectedDate;
    const students = (data && data.students) || [];
    const dateObj = new Date(dateStr + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    // Calculate live attendance totals for this date
    let bAte = 0, bMissed = 0, lAte = 0, lMissed = 0, dAte = 0, dMissed = 0;
    students.forEach(s => {
      const att = s.attendance || {};
      if (att.breakfast === 'ate') bAte++; else if (att.breakfast === 'missed') bMissed++;
      if (att.lunch === 'ate') lAte++; else if (att.lunch === 'missed') lMissed++;
      if (att.dinner === 'ate') dAte++; else if (att.dinner === 'missed') dMissed++;
    });

    return `
      <div class="space-y-6 animate-fade-in pb-16">
        
        <!-- Header & Date Controls -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">Daily Meal Attendance</h1>
              <span class="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">Live Sheet</span>
            </div>
            <p class="text-xs text-stone-500 mt-1">Tap ATE or MISSED for each student while serving meals.</p>
          </div>

          <!-- Date Stepper & Picker -->
          <div class="flex items-center space-x-2">
            <button 
              onclick="MessMateApp.changeAttendanceDate(-1)" 
              class="p-2 rounded-xl border border-stone-300 hover:bg-stone-100 transition text-stone-700 font-bold"
              title="Previous Day">
              ◀
            </button>

            <div class="relative">
              <input 
                type="date" 
                value="${dateStr}" 
                onchange="MessMateApp.setAttendanceDate(this.value)"
                class="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-bold text-stone-800 focus:ring-orange-500 focus:border-orange-500 cursor-pointer shadow-inner"
              />
            </div>

            <button 
              onclick="MessMateApp.changeAttendanceDate(1)" 
              class="p-2 rounded-xl border border-stone-300 hover:bg-stone-100 transition text-stone-700 font-bold"
              title="Next Day">
              ▶
            </button>

            <button 
              onclick="MessMateApp.setAttendanceDate('${new Date().toISOString().split('T')[0]}')" 
              class="px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition border border-orange-200">
              Today
            </button>
          </div>
        </div>

        <!-- Attendance Stats & Quick Bulk Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          <!-- Breakfast Quick Card -->
          <div class="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div class="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                <span>🥞 Breakfast</span>
              </div>
              <p class="text-sm font-black text-amber-950 mt-1">
                <span class="text-emerald-700 font-extrabold">${bAte} Ate</span> • <span class="text-rose-700 font-extrabold">${bMissed} Missed</span>
              </p>
            </div>
            <button 
              onclick="MessMateApp.bulkMarkAttendance('${dateStr}', 'breakfast', 'ate')"
              class="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition">
              Mark All Ate ✓
            </button>
          </div>

          <!-- Lunch Quick Card -->
          <div class="bg-orange-50/60 border border-orange-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div class="flex items-center space-x-1.5 text-xs font-bold text-orange-900">
                <span>🍛 Lunch</span>
              </div>
              <p class="text-sm font-black text-orange-950 mt-1">
                <span class="text-emerald-700 font-extrabold">${lAte} Ate</span> • <span class="text-rose-700 font-extrabold">${lMissed} Missed</span>
              </p>
            </div>
            <button 
              onclick="MessMateApp.bulkMarkAttendance('${dateStr}', 'lunch', 'ate')"
              class="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs transition">
              Mark All Ate ✓
            </button>
          </div>

          <!-- Dinner Quick Card -->
          <div class="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div class="flex items-center space-x-1.5 text-xs font-bold text-indigo-900">
                <span>🍲 Dinner</span>
              </div>
              <p class="text-sm font-black text-indigo-950 mt-1">
                <span class="text-emerald-700 font-extrabold">${dAte} Ate</span> • <span class="text-rose-700 font-extrabold">${dMissed} Missed</span>
              </p>
            </div>
            <button 
              onclick="MessMateApp.bulkMarkAttendance('${dateStr}', 'dinner', 'ate')"
              class="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition">
              Mark All Ate ✓
            </button>
          </div>

        </div>

        <!-- Student Attendance List / Cards -->
        <div class="space-y-3">
          <div class="flex items-center justify-between px-1">
            <h2 class="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Students Roster (${students.length}) — ${formattedDate}
            </h2>
            <span class="text-xs text-stone-400">Click ATE / MISSED buttons to toggle</span>
          </div>

          ${students.length === 0 ? `
            <div class="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500">
              No active students found for this date.
            </div>
          ` : students.map(s => {
            const att = s.attendance || {};
            const meals = s.meal_selection || [];
            const isPaused = s.status === 'paused';
            const isInactive = s.status === 'inactive';

            return `
              <div class="mess-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${isPaused ? 'bg-amber-50/30' : isInactive ? 'bg-stone-100/60 opacity-80' : 'bg-white'}">
                
                <!-- Student Details & Photo -->
                <div class="flex items-center space-x-3.5 min-w-[240px]">
                  <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-stone-300 shadow-sm">
                    ${window.MessMateAvatars.getAvatarHtml(s.photo_url, s.name, 'w-12 h-12')}
                  </div>
                  <div>
                    <div class="flex items-center space-x-2">
                      <span class="font-extrabold text-stone-900 text-base hover:text-orange-600 cursor-pointer" onclick="MessMateApp.viewStudentProfile(${s.id})">
                        ${s.name}
                      </span>
                      ${isPaused ? '<span class="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">Paused (Leave)</span>' : ''}
                      ${isInactive ? '<span class="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full">Inactive</span>' : ''}
                    </div>
                    <div class="flex items-center space-x-2 text-xs text-stone-500 mt-0.5">
                      <span>📞 ${s.phone}</span>
                      <span>•</span>
                      <span class="font-medium text-stone-600">${meals.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ')}</span>
                    </div>
                  </div>
                </div>

                <!-- Meal Attendance Buttons (B, L, D) -->
                <div class="grid grid-cols-3 gap-2 sm:gap-3 flex-1 max-w-xl">
                  
                  <!-- Breakfast Button Group -->
                  <div class="flex flex-col items-center">
                    <span class="text-[11px] font-bold text-stone-500 mb-1">🥞 Breakfast</span>
                    ${meals.includes('breakfast') ? `
                      <div class="grid grid-cols-2 gap-1 w-full">
                        <button 
                          onclick="MessMateApp.markAttendance(${s.id}, '${dateStr}', 'breakfast', 'ate')"
                          class="btn-att-ate text-xs py-2 px-2 rounded-lg font-bold ${att.breakfast === 'ate' ? 'active' : ''}">
                          Ate ✓
                        </button>
                        <button 
                          onclick="MessMateApp.markAttendance(${s.id}, '${dateStr}', 'breakfast', 'missed')"
                          class="btn-att-missed text-xs py-2 px-2 rounded-lg font-bold ${att.breakfast === 'missed' ? 'active' : ''}">
                          Missed ✕
                        </button>
                      </div>
                    ` : `
                      <div class="w-full py-2 px-2 text-center text-[11px] font-semibold text-stone-400 bg-stone-100 rounded-lg border border-dashed border-stone-200">
                        Not in Plan
                      </div>
                    `}
                  </div>

                  <!-- Lunch Button Group -->
                  <div class="flex flex-col items-center">
                    <span class="text-[11px] font-bold text-stone-500 mb-1">🍛 Lunch</span>
                    ${meals.includes('lunch') ? `
                      <div class="grid grid-cols-2 gap-1 w-full">
                        <button 
                          onclick="MessMateApp.markAttendance(${s.id}, '${dateStr}', 'lunch', 'ate')"
                          class="btn-att-ate text-xs py-2 px-2 rounded-lg font-bold ${att.lunch === 'ate' ? 'active' : ''}">
                          Ate ✓
                        </button>
                        <button 
                          onclick="MessMateApp.markAttendance(${s.id}, '${dateStr}', 'lunch', 'missed')"
                          class="btn-att-missed text-xs py-2 px-2 rounded-lg font-bold ${att.lunch === 'missed' ? 'active' : ''}">
                          Missed ✕
                        </button>
                      </div>
                    ` : `
                      <div class="w-full py-2 px-2 text-center text-[11px] font-semibold text-stone-400 bg-stone-100 rounded-lg border border-dashed border-stone-200">
                        Not in Plan
                      </div>
                    `}
                  </div>

                  <!-- Dinner Button Group -->
                  <div class="flex flex-col items-center">
                    <span class="text-[11px] font-bold text-stone-500 mb-1">🍲 Dinner</span>
                    ${meals.includes('dinner') ? `
                      <div class="grid grid-cols-2 gap-1 w-full">
                        <button 
                          onclick="MessMateApp.markAttendance(${s.id}, '${dateStr}', 'dinner', 'ate')"
                          class="btn-att-ate text-xs py-2 px-2 rounded-lg font-bold ${att.dinner === 'ate' ? 'active' : ''}">
                          Ate ✓
                        </button>
                        <button 
                          onclick="MessMateApp.markAttendance(${s.id}, '${dateStr}', 'dinner', 'missed')"
                          class="btn-att-missed text-xs py-2 px-2 rounded-lg font-bold ${att.dinner === 'missed' ? 'active' : ''}">
                          Missed ✕
                        </button>
                      </div>
                    ` : `
                      <div class="w-full py-2 px-2 text-center text-[11px] font-semibold text-stone-400 bg-stone-100 rounded-lg border border-dashed border-stone-200">
                        Not in Plan
                      </div>
                    `}
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
