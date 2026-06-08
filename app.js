/* 
================================================================
  매일의 나를 기록하는 감정 기록 다이어리 - Core Logic (app.js)
================================================================
*/

import { POSITIVE_EMOTICONS, NEGATIVE_EMOTICONS, ALL_CUSTOM_EMOTICONS } from './emoticons.js';

// 1. Initial State & Configuration
const DEFAULT_EMOJIS = [
  // 감정 (Emotions)
  { char: '😊', label: '기쁨' },
  { char: '🤩', label: '신남' },
  { char: '😌', label: '평온' },
  { char: '😢', label: '슬픔' },
  { char: '😡', label: '화남' },
  { char: '😴', label: '피곤' },
  // 하트 (Hearts)
  { char: '❤️', label: '빨강하트' },
  { char: '💚', label: '초록하트' },
  { char: '💖', label: '반짝하트' },
  { char: '💜', label: '보라하트' },
  // 별 & 자연 (Stars & Nature)
  { char: '⭐', label: '별' },
  { char: '✨', label: '반짝임' }
];

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyD0z1UjVlidMtA7c7UdgJUjOmps3GcomMI',
  projectId: 'mood-diary-4f2e9',
  appId: '1:248808216631:web:03824a11cc22924795c7b2',
  googleClientId: '248808216631-epmbeir2ckgllb5vd6u29o33p4joq0vc.apps.googleusercontent.com'
};

let state = {
  currentUser: {
    name: '게스트 사용자',
    email: 'guest_user',
    picture: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23a855f7%22/><text x=%2250%22 y=%2265%22 font-size=%2250%22 fill=%22%23ffffff%22 text-anchor=%22middle%22>👤</text></svg>'
  },
  currentDate: new Date(), // 달력 조회용 날짜
  diaries: {}, // YYYY-MM-DD -> { emoji: '😊', message: '...' }
  customEmojis: [], // 사용자가 추가한 이모지 문자열 리스트

  db: null, // Firebase db 인스턴스
  selectedEmoji: '', // 모달에서 현재 선택된 이모지
  activeEmojiTab: 'basic', // 현재 활성화된 이모지 탭 ('basic', 'positive', 'negative')
  activeModalDate: '', // 모달이 띄워진 날짜 (YYYY-MM-DD)
  deferredInstallPrompt: null, // PWA 설치 프롬프트
  isLocked: false,
  hasPassword: false,
  savedPassword: ''
};

// 2. DOM Elements
const elements = {
  themeToggleBtn: document.getElementById('btn-theme-toggle'),
  themeIcon: document.getElementById('theme-icon'),
  syncConfigBtn: document.getElementById('btn-sync-config'),
  currentMonthYearLabel: document.getElementById('current-month-year-label'),
  prevMonthBtn: document.getElementById('btn-prev-month'),
  todayMonthBtn: document.getElementById('btn-today-month'),
  nextMonthBtn: document.getElementById('btn-next-month'),
  daysGridContainer: document.getElementById('days-grid-container'),
  
  // Modals & Overlays
  diaryModal: document.getElementById('diary-modal'),
  closeDiaryModalBtn: document.getElementById('btn-close-diary-modal'),
  cancelDiaryBtn: document.getElementById('btn-cancel-diary'),
  
  // Lock Screen Elements
  lockScreenOverlay: document.getElementById('lock-screen-overlay'),
  lockTitle: document.getElementById('lock-title'),
  lockSubtitle: document.getElementById('lock-subtitle'),
  inputPassword: document.getElementById('input-password'),
  passwordError: document.getElementById('password-error'),
  btnSubmitPassword: document.getElementById('btn-submit-password'),
  btnResetPassword: document.getElementById('btn-reset-password'),
  
  // Diary Modal Form elements
  diaryModalDateLabel: document.getElementById('diary-modal-date-label'),
  emojiPickerGrid: document.getElementById('emoji-picker-grid'),
  inputCustomEmoji: document.getElementById('input-custom-emoji'),
  btnAddCustomEmoji: document.getElementById('btn-add-custom-emoji'),
  textareaDiaryMessage: document.getElementById('textarea-diary-message'),
  charCounterLabel: document.getElementById('char-counter-label'),
  btnSaveDiary: document.getElementById('btn-save-diary'),
  btnDeleteDiary: document.getElementById('btn-delete-diary'),
  

  // Auth Elements
  authContainer: document.getElementById('auth-container'),
  profileContainer: document.getElementById('profile-container'),
  userPhoto: document.getElementById('user-photo'),
  userNameText: document.getElementById('user-name-text'),
  btnLogoutBtn: document.getElementById('btn-logout'),
  
  // Statistics Elements
  statRecordRate: document.getElementById('stat-record-rate'),
  statRecordCount: document.getElementById('stat-record-count'),
  statMainMood: document.getElementById('stat-main-mood'),
  moodRatiosList: document.getElementById('mood-ratios-list'),
  
  // Toast
  toastMessage: document.getElementById('toast-message'),
  toastText: document.getElementById('toast-text'),
  toastIcon: document.getElementById('toast-icon'),
  
  // PWA Install
  pwaInstallBanner: document.getElementById('pwa-install-banner'),
  btnPwaInstall: document.getElementById('btn-pwa-install')
};

