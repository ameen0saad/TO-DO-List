// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px',
};

const observer = new IntersectionObserver(function (entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');

      // Animate feature cards with stagger
      if (entry.target.id === 'features') {
        const cards = entry.target.querySelectorAll('.feature-card');
        const title = entry.target.querySelector('.section-title');

        title.classList.add('visible');

        cards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add('visible');
          }, index * 200);
        });
      }
    }
  });
}, observerOptions);

// Observe sections
const sectionsToObserve = ['features', 'about', 'cta', 'footer'];
sectionsToObserve.forEach((sectionId) => {
  const section = document.getElementById(sectionId);
  if (section) {
    observer.observe(section);
  }
});

// Add hover sound effects (optional)
document.addEventListener('DOMContentLoaded', function () {
  const buttons = document.querySelectorAll('.btn');

  buttons.forEach((button) => {
    button.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-2px) scale(1.05)';
    });

    button.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });

  // Add click animation
  buttons.forEach((button) => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 150);
    });
  });
});

// Parallax effect for floating elements
window.addEventListener('scroll', function () {
  const scrolled = window.pageYOffset;
  const floatingElements = document.querySelectorAll('.floating-element');

  floatingElements.forEach((element, index) => {
    const speed = 0.5 + index * 0.1;
    element.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
  });
});

const startButton = document.getElementById('startbutton');
const getStartedBtn = document.getElementById('getStartedBtn');
const signInBtn = document.getElementById('signInBtn');
const signInfooter = document.getElementById('signIn');
const createAccount = document.getElementById('createAccount');

startButton.addEventListener('click', () => {
  window.location.href = '/frontEnd/signup-form-19/index.html';
});

getStartedBtn.addEventListener('click', () => {
  window.location.href = '/frontEnd/signup-form-19/index.html';
});

createAccount.addEventListener('click', () => {
  window.location.href = '/frontEnd/signup-form-19/index.html';
});

signInBtn.addEventListener('click', () => {
  window.location.href = '/frontEnd/Login_v1/index.html';
});
signInfooter.addEventListener('click', () => {
  window.location.href = '/frontEnd/Login_v1/index.html';
});
