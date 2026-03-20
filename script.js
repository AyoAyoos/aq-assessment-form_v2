

const SUPABASE_URL  = 'https://fakwubkkjwzagudagvot.supabase.co'; // 👈 paste yours
const SUPABASE_KEY  = 'sb_publishable_e9f_u0ewwy1WR3ZYJiW8Ow_271yFuVK';                // 👈 paste yours
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


/* ══════════════════════════════════════════════════
   AQ Assessment — script.js
   Multi-step form logic, validation & submission
══════════════════════════════════════════════════ */

const TOTAL_STEPS = 7;
let currentStep = 1;

/* ── Questions per step ───────────────────────────── */
const stepQuestions = {
  1: [], // text fields validated separately
  2: ['q1','q2','q3','q4','q5'],
  3: ['q6','q7','q8','q9','q10','q11'],
  4: ['q12','q13','q14','q15','q16'],
  5: ['q17','q18','q19','q20','q21'],
  6: ['q22','q23'],
  7: [], // job pref validated separately
};

/* ── Init ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  bindRadioCards();
  bindJobChips();
});

/* ── Bind radio answers → card state ─────────────── */
function bindRadioCards() {
  document.querySelectorAll('.question-card').forEach(card => {
    const name = card.dataset.q;
    card.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
      radio.addEventListener('change', () => {
        card.classList.add('answered');
        card.classList.remove('error-state');
        clearError(name);
      });
    });
  });
}

/* ── Job chip logic (max 3) ───────────────────────── */
function bindJobChips() {
  const checkboxes = document.querySelectorAll('input[name="jobPref"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', handleJobChange);
  });
}

function handleJobChange() {
  const checkboxes = document.querySelectorAll('input[name="jobPref"]');
  const checked    = [...checkboxes].filter(c => c.checked);

  // Update dots
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById(`jd${i}`);
    if (dot) dot.classList.toggle('filled', i <= checked.length);
  }

  // Update count text
  const txt = document.getElementById('jobCountText');
  if (txt) txt.textContent = `${checked.length} of 3 selected`;

  // If trying to check a 4th, uncheck it and shake
  if (checked.length > 3) {
    this.checked = false;
    const pool = document.getElementById('jobPool');
    if (pool) {
      pool.classList.remove('shake');
      void pool.offsetWidth; // reflow to restart animation
      pool.classList.add('shake');
    }
    const errEl = document.getElementById('err-jobPref');
    if (errEl) {
      errEl.textContent = 'You can only select up to 3 job roles.';
      setTimeout(() => { errEl.textContent = ''; }, 2500);
    }
    return;
  }

  // Dim unchosen chips when 3 are selected
  const allChips = document.querySelectorAll('.job-chip');
  const nowChecked = [...checkboxes].filter(c => c.checked);
  allChips.forEach(chip => {
    const input = chip.querySelector('input');
    if (nowChecked.length >= 3 && !input.checked) {
      chip.classList.add('max-reached');
    } else {
      chip.classList.remove('max-reached');
    }
  });

  clearError('jobPref');
}

