/**
 * COMECIL — Services Page Controller
 * Handles 47-service catalog generation, category filters, and instant search.
 */
document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  var servicesData = (window.COMECIL_DATA && window.COMECIL_DATA.services) || {};

  var categoryIcons = {
    "Computer Science": '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    "Mechanical Engineering": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
    "Civil Engineering": '<svg viewBox="0 0 24 24"><path d="M3 21h18M4 21V10l8-6 8 6v11M9 21v-6h6v6"/></svg>'
  };

  var catKey = {
    "Computer Science": "cs",
    "Mechanical Engineering": "mech",
    "Civil Engineering": "civil"
  };

  var grid = document.getElementById('servicesGrid');
  var empty = document.getElementById('servicesEmptyState');
  var searchInput = document.getElementById('serviceSearchInput');
  var clearBtn = document.getElementById('serviceSearchClear');
  var resetBtn = document.getElementById('servicesResetBtn');
  var queryDisplay = document.getElementById('servicesSearchQueryDisplay');
  var countBadge = document.getElementById('servicesCountBadge');

  if (!grid) return;

  var currentCat = 'all';
  var currentQ = '';

  function buildServicesGrid() {
    var allCards = [];
    Object.keys(servicesData).forEach(function(cat) {
      servicesData[cat].forEach(function(name) {
        allCards.push({
          category: cat,
          catKey: catKey[cat] || 'cs',
          name: name,
          icon: categoryIcons[cat] || categoryIcons["Computer Science"]
        });
      });
    });

    grid.innerHTML = allCards.map(function(item) {
      return (
        '<div class="service-card reveal in" data-category="' + item.category + '" data-name="' + item.name.toLowerCase() + '">' +
          '<div class="service-card-top">' +
            '<div class="service-card-icon">' + item.icon + '</div>' +
            '<span class="service-cat-badge ' + item.catKey + '">' + item.category + '</span>' +
          '</div>' +
          '<h3 class="service-card-title">' + item.name + '</h3>' +
          '<p class="service-card-desc">Professional, industry-standard ' + item.name.toLowerCase() + ' tailored to client specifications.</p>' +
          '<button type="button" class="service-card-btn select-service-btn" data-category="' + item.category + '" data-service="' + item.name + '">' +
            '<span>Order This Service</span>' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
          '</button>' +
        '</div>'
      );
    }).join('');

    grid.querySelectorAll('.select-service-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var cat = btn.getAttribute('data-category');
        var srv = btn.getAttribute('data-service');
        if (window.selectServiceForOrder) {
          window.selectServiceForOrder(cat, srv);
        } else {
          window.location.href = 'order.html?category=' + encodeURIComponent(cat) + '&service=' + encodeURIComponent(srv);
        }
      });
    });

    applyServiceFilter();
  }

  function applyServiceFilter() {
    var cards = grid.querySelectorAll('.service-card');
    var visible = 0;

    cards.forEach(function(c) {
      var catMatch  = currentCat === 'all' || c.getAttribute('data-category') === currentCat;
      var nameMatch = !currentQ || c.getAttribute('data-name').includes(currentQ);
      var show = catMatch && nameMatch;
      c.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (empty) {
      empty.style.display = visible === 0 ? 'block' : 'none';
    }

    if (countBadge) {
      countBadge.textContent = visible + ' Services Available';
    }
  }

  // Category filter buttons
  document.querySelectorAll('.service-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.service-filter-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      currentCat = btn.getAttribute('data-category');
      applyServiceFilter();
    });
  });

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      currentQ = searchInput.value.trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = currentQ ? 'block' : 'none';
      if (queryDisplay) queryDisplay.textContent = currentQ ? ' "' + currentQ + '"' : '';
      applyServiceFilter();
    });
  }

  // Clear search
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (searchInput) searchInput.value = '';
      currentQ = '';
      clearBtn.style.display = 'none';
      if (queryDisplay) queryDisplay.textContent = '';
      applyServiceFilter();
      if (searchInput) searchInput.focus();
    });
  }

  // Reset all
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      if (searchInput) searchInput.value = '';
      currentQ = '';
      if (clearBtn) clearBtn.style.display = 'none';
      if (queryDisplay) queryDisplay.textContent = '';
      currentCat = 'all';
      document.querySelectorAll('.service-filter-btn').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-category') === 'all');
      });
      applyServiceFilter();
    });
  }

  // Check URL params for pre-filtering (e.g. services.html?discipline=civil)
  var params = new URLSearchParams(window.location.search);
  var disciplineParam = params.get('discipline') || params.get('category');
  if (disciplineParam) {
    var matchingBtn = Array.from(document.querySelectorAll('.service-filter-btn')).find(function(b) {
      return b.getAttribute('data-category').toLowerCase().includes(disciplineParam.toLowerCase());
    });
    if (matchingBtn) {
      matchingBtn.click();
    }
  }

  buildServicesGrid();
});
