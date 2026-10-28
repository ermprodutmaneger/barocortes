// Baro Cortes - Módulo de Pagamento & Checkout com Caixinha pro Gui

(function() {
  const WHATSAPP_PHONE = '5511948652519';

  const SERVICE_PRICES = {
    'Corte com sobrancelha inclusa': 30.00,
    'Corte e barba': 35.00,
    'Sobrancelha avulsa': 5.00,
    'Corte com alisante': 50.00,
    'Corte com luzes': 60.00,
    'Barba avulsa': 10.00,
    'Plano mensal com corte e barba': 100.00
  };

  // Helper CRC16 for Pix
  function crc16(data) {
    let crc = 0xFFFF;
    const utf8 = unescape(encodeURIComponent(data));
    for (let i = 0; i < utf8.length; i++) {
      crc ^= (utf8.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  function field(id, val) {
    const len = String(val.length).padStart(2, '0');
    return `${id}${len}${val}`;
  }

  function buildClientPix(key, name, city, amount, txid = '***') {
    const gui = field('00', 'BR.GOV.BCB.PIX');
    const keyField = field('01', key);
    const merchantAcc = field('26', gui + keyField);

    let raw = field('00', '01') +
      merchantAcc +
      field('52', '0000') +
      field('53', '986');

    if (amount > 0) {
      raw += field('54', amount.toFixed(2));
    }

    raw += field('58', 'BR') +
      field('59', name.slice(0, 25)) +
      field('60', city.slice(0, 15)) +
      field('62', field('05', '***')) +
      '6304';

    const checksum = crc16(raw);
    return raw + checksum;
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const form = document.getElementById('booking-form');
    const inputNome = document.getElementById('nome');
    const selectServico = document.getElementById('servico');
    const inputData = document.getElementById('data');
    const inputHorario = document.getElementById('horario');
    const submitBtn = document.getElementById('btn-submit-booking');

    const radioLocal = document.getElementById('pay-local');
    const radioOnline = document.getElementById('pay-online');
    const cardLocal = document.getElementById('card-pay-local');
    const cardOnline = document.getElementById('card-pay-online');

    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutClose = document.getElementById('checkout-close');
    const checkoutServiceTitle = document.getElementById('modal-service-title');
    const checkoutAmount = document.getElementById('modal-amount-val');
    const checkoutClientMeta = document.getElementById('modal-client-meta');
    const checkoutOrderId = document.getElementById('modal-order-id');

    const pixQrContainer = document.getElementById('pix-qr-container');
    const pixCopyInput = document.getElementById('pix-copy-input');
    const btnPixCopy = document.getElementById('btn-pix-copy');
    const btnCopyCpf = document.getElementById('btn-copy-cpf');
    const pixTimer = document.getElementById('pix-timer');
    const btnPixConfirmWa = document.getElementById('btn-pix-confirm-wa');


    const btnSwitchLocal = document.getElementById('btn-switch-local');
    const btnPlanOnline = document.getElementById('btn-plan-online');

    // Tip elements inside checkout modal
    const modalTipSection = document.getElementById('modal-tip-section');
    const checkoutTipChips = document.querySelectorAll('#checkout-tip-chips .tip-chip');
    const tipCustomWrap = document.getElementById('tip-custom-wrap');
    const tipCustomVal = document.getElementById('tip-custom-val');
    const btnApplyCustomTip = document.getElementById('btn-apply-custom-tip');

    // Standalone Caixinha Card on page
    const pageTipChips = document.querySelectorAll('#page-tip-chips .page-tip-chip');
    const pageCustomTipWrap = document.getElementById('page-custom-tip-wrap');
    const pageCustomTipInput = document.getElementById('page-custom-tip-input');
    const btnOpenTipPix = document.getElementById('btn-open-tip-pix');
    const labelTipAmount = document.getElementById('label-tip-amount');

    let currentOrder = null;
    let timerInterval = null;
    let selectedPageTip = 5.00;

    // Helper: get selected service price
    function getSelectedPrice() {
      const s = selectServico ? selectServico.value : '';
      return SERVICE_PRICES[s] || 35.00;
    }

    // Update submit button text/style according to payment choice
    function updateSubmitButton() {
      const isOnline = radioOnline && radioOnline.checked;
      const price = getSelectedPrice();
      const priceFormatted = price.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

      if (isOnline) {
        if (cardOnline) cardOnline.classList.add('active');
        if (cardLocal) cardLocal.classList.remove('active');
        if (submitBtn) {
          submitBtn.classList.add('btn-pay-online');
          submitBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Gerar Pix (R$ ${priceFormatted})
          `;
        }
      } else {
        if (cardLocal) cardLocal.classList.add('active');
        if (cardOnline) cardOnline.classList.remove('active');
        if (submitBtn) {
          submitBtn.classList.remove('btn-pay-online');
          submitBtn.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            Solicitar horário pelo WhatsApp
          `;
        }
      }
    }

    if (radioLocal) radioLocal.addEventListener('change', updateSubmitButton);
    if (radioOnline) radioOnline.addEventListener('change', updateSubmitButton);
    if (selectServico) selectServico.addEventListener('change', updateSubmitButton);

    // Initial update
    updateSubmitButton();

    // Timer Countdown
    function startTimer(seconds = 900) {
      clearInterval(timerInterval);
      let left = seconds;
      function tick() {
        const mins = String(Math.floor(left / 60)).padStart(2, '0');
        const secs = String(left % 60).padStart(2, '0');
        if (pixTimer) pixTimer.textContent = `${mins}:${secs}`;
        if (left <= 0) {
          clearInterval(timerInterval);
          if (pixTimer) pixTimer.textContent = 'Expirado';
        }
        left--;
      }
      tick();
      timerInterval = setInterval(tick, 1000);
    }

    // Render QR Code (SVG)
    function renderQr(codeText) {
      if (!pixQrContainer) return;
      pixQrContainer.innerHTML = '';
      if (typeof qrcode !== 'undefined') {
        try {
          const qr = qrcode(0, 'M');
          qr.addData(codeText);
          qr.make();
          const svgTag = qr.createSvgTag(5, 0);
          pixQrContainer.innerHTML = svgTag;
          return;
        } catch (e) {
          console.warn('QR code generator error:', e);
        }
      }
      pixQrContainer.innerHTML = '<div style="font-size:12px; color:#333; text-align:center;">Use o código Copia e Cola abaixo no seu banco</div>';
    }

    // Recalculate order total with tip inside modal
    function recalculateOrderWithTip(tipAmount) {
      if (!currentOrder) return;
      currentOrder.tip = tipAmount;
      const total = currentOrder.baseAmount + tipAmount;
      currentOrder.totalAmount = total;

      const cfg = window.BARO_CONFIG || {};
      const key = cfg.pixKey || '51524549800';
      const name = cfg.pixReceiverName || 'GUILHERME';
      const city = cfg.pixCity || 'SAO PAULO';

      const newPixCode = buildClientPix(key, name, city, total, '***');
      currentOrder.pixCode = newPixCode;

      if (pixCopyInput) pixCopyInput.value = newPixCode;
      renderQr(newPixCode);

      if (checkoutAmount) {
        if (tipAmount > 0) {
          checkoutAmount.innerHTML = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <small style="font-size:0.75rem; color:#fbbf24; font-weight:600; display:block;">(inclui R$ ${tipAmount.toFixed(2)} de caixinha)</small>`;
        } else {
          checkoutAmount.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }
      }
    }

    // Open Checkout Modal
    async function openCheckout(orderInfo) {
      currentOrder = orderInfo;
      currentOrder.baseAmount = orderInfo.amount;
      currentOrder.tip = 0;
      currentOrder.totalAmount = orderInfo.amount;

      if (checkoutServiceTitle) checkoutServiceTitle.textContent = orderInfo.service;
      if (checkoutAmount) checkoutAmount.textContent = `R$ ${orderInfo.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      if (checkoutOrderId) checkoutOrderId.textContent = orderInfo.orderId;
      if (checkoutClientMeta) {
        checkoutClientMeta.innerHTML = `
          <span>👤 ${orderInfo.clientName}</span>
          <span>📅 ${orderInfo.dateBr} ${orderInfo.time !== 'A combinar' ? 'às ' + orderInfo.time : ''}</span>
        `;
      }

      // Hide or show tip section in modal if it's already a standalone tip
      if (modalTipSection) {
        if (orderInfo.isPureTip) {
          modalTipSection.style.display = 'none';
        } else {
          modalTipSection.style.display = 'block';
          // Reset chips to "Sem caixinha"
          checkoutTipChips.forEach(c => {
            if (c.getAttribute('data-tip') === '0') c.classList.add('active');
            else c.classList.remove('active');
          });
          if (tipCustomWrap) tipCustomWrap.style.display = 'none';
        }
      }

      const cfg = window.BARO_CONFIG || {};
      const key = cfg.pixKey || '51524549800';
      const name = cfg.pixReceiverName || 'GUILHERME';
      const city = cfg.pixCity || 'SAO PAULO';

      const pixCode = buildClientPix(key, name, city, orderInfo.amount, '***');
      currentOrder.pixCode = pixCode;
      if (pixCopyInput) pixCopyInput.value = pixCode;

      renderQr(pixCode);
      startTimer(900);


      // Show modal
      if (checkoutModal) {
        checkoutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeCheckout() {
      if (checkoutModal) {
        checkoutModal.classList.remove('active');
        document.body.style.overflow = '';
      }
      clearInterval(timerInterval);
    }

    if (checkoutClose) checkoutClose.addEventListener('click', closeCheckout);
    if (checkoutModal) {
      checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) closeCheckout();
      });
    }

    // Modal Tip Chips Click
    checkoutTipChips.forEach(chip => {
      chip.addEventListener('click', () => {
        checkoutTipChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const tipType = chip.getAttribute('data-tip');
        if (tipType === 'custom') {
          if (tipCustomWrap) {
            tipCustomWrap.style.display = 'flex';
            if (tipCustomVal) tipCustomVal.focus();
          }
        } else {
          if (tipCustomWrap) tipCustomWrap.style.display = 'none';
          const tipVal = parseFloat(tipType) || 0;
          recalculateOrderWithTip(tipVal);
        }
      });
    });

    if (btnApplyCustomTip && tipCustomVal) {
      btnApplyCustomTip.addEventListener('click', () => {
        const val = parseFloat(tipCustomVal.value) || 0;
        if (val > 0) {
          recalculateOrderWithTip(val);
        } else {
          recalculateOrderWithTip(0);
        }
      });
    }

    // Copy Pix Code Button
    if (btnPixCopy && pixCopyInput) {
      btnPixCopy.addEventListener('click', () => {
        pixCopyInput.select();
        pixCopyInput.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(pixCopyInput.value).then(() => {
          btnPixCopy.classList.add('copied');
          btnPixCopy.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Copiado!
          `;
          setTimeout(() => {
            btnPixCopy.classList.remove('copied');
            btnPixCopy.innerHTML = `
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copiar
            `;
          }, 2500);
        });
      });
    }

    // Copy Only CPF Key Button
    if (btnCopyCpf) {
      btnCopyCpf.addEventListener('click', () => {
        const cpf = (window.BARO_CONFIG && window.BARO_CONFIG.pixKey) || '51524549800';
        navigator.clipboard.writeText(cpf).then(() => {
          btnCopyCpf.classList.add('copied');
          btnCopyCpf.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            CPF Copiado!
          `;
          setTimeout(() => {
            btnCopyCpf.classList.remove('copied');
            btnCopyCpf.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copiar CPF
            `;
          }, 2500);
        });
      });
    }

    // Confirm via WhatsApp from Pix
    if (btnPixConfirmWa) {
      btnPixConfirmWa.addEventListener('click', () => {
        if (!currentOrder) return;
        let msg = '';
        if (currentOrder.isPureTip) {
          msg = `Olá, Guilherme! Vim pelo site da Baro Cortes e acabei de mandar uma caixinha de R$ ${currentOrder.totalAmount.toFixed(2)} no Pix pra fortalecer seu trabalho! Valeu pelo corre monstro! 💈👊`;
        } else {
          let tipLine = '';
          if (currentOrder.tip > 0) {
            tipLine = `\nCaixinha pro Gui: R$ ${currentOrder.tip.toFixed(2)} (Total pago: R$ ${currentOrder.totalAmount.toFixed(2)})`;
          }
          msg = `Olá, Guilherme! Vim pelo site da Baro Cortes e fiz o pagamento online:\nNome: ${currentOrder.clientName}\nServiço: ${currentOrder.service} (R$ ${currentOrder.baseAmount.toFixed(2)})${tipLine}\nDia: ${currentOrder.dateBr}\nHorário: ${currentOrder.time}\nPagamento: Pago online via Pix (Pedido #${currentOrder.orderId})\nEsse horário está confirmado?`;
        }
        const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
        closeCheckout();
      });
    }

    // Switch back to local payment from modal
    if (btnSwitchLocal) {
      btnSwitchLocal.addEventListener('click', () => {
        closeCheckout();
        if (radioLocal) {
          radioLocal.checked = true;
          updateSubmitButton();
        }
      });
    }

    // Standalone Caixinha Card on Page logic
    function updatePageTipDisplay(val) {
      selectedPageTip = val;
      if (labelTipAmount) {
        labelTipAmount.textContent = val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      }
    }

    pageTipChips.forEach(chip => {
      chip.addEventListener('click', () => {
        pageTipChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const val = chip.getAttribute('data-val');
        if (val === 'custom') {
          if (pageCustomTipWrap) {
            pageCustomTipWrap.style.display = 'block';
            if (pageCustomTipInput) pageCustomTipInput.focus();
          }
        } else {
          if (pageCustomTipWrap) pageCustomTipWrap.style.display = 'none';
          updatePageTipDisplay(parseFloat(val) || 5.00);
        }
      });
    });

    if (pageCustomTipInput) {
      pageCustomTipInput.addEventListener('input', () => {
        const val = parseFloat(pageCustomTipInput.value) || 0;
        if (val > 0) {
          updatePageTipDisplay(val);
        }
      });
    }

    if (btnOpenTipPix) {
      btnOpenTipPix.addEventListener('click', () => {
        let val = selectedPageTip;
        if (pageCustomTipWrap && pageCustomTipWrap.style.display !== 'none' && pageCustomTipInput) {
          const customVal = parseFloat(pageCustomTipInput.value) || 0;
          if (customVal > 0) val = customVal;
        }

        const orderInfo = {
          service: 'Caixinha de Apoio pro Guilherme 💈',
          amount: val,
          clientName: 'Cliente Amigo',
          dateBr: 'Hoje',
          time: 'Apoio voluntário',
          isPureTip: true,
          orderId: `BC-PIX-${Math.floor(1000 + Math.random() * 9000)}`
        };

        openCheckout(orderInfo);
      });
    }

    // Monthly Plan direct online payment trigger
    if (btnPlanOnline) {
      btnPlanOnline.addEventListener('click', (e) => {
        e.preventDefault();
        if (selectServico) selectServico.value = 'Plano mensal com corte e barba';
        if (radioOnline) radioOnline.checked = true;
        updateSubmitButton();

        let name = inputNome ? inputNome.value.trim() : '';
        if (!name) {
          name = prompt('Por favor, digite seu nome para o Plano Mensal:') || 'Cliente';
          if (inputNome) inputNome.value = name;
        }

        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();

        const orderInfo = {
          service: 'Plano mensal com corte e barba',
          amount: 100.00,
          clientName: name,
          dateBr: `${dd}/${mm}/${yyyy}`,
          time: 'A combinar',
          orderId: `BC-${Math.floor(10000 + Math.random() * 90000)}`
        };

        openCheckout(orderInfo);
      });
    }

    // Intercept Booking Form Submit
    if (form) {
      form.addEventListener('submit', (e) => {
        let hasError = false;
        const nome = inputNome ? inputNome.value.trim() : '';
        const servico = selectServico ? selectServico.value.trim() : '';
        const dataVal = inputData ? inputData.value.trim() : '';
        const horario = inputHorario ? inputHorario.value.trim() : '';

        [inputNome, selectServico, inputHorario].forEach(el => el && el.classList.remove('error'));

        if (!nome) { inputNome.classList.add('error'); hasError = true; }
        if (!servico) { selectServico.classList.add('error'); hasError = true; }
        if (!dataVal) { hasError = true; }
        if (!horario) { inputHorario.classList.add('error'); hasError = true; }

        if (hasError) {
          const firstErr = document.querySelector('.form-input.error, .form-select.error');
          if (firstErr) firstErr.focus();
          return;
        }

        const [year, month, day] = dataVal.split('-');
        const dataBr = `${day}/${month}/${year}`;
        const price = getSelectedPrice();
        const isOnline = radioOnline && radioOnline.checked;

        if (isOnline) {
          e.preventDefault();
          const orderInfo = {
            service: servico,
            amount: price,
            clientName: nome,
            dateBr: dataBr,
            time: horario,
            orderId: `BC-${Math.floor(10000 + Math.random() * 90000)}`
          };
          openCheckout(orderInfo);
        } else {
          // Local payment (presencial) -> Direct to WhatsApp
          e.preventDefault();
          const message = `Olá, Guilherme! Vim pelo site da Baro Cortes e gostaria de agendar:\nNome: ${nome}\nServiço: ${servico}\nDia: ${dataBr}\nHorário: ${horario}\nPagamento: Pix no atendimento\nEsse horário está disponível?`;
          const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
        }
      });
    }
  });
})();