// 3. Helper Functions
function safeCreateIcons() {
  if (typeof lucide !== 'undefined') {
    try {
      lucide.createIcons();
    } catch (e) {
      console.warn('Lucide icons creation failed:', e);
    }
  } else {
    console.warn('Lucide library not loaded yet.');
  }
}

function showToast(message, isSuccess = true) {
  elements.toastText.textContent = message;
  if (isSuccess) {
    elements.toastIcon.setAttribute('data-lucide', 'check-circle-2');
    elements.toastMessage.style.borderColor = 'var(--card-border)';
  } else {
    elements.toastIcon.setAttribute('data-lucide', 'alert-circle');
    elements.toastMessage.style.borderColor = 'var(--danger)';
  }
  safeCreateIcons();
  
  elements.toastMessage.classList.add('active');
  setTimeout(() => {
    elements.toastMessage.classList.remove('active');
  }, 2500);
}

// Format date to YYYY-MM-DD in local timezone
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Decode JWT token for Google Sign-In
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT Decoding failed:', error);
    return null;
  }
}

// 4. Data Storage & Sync (Dual Storage Engine)
function initFirebase() {
  if (FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY_HERE') {
    try {
      // If firebase is already initialized, reuse app
      let app;
      if (!firebase.apps.length) {
        app = firebase.initializeApp({
          apiKey: FIREBASE_CONFIG.apiKey,
          projectId: FIREBASE_CONFIG.projectId,
          appId: FIREBASE_CONFIG.appId
        });
      } else {
        app = firebase.app();
      }
      
      state.db = app.firestore();
      console.log('Firebase connected.');
      return true;
    } catch (error) {
      console.error('Firebase Initialization failed:', error);
    }
  }
  
  state.db = null;
  return false;
}

// Save a diary entry
async function saveDiaryEntry(dateStr, emoji, message) {
  const email = state.currentUser.email;
  const entry = {
    emoji: emoji,
    message: message,
    updatedAt: new Date().toISOString()
  };
  
  // 1. Save locally
  state.diaries[dateStr] = entry;
  localStorage.setItem(`diaries_${email}`, JSON.stringify(state.diaries));
  
  // 2. Sync to Firebase if available
  if (state.db) {
    try {
      const docId = `${email}_${dateStr}`;
      await state.db.collection('users_diaries').doc(docId).set({
        email: email,
        date: dateStr,
        emoji: emoji,
        message: message,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log('Firebase synced.');
    } catch (error) {
      console.error('Firebase sync failed:', error);
      showToast('로컬에 저장됨 (클라우드 동기화 실패)', false);
      return;
    }
  }
  
  showToast('일기가 등록되었습니다.');
}

// Delete a diary entry
async function deleteDiaryEntry(dateStr) {
  const email = state.currentUser.email;
  
  // 1. Delete locally
  delete state.diaries[dateStr];
  localStorage.setItem(`diaries_${email}`, JSON.stringify(state.diaries));
  
  // 2. Delete from Firebase if available
  if (state.db) {
    try {
      const docId = `${email}_${dateStr}`;
      await state.db.collection('users_diaries').doc(docId).delete();
      console.log('Firebase deleted.');
    } catch (error) {
      console.error('Firebase delete failed:', error);
      showToast('로컬에서 삭제됨 (클라우드 동기화 실패)', false);
      return;
    }
  }
  
  showToast('일기가 삭제되었습니다.');
}

// Load all diary entries for current user
async function loadDiaryEntries() {
  const email = state.currentUser.email;
  
  // Default load from LocalStorage first (offline-first)
  const localData = localStorage.getItem(`diaries_${email}`);
  state.diaries = localData ? JSON.parse(localData) : {};
  
  // If Firebase configured, fetch and sync
  if (state.db) {
    try {
      showToast('클라우드 데이터를 불러오는 중...');
      const snapshot = await state.db.collection('users_diaries')
        .where('email', '==', email)
        .get();
        
      const cloudDiaries = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        cloudDiaries[data.date] = {
          emoji: data.emoji,
          message: data.message,
          updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString()
        };
      });
      
      // Merge Strategy: Take newest update or simple replace local with cloud
      // For simplicity and multi-device sync, we replace local with cloud
      state.diaries = { ...state.diaries, ...cloudDiaries };
      localStorage.setItem(`diaries_${email}`, JSON.stringify(state.diaries));
      showToast('데이터 동기화 완료!');
    } catch (error) {
      console.error('Error fetching from Firebase:', error);
      showToast('클라우드 데이터를 가져오지 못했습니다. 로컬 데이터를 사용합니다.', false);
    }
  }
  
  renderCalendar();
  renderStatistics();
}

