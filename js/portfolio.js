/**
 * COMECIL — Portfolio Page Controller
 * Category filtering, responsive cards grid, and detail modal with keyboard/accessibility support.
 */
document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  var portfolioData = [
    {
      id: 1,
      cat: 'cs',
      categoryName: 'Computer Science',
      title: 'Enterprise E-Commerce Platform',
      desc: 'A full-stack, scalable online marketplace built with React on the frontend and Node.js on the backend. Includes secure multi-gateway payment processing (Stripe & PayPal), inventory management, and a comprehensive real-time admin analytics dashboard.',
      tech: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker'],
      emoji: '🛒',
      color: '#3b82f6'
    },
    {
      id: 2,
      cat: 'mech',
      categoryName: 'Mechanical Engineering',
      title: 'Automotive Suspension CAD & FEA',
      desc: 'Parametric SolidWorks 3D assembly and finite element stress analysis (FEA) of a double wishbone suspension system under dynamic road impact forces. Delivered with complete GD&T manufacturing blueprints and technical safety documentation.',
      tech: ['SolidWorks', 'ANSYS Mechanical', 'FEA Simulation', 'GD&T', 'Material Optimization'],
      emoji: '⚙️',
      color: '#f59e0b'
    },
    {
      id: 3,
      cat: 'civil',
      categoryName: 'Civil Engineering',
      title: 'High-Rise Tower Structural Analysis',
      desc: 'Comprehensive 3D structural model and seismic response spectrum analysis for a 12-storey reinforced concrete residential tower using ETABS. Conforms to ACI 318 and IBC standards with complete member sizing and shear wall detailing.',
      tech: ['ETABS', 'SAFE', 'AutoCAD Civil', 'Seismic Analysis', 'ACI 318'],
      emoji: '🏗️',
      color: '#10b981'
    },
    {
      id: 4,
      cat: 'cs',
      categoryName: 'Computer Science',
      title: 'AI Diagnostic Image Classifier',
      desc: 'Deep convolutional neural network (CNN) for early-stage medical anomaly detection. Achieved 94.2% test accuracy with PyTorch, complete with Grad-CAM visual interpretability heatmaps and a lightweight REST API for clinic integration.',
      tech: ['Python', 'PyTorch', 'OpenCV', 'FastAPI', 'NumPy', 'Docker'],
      emoji: '🤖',
      color: '#8b5cf6'
    },
    {
      id: 5,
      cat: 'mech',
      categoryName: 'Mechanical Engineering',
      title: 'Shell-and-Tube Heat Exchanger CFD',
      desc: 'ANSYS Fluent computational fluid dynamics (CFD) simulation of turbulent thermal exchange across 240 tube passes. Optimized segmental baffle spacing and cut angle to achieve a 22% increase in heat transfer coefficient while minimizing pressure drop.',
      tech: ['ANSYS Fluent', 'CFD Meshing', 'Thermodynamics', 'Fluid Mechanics'],
      emoji: '🔥',
      color: '#ef4444'
    },
    {
      id: 6,
      cat: 'civil',
      categoryName: 'Civil Engineering',
      title: 'Luxury Villa Architectural Plans & BOQ',
      desc: 'Full architectural, structural, and MEP drafting set for a 5-bedroom luxury residence. Delivered with detailed construction schedules, accurate material take-offs, unit rate breakdown, and tender-ready Bill of Quantities (BOQ).',
      tech: ['AutoCAD', 'Revit BIM', 'Quantity Surveying', 'BOQ Estimation', 'MS Project'],
      emoji: '📐',
      color: '#0ea5e9'
    }
  ];

  var grid = document.getElementById('portfolioGrid');
  var modal = document.getElementById('portfolioModal');
  var modalHero = document.getElementById('modalHero');
  var modalContent = document.getElementById('modalContent');
  var modalClose = document.getElementById('modalClose');

  if (!grid) return;

  var currentFilter = 'all';

  function renderPortfolio() {
    var items = portfolioData.filter(function(p) {
      return currentFilter === 'all' || p.cat === currentFilter;
    });

    grid.innerHTML = items.map(function(p) {
      return (
        '<div class="portfolio-card reveal in" data-id="' + p.id + '" tabindex="0" role="button" aria-label="View ' + p.title + '">' +
          '<div class="portfolio-card-hero" style="background:' + p.color + '22;">' + p.emoji + '</div>' +
          '<div class="portfolio-card-body">' +
            '<div class="portfolio-cat">' + p.categoryName + '</div>' +
            '<div class="portfolio-title">' + p.title + '</div>' +
            '<div class="portfolio-desc">' + p.desc + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    // Attach click and Enter key listeners
    grid.querySelectorAll('.portfolio-card').forEach(function(card) {
      function open() {
        var id = parseInt(card.getAttribute('data-id'), 10);
        openProjectModal(id);
      }
      card.addEventListener('click', open);
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function openProjectModal(id) {
    var p = portfolioData.find(function(x) { return x.id === id; });
    if (!p || !modal) return;

    modalHero.style.background = p.color + '22';
    modalHero.textContent = p.emoji;

    var techBadges = p.tech.map(function(t) {
      return '<span style="display:inline-block; font-size:0.75rem; font-family:var(--font-mono); background:var(--bg-secondary); border:1px solid var(--bg-card-border); padding:3px 8px; border-radius:6px; margin:0 4px 4px 0;">' + t + '</span>';
    }).join('');

    modalContent.innerHTML =
      '<h2 style="font-family:var(--font-display); font-size:1.5rem; font-weight:700; margin-bottom:0.35rem; color:var(--text-primary);">' + p.title + '</h2>' +
      '<p style="font-size:0.88rem; color:var(--electric); font-weight:700; margin-bottom:1rem; text-transform:uppercase; letter-spacing:0.05em;">' + p.categoryName + '</p>' +
      '<div style="margin-bottom:1.25rem;">' + techBadges + '</div>' +
      '<p style="font-size:0.95rem; color:var(--text-secondary); line-height:1.8; margin-bottom:1.5rem;">' + p.desc + '</p>' +
      '<div style="display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center;">' +
        '<a href="order.html?category=' + encodeURIComponent(p.categoryName) + '" class="btn btn-primary">' +
          'Start a Similar Project &rarr;' +
        '</a>' +
        '<button type="button" class="btn btn-dark-outline" id="modalDismissBtn">Close</button>' +
      '</div>';

    var dismissBtn = document.getElementById('modalDismissBtn');
    if (dismissBtn) dismissBtn.addEventListener('click', closeModal);

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Filter Buttons
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderPortfolio();
    });
  });

  // Modal close handlers
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeModal();
    });
  }

  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeModal();
    }
  });

  renderPortfolio();
});
