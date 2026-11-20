/**
 * COMECIL — How It Works & FAQ Controller
 */
document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  var faqs = [
    {
      q: "How do I place an engineering order with COMECIL?",
      a: "Simply visit our 'Place an Order' page and fill out our structured order form with your project requirements, deadline, and engineering field. You can attach reference files or specifications (PDF, DOCX, CAD drawings, etc.). Our engineers review and confirm within 24 hours."
    },
    {
      q: "What file formats and file sizes can I attach?",
      a: "You can attach PDF, DOC, DOCX, JPG, JPEG, and PNG files up to 10 MB per file. For larger architectural or CAD packages, you can attach an overview file or share a secure link inside the project description."
    },
    {
      q: "How long does a typical engineering project take?",
      a: "Project timelines depend strictly on complexity and scope. Small modeling or coding tasks can be delivered within 24–48 hours, while comprehensive research simulations or multi-storey ETABS building designs typically take 1–2 weeks. You can specify your required deadline on the order form."
    },
    {
      q: "Is my project and research kept confidential?",
      a: "Absolutely. All client code, proprietary designs, intellectual property, and project files are kept 100% confidential under strict non-disclosure standards. We never publish or share client deliverables."
    },
    {
      q: "Do you offer revisions after project delivery?",
      a: "Yes. Every COMECIL order includes free revision support to ensure the final deliverable completely satisfies your technical and academic requirements."
    },
    {
      q: "What engineering disciplines does COMECIL specialize in?",
      a: "We specialize in three major disciplines: Computer Science & IT (Full-stack web, AI/ML, data science, mobile apps), Mechanical Engineering (SolidWorks CAD, ANSYS simulation, thermal & CFD analysis), and Civil Engineering (structural analysis, ETABS, AutoCAD, BOQ estimation)."
    }
  ];

  var faqList = document.getElementById('faqList');
  if (faqList) {
    faqList.innerHTML = faqs.map(function(f, i) {
      return (
        '<div class="faq-item reveal in">' +
          '<button type="button" class="faq-q" aria-expanded="false" id="faq-q-' + i + '">' +
            '<span>' + f.q + '</span>' +
            '<span class="faq-icon" aria-hidden="true">+</span>' +
          '</button>' +
          '<div class="faq-a" role="region" aria-labelledby="faq-q-' + i + '">' +
            '<div class="faq-a-inner">' + f.a + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    faqList.querySelectorAll('.faq-item').forEach(function(item) {
      var q = item.querySelector('.faq-q');
      var a = item.querySelector('.faq-a');
      q.addEventListener('click', function() {
        var isOpen = item.classList.contains('open');

        // Close all other open FAQs (one at a time UX)
        faqList.querySelectorAll('.faq-item.open').forEach(function(other) {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
            other.querySelector('.faq-a').style.maxHeight = '0';
          }
        });

        if (isOpen) {
          item.classList.remove('open');
          q.setAttribute('aria-expanded', 'false');
          a.style.maxHeight = '0';
        } else {
          item.classList.add('open');
          q.setAttribute('aria-expanded', 'true');
          a.style.maxHeight = a.scrollHeight + 'px';
        }
      });
    });
  }
});
