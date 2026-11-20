/**
 * COMECIL — Home Page Controller
 * Testimonial slider and interactive elements.
 */
document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  var testiData = [
    {
      text: "COMECIL delivered an outstanding ETABS analysis report for our residential complex. The structural drawings were precise, well-documented, and delivered on time. Highly professional engineering team!",
      name: "Engr. Asif Mehmood",
      role: "Senior Structural Engineer, Lahore"
    },
    {
      text: "The full-stack platform they built for our business is fantastic. Clean code, fast performance, and they delivered a week ahead of schedule. We will definitely collaborate again for upcoming projects.",
      name: "Sarah Imran",
      role: "Tech Startup Founder, Karachi"
    },
    {
      text: "I needed high-precision SolidWorks 3D models and an ANSYS FEA thermal simulation for my master's thesis. COMECIL understood the engineering theory and delivered beyond expectations.",
      name: "Aamir Hussain",
      role: "MSc Mechanical Engineering Researcher"
    },
    {
      text: "Excellent AutoCAD drawings and detailed BOQ preparation for our villa project. The attention to detail and turnaround time were remarkable. Highly recommended for civil engineering works.",
      name: "Raza Khan",
      role: "Property Development Consultant, Islamabad"
    }
  ];

  var slides = document.getElementById('testiSlides');
  var dots = document.getElementById('testiDots');
  var prevBtn = document.getElementById('testiPrev');
  var nextBtn = document.getElementById('testiNext');

  if (slides && dots) {
    var current = 0;

    slides.innerHTML = testiData.map(function(t) {
      return (
        '<div class="testi-slide">' +
          '<div class="testi-quote">' + t.text + '</div>' +
          '<div class="testi-author">' +
            '<div class="testi-avatar">' + t.name[0] + '</div>' +
            '<div>' +
              '<div class="testi-name">' + t.name + '</div>' +
              '<div class="testi-role">' + t.role + '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    dots.innerHTML = testiData.map(function(_, i) {
      return '<div class="testi-dot' + (i === 0 ? ' active' : '') + '" data-i="' + i + '" role="button" aria-label="Slide ' + (i + 1) + '"></div>';
    }).join('');

    function goTo(i) {
      current = (i + testiData.length) % testiData.length;
      slides.style.transform = 'translateX(-' + (current * 100) + '%)';
      dots.querySelectorAll('.testi-dot').forEach(function(d, j) {
        d.classList.toggle('active', j === current);
      });
    }

    if (prevBtn) prevBtn.addEventListener('click', function() { goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function() { goTo(current + 1); });

    dots.querySelectorAll('.testi-dot').forEach(function(d) {
      d.addEventListener('click', function() {
        goTo(parseInt(d.getAttribute('data-i'), 10));
      });
    });

    var timer = setInterval(function() {
      goTo(current + 1);
    }, 5500);

    var wrap = document.querySelector('.testi-wrap');
    if (wrap) {
      wrap.addEventListener('mouseenter', function() { clearInterval(timer); });
      wrap.addEventListener('mouseleave', function() {
        timer = setInterval(function() { goTo(current + 1); }, 5500);
      });
    }
  }
});
