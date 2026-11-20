/**
 * COMECIL — Main JavaScript
 * Global behaviors: Theme, Navigation, Mobile Menu, Toasts, Reveal, Services Data
 */
(function() {
  'use strict';

  /* ============ THEME TOGGLE ============ */
  var THEME_KEY = 'comecil_theme';
  var html = document.documentElement;

  function getStoredTheme() {
    var stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function applyTheme(t) {
    html.setAttribute('data-theme', t);
    var toggles = document.querySelectorAll('.theme-toggle');
    toggles.forEach(function(btn) {
      btn.textContent = t === 'dark' ? '🌙' : '☀️';
      btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
    localStorage.setItem(THEME_KEY, t);
  }

  // Apply on init
  applyTheme(getStoredTheme());

  document.addEventListener('DOMContentLoaded', function() {
    var toggles = document.querySelectorAll('.theme-toggle');
    toggles.forEach(function(btn) {
      btn.addEventListener('click', function() {
        html.classList.add('theme-transitioning');
        var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        setTimeout(function() {
          html.classList.remove('theme-transitioning');
        }, 400);
      });
    });

    /* ============ MOBILE NAVIGATION ============ */
    var burger = document.getElementById('burgerBtn');
    var navLinks = document.getElementById('navLinks');
    if (burger && navLinks) {
      burger.addEventListener('click', function(e) {
        e.stopPropagation();
        var open = navLinks.classList.toggle('open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      // Close on outside click
      document.addEventListener('click', function(e) {
        if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !burger.contains(e.target)) {
          navLinks.classList.remove('open');
          burger.setAttribute('aria-expanded', 'false');
        }
      });

      // Close on link click
      navLinks.querySelectorAll('a').forEach(function(a) {
        a.addEventListener('click', function() {
          navLinks.classList.remove('open');
          burger.setAttribute('aria-expanded', 'false');
        });
      });
    }

    /* ============ ACTIVE NAVIGATION STATE ============ */
    var currentPath = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';
    if (currentPath === '' || currentPath === 'comecil.html') currentPath = 'index.html';
    var allNavLinks = document.querySelectorAll('.nav-links a');
    allNavLinks.forEach(function(link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var linkFile = href.split('#')[0].split('?')[0].toLowerCase();
      if (linkFile === currentPath) {
        link.classList.add('active');
      } else if (!href.startsWith('#') && linkFile !== '') {
        link.classList.remove('active');
      }
    });

    /* ============ BACK TO TOP BUTTON ============ */
    var toTopBtn = document.getElementById('toTopBtn');
    if (toTopBtn) {
      window.addEventListener('scroll', function() {
        toTopBtn.classList.toggle('show', window.pageYOffset > 380);
      }, { passive: true });
      toTopBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    /* ============ SCROLL REVEAL ANIMATIONS ============ */
    var revEls = document.querySelectorAll('.reveal');
    if (revEls.length > 0) {
      if (window.IntersectionObserver) {
        var io = new IntersectionObserver(function(entries) {
          entries.forEach(function(e) {
            if (e.isIntersecting) {
              e.target.classList.add('in');
              io.unobserve(e.target);
            }
          });
        }, { threshold: 0.1 });
        revEls.forEach(function(el) { io.observe(el); });
      } else {
        revEls.forEach(function(el) { el.classList.add('in'); });
      }
    }
  });

  /* ============ TOAST NOTIFICATION SYSTEM ============ */
  window.Toast = {
    _show: function(msg, type, dur) {
      var cont = document.getElementById('toastContainer');
      if (!cont) {
        cont = document.createElement('div');
        cont.className = 'toast-container';
        cont.id = 'toastContainer';
        document.body.appendChild(cont);
      }
      var icons = {
        success: '✅',
        error:   '❌',
        warning: '⚠️',
        info:    'ℹ️'
      };
      var t = document.createElement('div');
      t.className = 'toast';
      t.innerHTML =
        '<span class="toast-icon">' + (icons[type] || 'ℹ️') + '</span>' +
        '<span style="flex:1; line-height:1.4;">' + msg + '</span>' +
        '<button type="button" class="toast-close" aria-label="Close notification">&times;</button>';
      t.querySelector('.toast-close').addEventListener('click', function() { t.remove(); });
      cont.appendChild(t);
      setTimeout(function() {
        if (t.parentNode) {
          t.style.opacity = '0';
          t.style.transform = 'translateX(20px)';
          t.style.transition = 'all 0.3s ease';
          setTimeout(function() { t.remove(); }, 300);
        }
      }, dur || 4000);
    },
    success: function(m, d) { this._show(m, 'success', d); },
    error:   function(m, d) { this._show(m, 'error', d); },
    warning: function(m, d) { this._show(m, 'warning', d); },
    info:    function(m, d) { this._show(m, 'info', d); }
  };

  /* ============ SERVICES CATALOG DATA ============ */
  window.COMECIL_DATA = window.COMECIL_DATA || {};
  window.COMECIL_DATA.services = {
    "Computer Science": [
      "Website Development", "Frontend Development", "Backend Development", "Full Stack Development",
      "Mobile App Development", "Software Development", "Artificial Intelligence Solutions",
      "Machine Learning Projects", "Data Science", "Database Development", "Python Programming",
      "Java Programming", "C++ Programming", "UI/UX Design", "Cybersecurity Solutions",
      "Automation Projects", "Final Year Projects"
    ],
    "Mechanical Engineering": [
      "CAD Design", "3D Modeling", "SolidWorks Projects", "AutoCAD Mechanical", "ANSYS Simulation",
      "Machine Design", "Product Design", "Manufacturing Design", "Thermal Engineering Analysis",
      "Fluid Mechanics Projects", "Mechanical Simulations", "Engineering Drawings",
      "Technical Reports", "Research Projects", "Final Year Projects"
    ],
    "Civil Engineering": [
      "Structural Design", "AutoCAD Drawings", "Building Plans", "Architectural Drawings",
      "3D Building Models", "Quantity Estimation", "Cost Estimation", "BOQ Preparation",
      "Structural Analysis", "ETABS Projects", "SAFE Analysis", "Construction Planning",
      "Surveying Projects", "Civil Engineering Reports", "Final Year Projects"
    ]
  };

  /* ============ SERVICE SELECTION ROUTER ============ */
  window.selectServiceForOrder = function(catName, srvName) {
    var url = 'order.html?category=' + encodeURIComponent(catName || '') + '&service=' + encodeURIComponent(srvName || '');
    window.location.href = url;
  };

})();