// 5. Auth Controller
function handleLoginSuccess(userPayload, skipSave = false) {
  state.currentUser = {
    name: userPayload.name,
    email: userPayload.email,
    picture: userPayload.picture
  };
  
  if (!skipSave) {
    // Save session with 2-hour expiry (7200000 ms)
    const sessionData = {
      payload: userPayload,
      expiry: Date.now() + 7200000
    };
    localStorage.setItem('diary_user_session', JSON.stringify(sessionData));
  }
  
  // Update Profile UI
  elements.userNameText.textContent = state.currentUser.name;
  elements.userPhoto.src = state.currentUser.picture;
  elements.authContainer.style.display = 'none';
  elements.profileContainer.style.display = 'flex';
  
  showToast(`${state.currentUser.name}님, 반갑습니다!`);
  
  // Check Password before loading data
  checkPasswordSetup();
}

// ================= PASSWORD LOCK LOGIC =================
async function checkPasswordSetup() {
  const email = state.currentUser.email;
  elements.lockScreenOverlay.style.display = 'flex';
  elements.inputPassword.value = '';
  elements.passwordError.textContent = '';
  state.isLocked = true;
  
  if (state.db) {
    try {
      const doc = await state.db.collection('users_settings').doc(email).get();
      if (doc.exists && doc.data().password) {
        state.hasPassword = true;
        state.savedPassword = doc.data().password;
      } else {
        state.hasPassword = false;
      }
    } catch(e) {
      console.error(e);
      state.hasPassword = false;
    }
  }
  
  // Reset password flow check
  if (sessionStorage.getItem('reset_password') === 'true') {
    sessionStorage.removeItem('reset_password');
    state.hasPassword = false;
    if (state.db) {
      await state.db.collection('users_settings').doc(email).set({ password: '' }, { merge: true });
    }
    showToast('비밀번호가 초기화되었습니다. 새 비밀번호를 설정해주세요.');
  }

  if (state.hasPassword) {
    elements.lockTitle.textContent = '다이어리 잠금';
    elements.lockSubtitle.textContent = '비밀번호를 입력해 주세요.';
    elements.btnSubmitPassword.textContent = '잠금 해제';
    elements.btnResetPassword.style.display = 'block';
  } else {
    elements.lockTitle.textContent = '비밀번호 설정';
    elements.lockSubtitle.textContent = '다이어리를 보호할 새 비밀번호를 입력해 주세요.';
    elements.btnSubmitPassword.textContent = '설정하기';
    elements.btnResetPassword.style.display = 'none';
  }
}

async function handleSubmitPassword() {
  const pwd = elements.inputPassword.value.trim();
  if (!pwd) {
    elements.passwordError.textContent = '비밀번호를 입력하세요.';
    return;
  }
  
  if (state.hasPassword) {
    // Unlock
    if (pwd === state.savedPassword) {
      elements.lockScreenOverlay.style.display = 'none';
      state.isLocked = false;
      elements.passwordError.textContent = '';
      loadDiaryEntries();
    } else {
      elements.passwordError.textContent = '비밀번호가 틀렸습니다.';
    }
  } else {
    // Setup
    if (state.db) {
      await state.db.collection('users_settings').doc(state.currentUser.email).set({ password: pwd }, { merge: true });
    }
    state.hasPassword = true;
    state.savedPassword = pwd;
    elements.lockScreenOverlay.style.display = 'none';
    state.isLocked = false;
    elements.passwordError.textContent = '';
    showToast('비밀번호가 설정되었습니다.');
    loadDiaryEntries();
  }
}

