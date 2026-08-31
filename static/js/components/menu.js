/**
 * Weekly Menu Management Component
 * Simple, beautiful Monday to Sunday menu viewer and editor.
 */

window.MessMateMenu = {
  render(menuDays, state) {
    return `
      <div class="space-y-6 animate-fade-in pb-16">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">Weekly Mess Menu</h1>
              <span class="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">Mon – Sun</span>
            </div>
            <p class="text-xs text-stone-500 mt-1">Configure and display daily breakfast, lunch, and dinner specials for students.</p>
          </div>

          <button 
            onclick="MessMateApp.saveMenu()"
            class="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center space-x-2">
            <span>💾 Save All Changes</span>
          </button>
        </div>

        <!-- Menu Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${menuDays.map((day, idx) => `
            <div class="mess-card p-5 bg-white flex flex-col justify-between space-y-4 border-t-4 border-orange-500" data-day="${day.day_of_week}">
              
              <div>
                <div class="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <h2 class="font-extrabold text-base text-stone-900 flex items-center space-x-2">
                    <span>📅</span>
                    <span>${day.day_of_week}</span>
                  </h2>
                  <span class="text-[10px] font-bold px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">Day ${day.day_order}</span>
                </div>

                <!-- Meal Inputs -->
                <div class="mt-3.5 space-y-3">
                  
                  <div>
                    <label class="block text-[11px] font-bold text-stone-600 uppercase mb-1">🥞 Breakfast</label>
                    <textarea 
                      id="menu-b-${day.day_of_week}"
                      rows="2"
                      class="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-orange-500 focus:border-orange-500"
                    >${day.breakfast_items || ''}</textarea>
                  </div>

                  <div>
                    <label class="block text-[11px] font-bold text-stone-600 uppercase mb-1">🍛 Lunch</label>
                    <textarea 
                      id="menu-l-${day.day_of_week}"
                      rows="2"
                      class="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-orange-500 focus:border-orange-500"
                    >${day.lunch_items || ''}</textarea>
                  </div>

                  <div>
                    <label class="block text-[11px] font-bold text-stone-600 uppercase mb-1">🍲 Dinner</label>
                    <textarea 
                      id="menu-d-${day.day_of_week}"
                      rows="2"
                      class="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-orange-500 focus:border-orange-500"
                    >${day.dinner_items || ''}</textarea>
                  </div>

                  <div>
                    <label class="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Special Note</label>
                    <input 
                      type="text"
                      id="menu-note-${day.day_of_week}"
                      value="${day.special_note || ''}"
                      placeholder="e.g. Special filter coffee or sweet payasam"
                      class="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-orange-500"
                    />
                  </div>

                </div>
              </div>

            </div>
          `).join('')}
        </div>

      </div>
    `;
  }
};
