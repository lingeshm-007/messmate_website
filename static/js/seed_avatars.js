/**
 * MessMate Avatar & Image Generator Helpers
 * Provides crisp, high-resolution student avatars and custom photo fallbacks.
 */

window.MessMateAvatars = {
  // Preset avatars for demo students
  presets: {
    avatar_lingesh: {
      bg: '#fed7aa',
      fg: '#9a3412',
      initials: 'L',
      name: 'Lingesh',
      svg: `<svg viewBox="0 0 100 100" class="w-full h-full rounded-full"><circle cx="50" cy="50" r="50" fill="#ffedd5"/><circle cx="50" cy="40" r="20" fill="#ea580c"/><path d="M22 84 C22 66, 35 58, 50 58 C65 58, 78 66, 78 84 Z" fill="#ea580c"/><circle cx="43" cy="38" r="2.5" fill="#fff"/><circle cx="57" cy="38" r="2.5" fill="#fff"/><path d="M44 48 Q50 54 56 48" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`
    },
    avatar_arun: {
      bg: '#e0e7ff',
      fg: '#3730a3',
      initials: 'AK',
      name: 'Arun Kumar',
      svg: `<svg viewBox="0 0 100 100" class="w-full h-full rounded-full"><circle cx="50" cy="50" r="50" fill="#e0e7ff"/><circle cx="50" cy="40" r="20" fill="#4f46e5"/><path d="M22 84 C22 66, 35 58, 50 58 C65 58, 78 66, 78 84 Z" fill="#4f46e5"/><circle cx="43" cy="38" r="2.5" fill="#fff"/><circle cx="57" cy="38" r="2.5" fill="#fff"/><path d="M45 47 Q50 52 55 47" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`
    },
    avatar_priya: {
      bg: '#fce7f3',
      fg: '#9d174d',
      initials: 'PS',
      name: 'Priya Sharma',
      svg: `<svg viewBox="0 0 100 100" class="w-full h-full rounded-full"><circle cx="50" cy="50" r="50" fill="#fce7f3"/><circle cx="50" cy="40" r="20" fill="#db2777"/><path d="M22 84 C22 66, 35 58, 50 58 C65 58, 78 66, 78 84 Z" fill="#db2777"/><circle cx="43" cy="38" r="2.5" fill="#fff"/><circle cx="57" cy="38" r="2.5" fill="#fff"/><path d="M44 48 Q50 54 56 48" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`
    },
    avatar_karthik: {
      bg: '#d1fae5',
      fg: '#065f46',
      initials: 'KR',
      name: 'Karthik Raja',
      svg: `<svg viewBox="0 0 100 100" class="w-full h-full rounded-full"><circle cx="50" cy="50" r="50" fill="#d1fae5"/><circle cx="50" cy="40" r="20" fill="#059669"/><path d="M22 84 C22 66, 35 58, 50 58 C65 58, 78 66, 78 84 Z" fill="#059669"/><circle cx="43" cy="38" r="2.5" fill="#fff"/><circle cx="57" cy="38" r="2.5" fill="#fff"/><path d="M45 47 Q50 52 55 47" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`
    },
    avatar_divya: {
      bg: '#fef3c7',
      fg: '#92400e',
      initials: 'DN',
      name: 'Divya Natesan',
      svg: `<svg viewBox="0 0 100 100" class="w-full h-full rounded-full"><circle cx="50" cy="50" r="50" fill="#fef3c7"/><circle cx="50" cy="40" r="20" fill="#d97706"/><path d="M22 84 C22 66, 35 58, 50 58 C65 58, 78 66, 78 84 Z" fill="#d97706"/><circle cx="43" cy="38" r="2.5" fill="#fff"/><circle cx="57" cy="38" r="2.5" fill="#fff"/><path d="M44 48 Q50 54 56 48" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`
    },
    avatar_vignesh: {
      bg: '#e2e8f0',
      fg: '#475569',
      initials: 'VM',
      name: 'Vignesh Murugan',
      svg: `<svg viewBox="0 0 100 100" class="w-full h-full rounded-full"><circle cx="50" cy="50" r="50" fill="#e2e8f0"/><circle cx="50" cy="40" r="20" fill="#64748b"/><path d="M22 84 C22 66, 35 58, 50 58 C65 58, 78 66, 78 84 Z" fill="#64748b"/><circle cx="43" cy="38" r="2.5" fill="#fff"/><circle cx="57" cy="38" r="2.5" fill="#fff"/><path d="M45 47 Q50 52 55 47" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`
    },
    avatar_sanjay: {
      bg: '#cffafe',
      fg: '#155e75',
      initials: 'SR',
      name: 'Sanjay Raghav',
      svg: `<svg viewBox="0 0 100 100" class="w-full h-full rounded-full"><circle cx="50" cy="50" r="50" fill="#cffafe"/><circle cx="50" cy="40" r="20" fill="#0891b2"/><path d="M22 84 C22 66, 35 58, 50 58 C65 58, 78 66, 78 84 Z" fill="#0891b2"/><circle cx="43" cy="38" r="2.5" fill="#fff"/><circle cx="57" cy="38" r="2.5" fill="#fff"/><path d="M45 47 Q50 52 55 47" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`
    }
  },

  getAvatarHtml(photoUrl, name = 'Student', size = 'w-10 h-10 text-sm') {
    if (photoUrl && this.presets[photoUrl]) {
      return `<div class="${size} rounded-full overflow-hidden flex-shrink-0 border border-stone-200 shadow-sm inline-block">${this.presets[photoUrl].svg}</div>`;
    }
    
    // If it's a data URL or external image URL
    if (photoUrl && (photoUrl.startsWith('data:image') || photoUrl.startsWith('http') || photoUrl.startsWith('/'))) {
      return `<img src="${photoUrl}" alt="${name}" class="${size} rounded-full object-cover flex-shrink-0 border border-stone-200 shadow-sm inline-block" onerror="this.outerHTML=window.MessMateAvatars.getDefaultInitialsAvatar('${name}', '${size}')"/>`;
    }

    // Default Initials Avatar
    return this.getDefaultInitialsAvatar(name, size);
  },

  getDefaultInitialsAvatar(name = 'S', size = 'w-10 h-10 text-sm') {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'S';
    const colors = [
      { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
      { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
      { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
      { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' },
      { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' }
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const color = colors[Math.abs(hash) % colors.length];

    return `<div class="${size} rounded-full ${color.bg} ${color.text} ${color.border} border font-bold flex items-center justify-center flex-shrink-0 shadow-sm inline-block">${initials}</div>`;
  }
};