function handleResetPassword() {
  if (confirm('비밀번호를 초기화하시겠습니까? 본인 확인을 위해 구글 계정으로 다시 로그인해야 합니다.')) {
    sessionStorage.setItem('reset_password', 'true');
    elements.lockScreenOverlay.style.display = 'none';
    handleLogout();
    
    // Automatically open google login prompt again if possible
    if (typeof google !== 'undefined') {
      google.accounts.id.prompt();
    }
  }
}
// =======================================================

function handleLogout() {
  state.currentUser = {
    name: '게스트 사용자',
    email: 'guest_user',
    picture: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23a855f7%22/><text x=%2250%22 y=%2265%22 font-size=%2250%22 fill=%22%23ffffff%22 text-anchor=%22middle%22>👤</text></svg>'
  };
  
  localStorage.removeItem('diary_user_session');
  
  elements.authContainer.style.display = 'flex';
  elements.profileContainer.style.display = 'none';
  
  showToast('로그아웃 되었습니다.');
  
  // Load guest data
  loadDiaryEntries();
  
  // Re-render Google button
  renderGoogleButton();
}

// Initialize Google Identity Services Sign-In Button or render a beautiful Mock button
function renderGoogleButton() {
  // If no clientId is configured, do not load Google popups (prevents Google 404 page)
  if (!FIREBASE_CONFIG.googleClientId || FIREBASE_CONFIG.googleClientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
    renderMockGoogleButton();
    return;
  }
  
  if (typeof google === 'undefined') {
    console.warn('Google Identity Services SDK not loaded yet. Waiting...');
    setTimeout(renderGoogleButton, 100);
    return;
  }
  
  const clientID = FIREBASE_CONFIG.googleClientId;
  
  try {
    google.accounts.id.initialize({
      client_id: clientID,
      callback: (response) => {
        const payload = decodeJwt(response.credential);
        if (payload) {
          handleLoginSuccess(payload);
        } else {
          showToast('구글 로그인 실패', false);
        }
      }
    });
    
    elements.authContainer.innerHTML = '<div id="google-signin-btn"></div>';
    google.accounts.id.renderButton(
      document.getElementById('google-signin-btn'),
      { 
        theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'filled_black' : 'outline', 
        size: 'medium', 
        shape: 'pill',
        text: 'signin_with'
      }
    );
  } catch (error) {
    console.error('Google button render failed:', error);
    renderMockGoogleButton();
  }
}

// Render a Google-styled button that performs mock login for instant testing
function renderMockGoogleButton() {
  const mockAuthBtn = document.createElement('button');
  mockAuthBtn.className = 'btn-primary';
  mockAuthBtn.style.background = '#ffffff';
  mockAuthBtn.style.color = '#1f1f1f';
  mockAuthBtn.style.border = '1px solid #747775';
  mockAuthBtn.style.display = 'flex';
  mockAuthBtn.style.alignItems = 'center';
  mockAuthBtn.style.gap = '8px';
  mockAuthBtn.style.fontWeight = '500';
  mockAuthBtn.style.fontFamily = "'Outfit', sans-serif";
  mockAuthBtn.style.height = '38px';
  mockAuthBtn.style.padding = '0 14px';
  mockAuthBtn.style.borderRadius = '20px';
  mockAuthBtn.style.fontSize = '13.5px';
  mockAuthBtn.style.cursor = 'pointer';
  mockAuthBtn.style.transition = 'all 0.2s';
  mockAuthBtn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
  
  mockAuthBtn.onmouseover = () => {
    mockAuthBtn.style.background = '#f7f8f9';
    mockAuthBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
  };
  mockAuthBtn.onmouseout = () => {
    mockAuthBtn.style.background = '#ffffff';
    mockAuthBtn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
  };

  mockAuthBtn.innerHTML = `
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 48 48" style="display:block;">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
      <path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.42-4.69H24v8.89h12.66c-.55 2.89-2.2 5.34-4.66 6.99l7.26 5.63C43.51 36.56 46.5 30.82 46.5 24z"></path>
      <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"></path>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.26-5.63c-2.03 1.37-4.63 2.19-7.26 2.19-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
    </svg>
    <span>Google 계정으로 시작 (체험용)</span>
  `;
  
  mockAuthBtn.onclick = () => {
    handleLoginSuccess({
      name: '체험 사용자',
      email: 'guest_test_user@gmail.com',
      picture: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%236366f1%22/><text x=%2250%22 y=%2265%22 font-size=%2250%22 fill=%22%23ffffff%22 text-anchor=%22middle%22>💖</text></svg>'
    });
    showToast('체험용 로그인 완료! 다기기 동기화는 구름 아이콘 클릭 후 설정을 채워주세요.');
  };
  
  elements.authContainer.innerHTML = '';
  elements.authContainer.appendChild(mockAuthBtn);
}

