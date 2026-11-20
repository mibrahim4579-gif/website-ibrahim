/**
 * COMECIL — Contact Form Controller
 * Validation, character counter, and API submission.
 */
document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  var cName = document.getElementById('c-name');
  var cEmail = document.getElementById('c-email');
  var cSubj = document.getElementById('c-subject');
  var cMsg = document.getElementById('c-message');
  var cCounter = document.getElementById('contactMsgCounter');
  var cBtn = document.getElementById('contactSubmitBtn');
  var cSpinner = document.getElementById('contactSpinner');
  var cBtnText = document.getElementById('contactBtnText');

  function showErr(fieldEl, msg) {
    if (!fieldEl) return;
    fieldEl.classList.add('error');
    var s = fieldEl.querySelector('.field-error');
    if (s && msg) s.textContent = msg;
  }

  function clearErr(fieldEl) {
    if (!fieldEl) return;
    fieldEl.classList.remove('error');
  }

  if (cMsg && cCounter) {
    cMsg.addEventListener('input', function() {
      var len = cMsg.value.length;
      cCounter.textContent = len + ' / 500 characters (min 10)';
      if (len >= 10 && len <= 500) clearErr(cMsg.closest('.field'));
    });
  }

  [cName, cEmail, cSubj].forEach(function(inp) {
    if (inp) {
      inp.addEventListener('input', function() {
        clearErr(inp.closest('.field'));
      });
    }
  });

  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();

    var valid = true;

    if (!cName.value.trim() || cName.value.trim().length < 2) {
      showErr(cName.closest('.field'), 'Please enter your name (at least 2 characters).');
      valid = false;
    } else clearErr(cName.closest('.field'));

    if (!EMAIL_REGEX.test(cEmail.value.trim())) {
      showErr(cEmail.closest('.field'), 'Please enter a valid email address.');
      valid = false;
    } else clearErr(cEmail.closest('.field'));

    if (!cSubj.value.trim() || cSubj.value.trim().length < 3) {
      showErr(cSubj.closest('.field'), 'Please enter a subject (at least 3 characters).');
      valid = false;
    } else clearErr(cSubj.closest('.field'));

    var msgVal = cMsg.value.trim();
    if (!msgVal || msgVal.length < 10 || msgVal.length > 500) {
      showErr(cMsg.closest('.field'), 'Message must be between 10 and 500 characters.');
      valid = false;
    } else clearErr(cMsg.closest('.field'));

    if (!valid) {
      if (window.Toast) window.Toast.error('Please correct the highlighted form errors.');
      return;
    }

    cBtn.disabled = true;
    if (cSpinner) cSpinner.classList.add('show');
    if (cBtnText) cBtnText.textContent = 'Sending Message...';

    var fd = new FormData();
    fd.append('name', cName.value.trim());
    fd.append('email', cEmail.value.trim());
    fd.append('subject', cSubj.value.trim());
    fd.append('message', msgVal);

    fetch('api/contact.php', {
      method: 'POST',
      body: fd
    })
      .then(function(r) {
        return r.json().then(function(j) {
          return { ok: r.ok, data: j };
        }).catch(function() {
          return { ok: r.ok, data: null };
        });
      })
      .then(function(result) {
        cBtn.disabled = false;
        if (cSpinner) cSpinner.classList.remove('show');
        if (cBtnText) cBtnText.textContent = 'Send Message';

        if (result.ok && result.data && result.data.success) {
          contactForm.reset();
          if (cCounter) cCounter.textContent = '0 / 500 characters (min 10)';
          if (window.Toast) {
            window.Toast.success(result.data.message || 'Message sent! We will respond within 24 hours.', 4500);
          }
        } else {
          var msg = (result.data && (result.data.message || result.data.error)) || 'Failed to send message. Please try again.';
          if (window.Toast) window.Toast.error(msg);
        }
      })
      .catch(function() {
        cBtn.disabled = false;
        if (cSpinner) cSpinner.classList.remove('show');
        if (cBtnText) cBtnText.textContent = 'Send Message';
        var errMsg = window.location.protocol === 'file:'
          ? 'Backend not connected: Please launch start-server.bat and visit http://localhost:8000'
          : 'Network error. Please try again.';
        if (window.Toast) window.Toast.error(errMsg, 6000);
      });
  });
});
