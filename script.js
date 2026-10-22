// Baro Cortes - Barbearia do Guilherme
// Mobile-First Experience & WhatsApp Integration

document.addEventListener('DOMContentLoaded', () => {
  const WHATSAPP_PHONE = '5511948652519';

  // Elements
  const bookingForm = document.getElementById('booking-form');
  const inputNome = document.getElementById('nome');
  const selectServico = document.getElementById('servico');
  const inputData = document.getElementById('data');
  const inputHorario = document.getElementById('horario');
  const timeChips = document.querySelectorAll('.time-chip');
  const serviceCards = document.querySelectorAll('.service-card');
  const floatingBar = document.getElementById('floating-bar');
  const bookingSection = document.getElementById('agendamento');

  // Day picker elements
  const daysContainer = document.getElementById('days-container');
  const selectedDayLabel = document.getElementById('selected-day-label');
  const btnCustomDate = document.getElementById('btn-custom-date');
  const customDateInput = document.getElementById('custom-date-input');

  // Lightbox elements
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');
  const galleryItems = document.querySelectorAll('.gallery-item');

  // 1. Configurar Carrossel Rápido de Dias (Sem precisar abrir calendário difícil)
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const fullDaysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const minDateStr = `${yyyy}-${mm}-${dd}`;

  if (daysContainer && inputData) {
    daysContainer.innerHTML = '';

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dow = i === 0 ? 'Hoje' : (i === 1 ? 'Amanhã' : daysOfWeek[d.getDay()]);
      const fullDow = i === 0 ? 'Hoje' : (i === 1 ? 'Amanhã' : fullDaysOfWeek[d.getDay()]);
      const num = d.getDate();
      const mon = months[d.getMonth()];
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const isoDate = `${y}-${m}-${dayNum}`;
      const brDate = `${dayNum}/${m}/${y}`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `day-chip-btn ${i === 0 ? 'active' : ''}`;
      btn.setAttribute('data-date', isoDate);
      btn.setAttribute('data-br', brDate);
      btn.setAttribute('data-label', `${fullDow} (${dayNum}/${m})`);
      btn.innerHTML = `
        <span class="day-chip-weekday">${dow}</span>
        <span class="day-chip-number">${num}</span>
        <span class="day-chip-month">${mon}</span>
      `;

      btn.addEventListener('click', () => {
        document.querySelectorAll('.day-chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        inputData.value = isoDate;
        daysContainer.classList.remove('error');
        if (selectedDayLabel) selectedDayLabel.textContent = `${fullDow} (${dayNum}/${m})`;
        if (customDateInput) customDateInput.style.display = 'none';
      });

      daysContainer.appendChild(btn);

      // Pre-seleciona Hoje por padrão
      if (i === 0) {
        inputData.value = isoDate;
        if (selectedDayLabel) selectedDayLabel.textContent = `Hoje (${dayNum}/${m})`;
      }
    }

    if (btnCustomDate && customDateInput) {
      customDateInput.min = minDateStr;
      btnCustomDate.addEventListener('click', () => {
        customDateInput.style.display = customDateInput.style.display === 'none' ? 'block' : 'none';
        if (customDateInput.style.display === 'block') {
          customDateInput.focus();
          try { customDateInput.showPicker(); } catch (e) {}
        }
      });

      customDateInput.addEventListener('change', () => {
        if (customDateInput.value) {
          inputData.value = customDateInput.value;
          const [y, m, d] = customDateInput.value.split('-');
          document.querySelectorAll('.day-chip-btn').forEach(b => b.classList.remove('active'));
          if (selectedDayLabel) selectedDayLabel.textContent = `Data: ${d}/${m}/${y}`;
          daysContainer.classList.remove('error');
        }
      });
    }
  }

  // 2. Seleção rápida de horário via chips
  timeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      timeChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const timeVal = chip.getAttribute('data-time');
      if (inputHorario) {
        inputHorario.value = timeVal;
        inputHorario.classList.remove('error');
      }
    });
  });

  if (inputHorario) {
    inputHorario.addEventListener('input', () => {
      timeChips.forEach(c => {
        if (c.getAttribute('data-time') === inputHorario.value) {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });
    });
  }

  // 3. Ao clicar em um serviço na lista, pré-seleciona no formulário e rola até ele
  serviceCards.forEach(card => {
    card.addEventListener('click', () => {
      const serviceName = card.getAttribute('data-service');
      if (serviceName && selectServico) {
        selectServico.value = serviceName;
        selectServico.classList.remove('error');

        // Dispara evento change para atualizar botão de pagamento se necessário
        selectServico.dispatchEvent(new Event('change'));

        // Scroll to form smoothly
        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Visual flash feedback
        const cardBox = document.querySelector('.booking-card');
        if (cardBox) {
          cardBox.classList.remove('flash-highlight');
          void cardBox.offsetWidth;
          cardBox.classList.add('flash-highlight');
        }

        if (!inputNome.value.trim()) {
          inputNome.focus();
        }
      }
    });
  });

  // 4. Validação e envio do Formulário de Agendamento
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      // Nota: o payment.js trata o envio online vs local, mas mantemos validação de base aqui caso payment.js não intercepte
      let hasError = false;
      const nome = inputNome.value.trim();
      const servico = selectServico.value.trim();
      const dataVal = inputData.value.trim();
      const horario = inputHorario.value.trim();

      [inputNome, selectServico, inputHorario].forEach(el => el.classList.remove('error'));
      if (daysContainer) daysContainer.classList.remove('error');

      if (!nome) {
        inputNome.classList.add('error');
        hasError = true;
      }
      if (!servico) {
        selectServico.classList.add('error');
        hasError = true;
      }
      if (!dataVal) {
        if (daysContainer) daysContainer.classList.add('error');
        hasError = true;
      }
      if (!horario) {
        inputHorario.classList.add('error');
        hasError = true;
      }

      if (hasError) {
        const firstErr = document.querySelector('.form-input.error, .form-select.error, .days-scroll-container.error');
        if (firstErr) firstErr.focus();
        e.preventDefault();
        return;
      }
    });
  }

  // Remove error on input
  [inputNome, selectServico, inputHorario].forEach(el => {
    if (el) {
      el.addEventListener('input', () => el.classList.remove('error'));
      el.addEventListener('change', () => el.classList.remove('error'));
    }
  });

  // 5. Botão flutuante mobile: esconde quando o formulário estiver na tela
  if (floatingBar && bookingSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          floatingBar.classList.add('hidden');
        } else {
          floatingBar.classList.remove('hidden');
        }
      });
    }, {
      root: null,
      threshold: 0.15
    });

    observer.observe(bookingSection);
  }

  // 6. Lightbox simples e leve para ver os detalhes dos cortes
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const captionTitle = item.querySelector('.gallery-caption h4');
      const captionSub = item.querySelector('.gallery-caption p');

      if (img && lightbox && lightboxImg) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || 'Corte Baro Cortes';
        if (lightboxCaption && captionTitle) {
          lightboxCaption.textContent = `${captionTitle.textContent} - ${captionSub ? captionSub.textContent : ''}`;
        }
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  const closeLightbox = () => {
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
});