// 6. View - Calendar Renderer
function renderCalendar() {
  const date = state.currentDate;
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Set month label
  elements.currentMonthYearLabel.textContent = `${year}년 ${month + 1}월`;
  
  elements.daysGridContainer.innerHTML = '';
  
  // First day of current month (0: Sunday, 1: Monday, ...)
  const firstDayIndex = new Date(year, month, 1).getDay();
  
  // Last date of current month
  const lastDate = new Date(year, month + 1, 0).getDate();
  
  // Last date of previous month
  const prevLastDate = new Date(year, month, 0).getDate();
  
  // Total cells in calendar grid (standard 6 weeks = 42 cells)
  const totalCells = 42;
  
  // Render previous month overlap days
  for (let i = firstDayIndex; i > 0; i--) {
    const dayNum = prevLastDate - i + 1;
    const cell = document.createElement('div');
    cell.className = 'day-cell other-month';
    cell.innerHTML = `<span class="day-number">${dayNum}</span>`;
    elements.daysGridContainer.appendChild(cell);
  }
  
  // Render current month days
  const today = new Date();
  for (let day = 1; day <= lastDate; day++) {
    const cell = document.createElement('div');
    const weekdayIdx = (firstDayIndex + day - 1) % 7;
    
    let cellClass = 'day-cell';
    if (weekdayIdx === 0) cellClass += ' sunday';
    if (weekdayIdx === 6) cellClass += ' saturday';
    
    const dateStr = formatDate(new Date(year, month, day));
    
    // Check if it's today
    if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day) {
      cellClass += ' today';
    }
    
    // Check if there is an entry
    const entry = state.diaries[dateStr];
    if (entry) {
      cellClass += ' has-entry';
    }
    
    cell.className = cellClass;
    cell.setAttribute('data-date', dateStr);
    
    let cellContent = `<span class="day-number">${day}</span>`;
    if (entry) {
      if (entry.emoji.startsWith('svg:')) {
        const id = entry.emoji.replace('svg:', '');
        const emo = ALL_CUSTOM_EMOTICONS[id];
        const customSvg = emo ? emo.svg : '❓';
        cellContent += `<span class="day-emoji" title="${emo ? emo.label : ''}">${customSvg}</span>`;
      } else {
        cellContent += `<span class="day-emoji">${entry.emoji}</span>`;
      }
    } else {
      cellContent += `<div style="flex-grow: 1;"></div>`; // spacer
    }
    
    cell.innerHTML = cellContent;
    
    // Click Event
    cell.onclick = () => openDiaryModal(dateStr);
    
    elements.daysGridContainer.appendChild(cell);
  }
  
  // Render next month overlap days
  const remainingCells = totalCells - (firstDayIndex + lastDate);
  for (let day = 1; day <= remainingCells; day++) {
    const cell = document.createElement('div');
    cell.className = 'day-cell other-month';
    cell.innerHTML = `<span class="day-number">${day}</span>`;
    elements.daysGridContainer.appendChild(cell);
  }
}