/* ── Navigation ───────────────────────────────────── */
function goNext() {
  if (!validateStep(currentStep)) return;

  if (currentStep === TOTAL_STEPS) {
    submitForm();
    return;
  }

  markDone(currentStep);
  currentStep++;
  showStep(currentStep);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
  if (currentStep <= 1) return;
  currentStep--;
  showStep(currentStep);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showStep(step) {
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.getElementById(`step-${step}`).classList.add('active');
  updateUI();
}

/* ── UI State ─────────────────────────────────────── */
function updateUI() {
  // Progress bar
  const pct = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;
  document.getElementById('progressFill').style.width = `${pct}%`;

  // Step chips
  document.querySelectorAll('.step-chip').forEach(chip => {
    const s = parseInt(chip.dataset.step);
    chip.classList.remove('active', 'done');
    if (s === currentStep) chip.classList.add('active');
  });

  // Scroll active chip into view
  const activeChip = document.querySelector(`.step-chip[data-step="${currentStep}"]`);
  if (activeChip) activeChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

  // Back button
  const btnBack = document.getElementById('btnBack');
  btnBack.style.display = currentStep > 1 ? 'inline-flex' : 'none';

  // Next/Submit button
  const btnNext = document.getElementById('btnNext');
  if (currentStep === TOTAL_STEPS) {
    btnNext.innerHTML = '<span class="material-icons-round">send</span> Submit';
  } else {
    btnNext.innerHTML = 'Next <span class="material-icons-round">arrow_forward</span>';
  }

  // Step counter
  document.getElementById('stepCounter').textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;
}

function markDone(step) {
  const chip = document.querySelector(`.step-chip[data-step="${step}"]`);
  if (chip) chip.classList.add('done');
}

/* ── Validation ───────────────────────────────────── */
function validateStep(step) {
  let valid = true;

  if (step === 1) {
    valid = validateTextField('fullName',       v => v.trim().length >= 2,
                              'Please enter your full name.')
         && validateTextField('email',          v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
                              'Please enter a valid email address.')
         && validateTextField('universityName', v => v.trim().length >= 2,
                              'Please enter your university name.')
         && validateTextField('universityId',   v => v.trim().length >= 2,
                              'Please enter your enrollment / university ID.');
  }

  else if ([2, 3, 4, 5].includes(step)) {
    const qNames = stepQuestions[step];
    qNames.forEach(name => {
      const answered = document.querySelector(`input[name="${name}"]:checked`);
      if (!answered) {
        showError(name, 'Please select an option.');
        const card = document.querySelector(`.question-card[data-q="${name}"]`);
        if (card) card.classList.add('error-state');
        valid = false;
      }
    });
    if (!valid) scrollToFirstError();
  }

  else if (step === 6) {
    const qNames = stepQuestions[6];
    qNames.forEach(name => {
      const answered = document.querySelector(`input[name="${name}"]:checked`);
      if (!answered) {
        showError(name, 'Please select an option.');
        const card = document.querySelector(`.question-card[data-q="${name}"]`);
        if (card) card.classList.add('error-state');
        valid = false;
      }
    });

    const dsa = document.getElementById('dsaMarks').value.trim();
    if (!dsa) {
      showError('dsaMarks', 'Please enter your DSA / technical subject marks.');
      valid = false;
    } else if (!/^\d+\/\d+$/.test(dsa)) {
      showError('dsaMarks', 'Please use the format: marks/total  e.g. 75/100');
      valid = false;
    } else {
      const [got, total] = dsa.split('/').map(Number);
      if (got > total) {
        showError('dsaMarks', 'Marks obtained cannot exceed total marks.');
        valid = false;
      }
    }
    if (!valid) scrollToFirstError();
  }

  else if (step === 7) {
    const checked = document.querySelectorAll('input[name="jobPref"]:checked');
    if (checked.length === 0) {
      showError('jobPref', 'Please select at least 1 job preference.');
      valid = false;
    }
    const feedback = document.querySelector('input[name="feedback"]:checked');
    if (!feedback) {
      showError('feedback', 'Please share your opinion.');
      valid = false;
    }
  }

  return valid;
}

function validateTextField(id, rule, msg) {
  const el = document.getElementById(id);
  if (!el) return true;
  if (!rule(el.value)) {
    showError(id, msg);
    el.style.borderColor = 'var(--md-error)';
    el.addEventListener('input', () => {
      el.style.borderColor = '';
      clearError(id);
    }, { once: true });
    return false;
  }
  return true;
}

function showError(id, msg) {
  const el = document.getElementById(`err-${id}`);
  if (el) el.textContent = msg;
}
function clearError(id) {
  const el = document.getElementById(`err-${id}`);
  if (el) el.textContent = '';
}

function scrollToFirstError() {
  const el = document.querySelector('.error-state, .field-error:not(:empty)');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ── Collect Form Data ────────────────────────────── */
function collectData() {
  const data = {
    personalInfo: {
      fullName:       document.getElementById('fullName').value.trim(),
      email:          document.getElementById('email').value.trim(),
      universityName: document.getElementById('universityName').value.trim(),
      universityId:   document.getElementById('universityId').value.trim(),
    },
    responses: {},
    dsaMarks:   document.getElementById('dsaMarks').value.trim(),
    jobPreferences: [...document.querySelectorAll('input[name="jobPref"]:checked')].map(c => c.value),
    feedback: document.querySelector('input[name="feedback"]:checked')?.value || null,
    submittedAt: new Date().toISOString(),
  };

  // Collect all MCQ answers
  for (let q = 1; q <= 23; q++) {
    const checked = document.querySelector(`input[name="q${q}"]:checked`);
    data.responses[`q${q}`] = checked ? parseInt(checked.value) : null;
  }

  // Compute AQ score (sum of q1–q23)
  const scores = Object.values(data.responses).filter(v => v !== null);
  data.aqScore = scores.reduce((a, b) => a + b, 0);
  data.aqMax   = 23 * 5; // 115
  data.aqPercentage = Math.round((data.aqScore / data.aqMax) * 100);
  data.aqCategory   = getAQCategory(data.aqScore);

  return data;
}

function getAQCategory(score) {
    if (score >= 180) return { label: 'Climber',          emoji: '🏔️' };
    if (score >= 160) return { label: 'Moderate Climber', emoji: '📈' };
    if (score >= 140) return { label: 'Camper',           emoji: '⛺' };
    if (score >= 120) return { label: 'Moderate Camper',  emoji: '🏕️' };
    return                   { label: 'Quitter',          emoji: '⚠️' };
  }

/* ── Submit ───────────────────────────────────────── */
async function submitForm() {
  const btnNext = document.getElementById('btnNext');
  btnNext.disabled = true;
  btnNext.innerHTML = '<span class="material-icons-round" style="animation:spin 1s linear infinite">sync</span> Submitting...';

  // Inject keyframe for spinner once
  if (!document.getElementById('spin-kf')) {
    const s = document.createElement('style');
    s.id = 'spin-kf';
    s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(s);
  }

  try {
    const formData = collectData();

    const { error } = await db.from('responses').insert({
      full_name:     formData.personalInfo.fullName,
      email:         formData.personalInfo.email,
      university:    formData.personalInfo.universityName,
      university_id: formData.personalInfo.universityId,
      answers:       formData.responses,
      dsa_marks:     formData.dsaMarks,
      job_prefs:     formData.jobPreferences,
      aq_score:      formData.aqScore,
      aq_category:   formData.aqCategory.label,
      feedback:      formData.feedback,
    });

    if (error) {
      if (error.code === '23505') {
        alert('This email has already submitted a response.');
      } else {
        throw error;
      }
      return;
    }

    showSuccess(formData);
  } catch (err) {
    alert('Something went wrong. Please try again.\n\n' + err.message);
  } finally {
    btnNext.disabled = false;
    btnNext.innerHTML = '<span class="material-icons-round">send</span> Submit';
  }
}

function showSuccess(data) {
  const overlay = document.getElementById('successOverlay');
  const meta    = document.getElementById('successMeta');

  const { label, emoji } = data.aqCategory;

  meta.innerHTML = `
    <strong>Name:</strong> ${escHtml(data.personalInfo.fullName)}<br>
    <strong>University:</strong> ${escHtml(data.personalInfo.universityName)}<br>
    <strong>AQ Score:</strong> ${data.aqScore} / ${data.aqMax} &nbsp;(${data.aqPercentage}%)<br>
    <strong>Category:</strong> ${emoji} ${label}<br>
    <strong>Job Preferences:</strong> ${data.jobPreferences.join(', ') || '—'}
  `;

  overlay.classList.add('visible');
}

function escHtml(str) {
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function handleConsentCheck(checkbox) {
    document.getElementById('consentBtn').classList.toggle('active', checkbox.checked);
    if (checkbox.checked) document.getElementById('err-consent').textContent = '';
  }
  
  function acceptConsent() {
    const checkbox = document.getElementById('consentCheckbox');
    const errEl    = document.getElementById('err-consent');
    const agreeBox = document.getElementById('consentAgreeBox');
  
    if (!checkbox.checked) {
      errEl.textContent = 'Please check the box to confirm your consent.';
      agreeBox.classList.remove('shake');
      void agreeBox.offsetWidth;
      agreeBox.classList.add('shake');
      return;
    }
  
    const screen = document.getElementById('consentScreen');
    screen.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    screen.style.opacity    = '0';
    screen.style.transform  = 'translateY(-12px)';
  
    setTimeout(() => {
      screen.style.display = 'none';
      document.getElementById('progressRail').style.display  = 'block';
      document.getElementById('stepNav').style.display       = 'flex';
      document.getElementById('mainContainer').style.display = 'block';
      document.getElementById('navBar').style.display        = 'flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  }