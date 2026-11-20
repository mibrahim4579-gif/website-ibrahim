/**
 * COMECIL — Order Form Controller
 * Auto-population, validation, file attachments, and API submission.
 */
document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_REGEX = /^[0-9+\-\s()]{7,25}$/;
  var ALLOWED_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
  var MAX_SIZE = 10 * 1024 * 1024; // 10 MB

  var servicesData = (window.COMECIL_DATA && window.COMECIL_DATA.services) || {};

  var orderForm = document.getElementById('orderForm');
  if (!orderForm) return;

  var nameInp = document.getElementById('ord-name');
  var emailInp = document.getElementById('ord-email');
  var phoneInp = document.getElementById('ord-phone');
  var catSel = document.getElementById('ord-category');
  var srvSel = document.getElementById('ord-service');
  var titleInp = document.getElementById('ord-title');
  var descInp = document.getElementById('ord-desc');
  var descCtr = document.getElementById('orderDescCounter');
  var deadlineInp = document.getElementById('ord-deadline');
  var budgetSel = document.getElementById('ord-budget');
  var fileDrop = document.getElementById('fileDrop');
  var fileInput = document.getElementById('fileInput');
  var fileList = document.getElementById('fileList');
  var submitBtn = document.getElementById('orderSubmitBtn');
  var spinner = document.getElementById('orderSpinner');
  var btnText = document.getElementById('orderBtnText');
  var successBox = document.getElementById('orderSuccess');
  var errorBox = document.getElementById('orderError');

  var uploadedFiles = [];

  function fmtBytes(b) {
    if (!b) return '0 B';
    var k = 1024;
    var s = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
  }

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

  function populateServiceOptions(catVal, selectedSrv) {
    if (!srvSel) return;
    var list = servicesData[catVal];
    if (!list) {
      srvSel.innerHTML = '<option value="">Choose engineering field first</option>';
      return;
    }
    srvSel.innerHTML = '<option value="">Choose a specific service</option>' + list.map(function(s) {
      return '<option value="' + s + '"' + (s === selectedSrv ? ' selected' : '') + '>' + s + '</option>';
    }).join('');
  }

  if (catSel) {
    catSel.addEventListener('change', function() {
      populateServiceOptions(catSel.value);
      clearErr(catSel.closest('.field'));
    });
  }

  // Pre-fill from URL parameters (e.g. order.html?category=Computer+Science&service=Website+Development)
  var params = new URLSearchParams(window.location.search);
  var requestedCat = params.get('category') || '';
  var requestedSrv = params.get('service') || '';

  if (requestedCat && catSel) {
    var matchOpt = Array.from(catSel.options).find(function(opt) {
      return opt.value.toLowerCase() === requestedCat.toLowerCase();
    });
    if (matchOpt) {
      catSel.value = matchOpt.value;
      populateServiceOptions(matchOpt.value, requestedSrv);
    }
  }

  // Character counter for description
  if (descInp && descCtr) {
    descInp.addEventListener('input', function() {
      var len = descInp.value.length;
      descCtr.textContent = len + ' / 1000 characters (min 20)';
      if (len >= 20) clearErr(descInp.closest('.field'));
    });
  }

  // Set minimum deadline date to today
  if (deadlineInp) {
    var todayStr = new Date().toISOString().split('T')[0];
    deadlineInp.min = todayStr;
    deadlineInp.addEventListener('change', function() {
      if (deadlineInp.value >= todayStr) clearErr(deadlineInp.closest('.field'));
    });
  }

  // Drag and Drop files
  if (fileDrop && fileInput) {
    fileDrop.addEventListener('click', function() { fileInput.click(); });

    ['dragenter', 'dragover'].forEach(function(ev) {
      fileDrop.addEventListener(ev, function(e) {
        e.preventDefault();
        fileDrop.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(function(ev) {
      fileDrop.addEventListener(ev, function(e) {
        e.preventDefault();
        fileDrop.classList.remove('dragover');
      });
    });

    fileDrop.addEventListener('drop', function(e) {
      handleFiles(e.dataTransfer && e.dataTransfer.files);
    });

    fileInput.addEventListener('change', function() {
      handleFiles(fileInput.files);
      fileInput.value = '';
    });
  }

  function handleFiles(files) {
    if (!files) return;
    Array.from(files).forEach(function(f) {
      var ext = f.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXT.includes(ext)) {
        if (window.Toast) window.Toast.warning('"' + f.name + '" has an unsupported format.');
        return;
      }
      if (f.size > MAX_SIZE) {
        if (window.Toast) window.Toast.error('"' + f.name + '" exceeds 10 MB limit.');
        return;
      }
      if (!uploadedFiles.some(function(x) { return x.name === f.name && x.size === f.size; })) {
        uploadedFiles.push(f);
        if (window.Toast) window.Toast.success('Attached: ' + f.name, 2000);
      }
    });
    renderFileList();
  }

  function renderFileList() {
    if (!fileList) return;
    fileList.innerHTML = uploadedFiles.map(function(f, i) {
      return (
        '<div class="file-item">' +
          '<div class="file-item-info">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
            '<span class="file-name">' + f.name + '</span>' +
            '<span class="file-size">(' + fmtBytes(f.size) + ')</span>' +
          '</div>' +
          '<button type="button" class="file-remove-btn" data-i="' + i + '" title="Remove file">&times;</button>' +
        '</div>'
      );
    }).join('');

    fileList.querySelectorAll('.file-remove-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.getAttribute('data-i'), 10);
        var rm = uploadedFiles.splice(idx, 1)[0];
        renderFileList();
        if (rm && window.Toast) window.Toast.info('Removed ' + rm.name, 1500);
      });
    });
  }

  // Real-time error clearance on typing
  [nameInp, emailInp, phoneInp, titleInp].forEach(function(inp) {
    if (inp) {
      inp.addEventListener('input', function() {
        clearErr(inp.closest('.field'));
      });
    }
  });

  // Submit Handler
  orderForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (successBox) successBox.classList.remove('show');
    if (errorBox) errorBox.classList.remove('show');

    var valid = true;

    if (!nameInp.value.trim() || nameInp.value.trim().length < 2) {
      showErr(nameInp.closest('.field'), 'Full name required (at least 2 characters).');
      valid = false;
    } else clearErr(nameInp.closest('.field'));

    if (!EMAIL_REGEX.test(emailInp.value.trim())) {
      showErr(emailInp.closest('.field'), 'Valid email address required.');
      valid = false;
    } else clearErr(emailInp.closest('.field'));

    if (!PHONE_REGEX.test(phoneInp.value.trim())) {
      showErr(phoneInp.closest('.field'), 'Valid phone number required.');
      valid = false;
    } else clearErr(phoneInp.closest('.field'));

    if (!catSel.value) {
      showErr(catSel.closest('.field'), 'Please select an engineering field.');
      valid = false;
    } else clearErr(catSel.closest('.field'));

    if (!srvSel.value) {
      showErr(srvSel.closest('.field'), 'Please select a specific service.');
      valid = false;
    } else clearErr(srvSel.closest('.field'));

    if (!titleInp.value.trim() || titleInp.value.trim().length < 3) {
      showErr(titleInp.closest('.field'), 'Project title required (at least 3 characters).');
      valid = false;
    } else clearErr(titleInp.closest('.field'));

    if (!descInp.value.trim() || descInp.value.trim().length < 20) {
      showErr(descInp.closest('.field'), 'Project description required (at least 20 characters).');
      valid = false;
    } else clearErr(descInp.closest('.field'));

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var dv = deadlineInp.value ? new Date(deadlineInp.value) : null;
    if (!dv || dv < today) {
      showErr(deadlineInp.closest('.field'), 'Please choose a future deadline date.');
      valid = false;
    } else clearErr(deadlineInp.closest('.field'));

    if (!valid) {
      if (errorBox) errorBox.classList.add('show');
      if (window.Toast) window.Toast.error('Please fix the highlighted fields before submitting.');
      return;
    }

    // Prepare FormData
    submitBtn.disabled = true;
    if (spinner) spinner.classList.add('show');
    if (btnText) btnText.textContent = 'Submitting Your Order...';

    var fd = new FormData();
    fd.append('name', nameInp.value.trim());
    fd.append('email', emailInp.value.trim());
    fd.append('phone', phoneInp.value.trim());
    fd.append('category', catSel.value);
    fd.append('service', srvSel.value);
    fd.append('title', titleInp.value.trim());
    fd.append('description', descInp.value.trim());
    fd.append('deadline', deadlineInp.value);
    fd.append('budget', budgetSel ? budgetSel.value : 'Standard');

    uploadedFiles.forEach(function(f) {
      fd.append('files[]', f);
    });

    fetch('api/orders.php', {
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
        submitBtn.disabled = false;
        if (spinner) spinner.classList.remove('show');
        if (btnText) btnText.textContent = 'Submit Your Order';

        if (result.ok && result.data && result.data.success) {
          if (successBox) {
            var ordNum = result.data.order_number || '';
            var cnt = result.data.attachments_count || 0;
            successBox.innerHTML =
              '<svg width="24" height="24" viewBox="0 0 24 24" style="flex-shrink:0;stroke:currentColor;fill:none;stroke-width:2;"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>' +
              '<div><strong>Thank you for choosing COMECIL!</strong><br>Your project request has been submitted successfully.' +
              (ordNum ? '<div style="margin-top:8px;font-family:var(--font-mono);font-size:0.95rem;">Order Reference ID: <span style="font-weight:700;color:var(--electric);background:rgba(59,130,246,0.1);padding:2px 8px;border-radius:4px;">' + ordNum + '</span></div>' : '') +
              (cnt ? '<div style="margin-top:6px;font-size:0.85rem;color:var(--text-secondary);">' + cnt + ' file(s) attached securely.</div>' : '') +
              '<div style="margin-top:6px;font-size:0.9rem;">Our engineering team will review your specifications and contact you within 24 hours.</div></div>';
            successBox.classList.add('show');
            successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          orderForm.reset();
          uploadedFiles = [];
          renderFileList();
          if (descCtr) descCtr.textContent = '0 / 1000 characters (min 20)';
          if (srvSel) srvSel.innerHTML = '<option value="">Choose engineering field first</option>';
          if (window.Toast) window.Toast.success('Order submitted successfully! Ref: ' + (ordNum || ''), 5000);
        } else {
          var msg = (result.data && (result.data.message || result.data.error)) || 'Submission failed. Please try again.';
          if (errorBox) {
            errorBox.classList.add('show');
            var d = errorBox.querySelector('div');
            if (d) d.textContent = msg;
          }
          if (window.Toast) window.Toast.error(msg);
          if (result.data && result.data.errors) {
            Object.keys(result.data.errors).forEach(function(k) {
              var f = document.querySelector('[name="' + k + '"]');
              if (f) showErr(f.closest('.field'), result.data.errors[k]);
            });
          }
        }
      })
      .catch(function() {
        submitBtn.disabled = false;
        if (spinner) spinner.classList.remove('show');
        if (btnText) btnText.textContent = 'Submit Your Order';
        var errMsg = window.location.protocol === 'file:'
          ? 'Backend not connected: Please launch start-server.bat and visit http://localhost:8000'
          : 'Network error connecting to server. Please try again.';
        if (window.Toast) window.Toast.error(errMsg, 6000);
      });
  });
});