// 7. View - Statistics Renderer
function renderStatistics() {
  const currentYear = state.currentDate.getFullYear();
  const currentMonth = state.currentDate.getMonth();
  
  // Filter diaries belonging to current month
  const monthlyEntries = Object.keys(state.diaries)
    .filter(dateStr => {
      const d = new Date(dateStr);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .map(dateStr => state.diaries[dateStr]);
    
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const recordCount = monthlyEntries.length;
  
  // Calculate Completion Rate
  const recordRate = totalDaysInMonth > 0 ? Math.round((recordCount / totalDaysInMonth) * 100) : 0;
  elements.statRecordRate.textContent = `${recordRate}%`;
  elements.statRecordCount.textContent = `작성일 수 (${recordCount}/${totalDaysInMonth}일)`;
  
  // Calculate Mood Statistics
  if (recordCount === 0) {
    elements.statMainMood.textContent = '기록 없음';
    elements.moodRatiosList.innerHTML = '<p class="sync-help-text" style="text-align: center; padding: 12px 0;">이번 달에 작성된 일기가 없습니다. 날짜를 클릭해 오늘의 기분을 남겨보세요!</p>';
    return;
  }
  
  const moodCounts = {};
  monthlyEntries.forEach(entry => {
    moodCounts[entry.emoji] = (moodCounts[entry.emoji] || 0) + 1;
  });
  
  // Sort moods by frequency
  const sortedMoods = Object.keys(moodCounts)
    .map(emoji => {
      let label = '기타';
      let displayHtml = emoji;
      let isSvg = false;
      
      if (emoji.startsWith('svg:')) {
        const id = emoji.replace('svg:', '');
        const emo = ALL_CUSTOM_EMOTICONS[id];
        if (emo) {
          label = emo.label;
          displayHtml = `<span class="svg-icon">${emo.svg}</span>`;
          isSvg = true;
        }
      } else {
        const preset = DEFAULT_EMOJIS.find(e => e.char === emoji);
        if (preset) label = preset.label;
      }
      
      return {
        emoji: emoji,
        displayHtml: displayHtml,
        label: label,
        count: moodCounts[emoji],
        percentage: Math.round((moodCounts[emoji] / recordCount) * 100),
        isSvg: isSvg
      };
    })
    .sort((a, b) => b.count - a.count);
    
  // Primary (Predominant) Mood
  const topMood = sortedMoods[0];
  elements.statMainMood.innerHTML = `${topMood.displayHtml} <span>${topMood.label}</span>`;
  
  // Render progress bars
  elements.moodRatiosList.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'mood-bar-wrapper';
  
  sortedMoods.forEach(mood => {
    const row = document.createElement('div');
    row.className = 'mood-bar-row';
    
    // Choose custom color depending on emoji type (defaults to accent color)
    let fillBg = 'var(--accent)';
    
    if (mood.isSvg) {
      if (mood.emoji.startsWith('svg:pos_')) fillBg = 'var(--color-happy)';
      else fillBg = 'var(--color-sad)';
    } else {
      const preset = DEFAULT_EMOJIS.find(e => e.char === mood.emoji);
      if (preset) {
        if (preset.label === '기쁨') fillBg = 'var(--color-happy)';
        else if (preset.label === '신남') fillBg = 'var(--color-excited)';
        else if (preset.label === '평온') fillBg = 'var(--color-calm)';
        else if (preset.label === '슬픔') fillBg = 'var(--color-sad)';
        else if (preset.label === '화남') fillBg = 'var(--color-angry)';
        else if (preset.label === '피곤') fillBg = 'var(--color-tired)';
        else if (preset.label.includes('하트')) fillBg = '#ec4899'; // Pink for hearts
        else if (preset.label === '별' || preset.label === '반짝임') fillBg = '#f59e0b'; // Gold
      }
    }
    
    row.innerHTML = `
      <span class="mood-bar-label">${mood.displayHtml} <span style="font-size:0.75rem; color:var(--text-muted);">${mood.count}회</span></span>
      <div class="mood-bar-track">
        <div class="mood-bar-fill" style="width: ${mood.percentage}%; background: ${fillBg};"></div>
      </div>
      <span class="mood-bar-pct">${mood.percentage}%</span>
    `;
    wrapper.appendChild(row);
  });
  
  elements.moodRatiosList.appendChild(wrapper);
}

// 8. Diary Modal Actions
function openDiaryModal(dateStr) {
  state.activeModalDate = dateStr;
  state.selectedEmoji = '';
  
  const [y, m, d] = dateStr.split('-');
  elements.diaryModalDateLabel.textContent = `${parseInt(m)}월 ${parseInt(d)}일의 기록`;
  
  // Populate form with existing data
  const entry = state.diaries[dateStr];
  if (entry) {
    state.selectedEmoji = entry.emoji;
    elements.textareaDiaryMessage.value = entry.message || '';
    elements.charCounterLabel.textContent = `${elements.textareaDiaryMessage.value.length}/100`;
    elements.btnDeleteDiary.style.display = 'block';
  } else {
    elements.textareaDiaryMessage.value = '';
    elements.charCounterLabel.textContent = '0/100';
    elements.btnDeleteDiary.style.display = 'none';
  }
  
  renderEmojiPicker();
  
  // Show Modal
  elements.diaryModal.classList.add('active');
}

function closeDiaryModal() {
  elements.diaryModal.classList.remove('active');
}

function renderEmojiPicker() {
  elements.emojiPickerGrid.innerHTML = '';
  
  if (state.activeEmojiTab === 'basic') {
    // Built-in preset emojis
    const builtInEmojis = DEFAULT_EMOJIS.map(e => e.char);
    
    // Merge built-in presets with user's custom emojis
    const allEmojis = [...new Set([...builtInEmojis, ...state.customEmojis])];
    
    allEmojis.forEach(emoji => {
      const item = document.createElement('div');
      item.className = `emoji-item ${state.selectedEmoji === emoji ? 'selected' : ''}`;
      item.textContent = emoji;
      
      item.onclick = () => {
        // Toggle selection
        const previousSelected = elements.emojiPickerGrid.querySelector('.emoji-item.selected');
        if (previousSelected) previousSelected.classList.remove('selected');
        
        state.selectedEmoji = emoji;
        item.classList.add('selected');
      };
      
      elements.emojiPickerGrid.appendChild(item);
    });
  } else if (state.activeEmojiTab === 'positive') {
    renderCustomEmoticonsTab(POSITIVE_EMOTICONS);
  } else if (state.activeEmojiTab === 'negative') {
    renderCustomEmoticonsTab(NEGATIVE_EMOTICONS);
  }
}

function renderCustomEmoticonsTab(emoticons) {
  emoticons.forEach(emo => {
    const item = document.createElement('div');
    const isSelected = state.selectedEmoji === `svg:${emo.id}`;
    item.className = `emoji-item ${isSelected ? 'selected' : ''}`;
    item.innerHTML = emo.svg;
    item.title = emo.label;
    
    item.onclick = () => {
      const previousSelected = elements.emojiPickerGrid.querySelector('.emoji-item.selected');
      if (previousSelected) previousSelected.classList.remove('selected');
      
      state.selectedEmoji = `svg:${emo.id}`;
      item.classList.add('selected');
    };
    
    elements.emojiPickerGrid.appendChild(item);
  });
}

function handleAddCustomEmoji() {
  const emojiInput = elements.inputCustomEmoji.value.trim();
  
  // Validate emoji input (check if it is a single emoji character)
  if (!emojiInput) {
    showToast('이모지를 입력해 주세요.', false);
    return;
  }
  
  // Simple check for string length. Emojis can have lengths > 1 (due to surrogate pairs, zero width joiners, etc.),
  // but let's limit to 4 characters to allow complex compound emojis but block normal words.
  if (emojiInput.length > 6) {
    showToast('올바른 이모지 1개를 입력해 주세요.', false);
    return;
  }
  
  if (state.customEmojis.includes(emojiInput) || DEFAULT_EMOJIS.some(e => e.char === emojiInput)) {
    showToast('이미 목록에 존재하는 이모지입니다.', false);
    elements.inputCustomEmoji.value = '';
    return;
  }
  
  state.customEmojis.push(emojiInput);
  localStorage.setItem('custom_emojis', JSON.stringify(state.customEmojis));
  
  // Re-render picker
  renderEmojiPicker();
  elements.inputCustomEmoji.value = '';
  showToast('이모지가 추가되었습니다!');
}

async function handleSaveDiary() {
  if (!state.selectedEmoji) {
    showToast('이모지를 선택해 주세요.', false);
    return;
  }
  
  const message = elements.textareaDiaryMessage.value.trim();
  await saveDiaryEntry(state.activeModalDate, state.selectedEmoji, message);
  
  closeDiaryModal();
  renderCalendar();
  renderStatistics();
}

async function handleDeleteDiary() {
  if (confirm('이 기록을 삭제하시겠습니까?')) {
    await deleteDiaryEntry(state.activeModalDate);
    closeDiaryModal();
    renderCalendar();
    renderStatistics();
  }
}

// 10. Theme Control
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeUI(savedTheme);
}

function updateThemeUI(theme) {
  const metaThemeColor = document.getElementById('theme-color-meta');
  if (theme === 'dark') {
    elements.themeIcon.setAttribute('data-lucide', 'moon');
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#09090b');
  } else {
    elements.themeIcon.setAttribute('data-lucide', 'sun');
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#ffffff');
  }
  safeCreateIcons();
  
  // Redraw google button theme
  renderGoogleButton();
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeUI(newTheme);
}

// 11. PWA Service Worker Registration & Installation prompt
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('ServiceWorker registered successfully with scope: ', reg.scope);
        })
        .catch((err) => {
          console.warn('ServiceWorker registration failed: ', err);
        });
    });
  }
  
  // Capture installation promotion prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default browser banner
    e.preventDefault();
    // Cache event
    state.deferredInstallPrompt = e;
    // Show custom banner
    elements.pwaInstallBanner.style.display = 'flex';
  });
  
  elements.btnPwaInstall.addEventListener('click', async () => {
    if (state.deferredInstallPrompt) {
      // Show prompt
      state.deferredInstallPrompt.prompt();
      // Wait response
      const { outcome } = await state.deferredInstallPrompt.userChoice;
      console.log(`User response to installation: ${outcome}`);
      // Reset
      state.deferredInstallPrompt = null;
      elements.pwaInstallBanner.style.display = 'none';
    }
  });
  
  window.addEventListener('appinstalled', (evt) => {
    console.log('App was successfully installed to home screen!');
    elements.pwaInstallBanner.style.display = 'none';
    showToast('다이어리 앱이 성공적으로 설치되었습니다!');
  });
}

// 12. App Event Listeners & Bootstrapping
function bindEventListeners() {
  // Theme Toggle
  elements.themeToggleBtn.addEventListener('click', toggleTheme);
  
  // Emoji Tabs
  elements.emojiTabs = document.querySelectorAll('.emoji-tab-btn');
  if (elements.emojiTabs) {
    elements.emojiTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        elements.emojiTabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        state.activeEmojiTab = e.target.getAttribute('data-tab');
        renderEmojiPicker();
      });
    });
  }
  
  // Calendar Nav
  elements.prevMonthBtn.addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() - 1);
    renderCalendar();
    renderStatistics();
  });
  elements.nextMonthBtn.addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() + 1);
    renderCalendar();
    renderStatistics();
  });
  elements.todayMonthBtn.addEventListener('click', () => {
    state.currentDate = new Date();
    renderCalendar();
    renderStatistics();
  });
  
  // Diary Modal Form Actions
  elements.closeDiaryModalBtn.addEventListener('click', closeDiaryModal);
  elements.cancelDiaryBtn.addEventListener('click', closeDiaryModal);
  elements.btnSaveDiary.addEventListener('click', handleSaveDiary);
  elements.btnDeleteDiary.addEventListener('click', handleDeleteDiary);
  elements.btnAddCustomEmoji.addEventListener('click', handleAddCustomEmoji);
  
  // Char Counter on message textarea
  elements.textareaDiaryMessage.addEventListener('input', () => {
    const len = elements.textareaDiaryMessage.value.length;
    elements.charCounterLabel.textContent = `${len}/100`;
  });
  
  // Custom Emoji Adder Enter Key
  elements.inputCustomEmoji.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleAddCustomEmoji();
    }
  });
  
  // Auth Logout
  elements.btnLogoutBtn.addEventListener('click', handleLogout);

  // Lock Screen Actions
  elements.btnSubmitPassword.addEventListener('click', handleSubmitPassword);
  elements.btnResetPassword.addEventListener('click', handleResetPassword);
  elements.inputPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSubmitPassword();
  });
}

// App Bootstrapping
async function bootstrapApp() {
  // 1. Init Theme
  initTheme();
  
  // 2. Load configurations
  const savedCustomEmojis = localStorage.getItem('custom_emojis');
  state.customEmojis = savedCustomEmojis ? JSON.parse(savedCustomEmojis) : [];
  
  // 3. Initialize Firebase Database Sync (if credentials stored)
  initFirebase();
  
  // 4. Check existing session or setup Auth UI
  const savedSessionStr = localStorage.getItem('diary_user_session');
  if (savedSessionStr) {
    try {
      const sessionData = JSON.parse(savedSessionStr);
      if (sessionData.expiry > Date.now()) {
        console.log('Restoring 2-hour session');
        handleLoginSuccess(sessionData.payload, true);
      } else {
        localStorage.removeItem('diary_user_session');
        renderGoogleButton();
      }
    } catch(e) {
      renderGoogleButton();
    }
  } else {
    renderGoogleButton();
  }
  
  // 5. App remains locked until handleLoginSuccess -> checkPasswordSetup
  // Guests will see empty data via loadDiaryEntries inside handleLogout 
  // if they don't sign in. Wait, guest user should also bypass lock or have a default.
  // Actually, guest user has no email, so checkPasswordSetup will use 'guest_user'.
  // Let's just run loadDiaryEntries if they are guest.
  if (state.currentUser.email === 'guest_user') {
    await loadDiaryEntries();
  }
  
  // 6. Bind UI event listeners
  bindEventListeners();
  
  // 7. Register PWA Service worker
  registerServiceWorker();
  
  // 8. Render lucide icons
  safeCreateIcons();
  
  console.log('Mood Diary app initialized successfully.');
}

// Start Application immediately if DOM is ready, or wait for load
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  bootstrapApp();
} else {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
}
