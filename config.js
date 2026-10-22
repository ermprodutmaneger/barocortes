// Configurações de Pagamento e Atendimento da Baro Cortes
// Barbearia do Guilherme

window.BARO_CONFIG = {
  // Telefone e WhatsApp oficial da barbearia
  barberPhone: '5511948652519',

  // Chave Pix oficial do Guilherme (CPF cadastrado no Mercado Pago)
  pixKey: '51524549800',
  pixKeyFormatted: '515.245.498-00',
  pixKeyType: 'CPF',
  pixReceiverName: 'GUILHERME',
  pixBank: 'Mercado Pago',
  pixCity: 'SAO PAULO',

  // Ativação de pagamento online opcional
  enableOnlinePayment: true,

  // Se tiver conta no Mercado Pago, pode colocar sua Public Key aqui para checkout transparente:
  mercadoPagoPublicKey: '',

  // Tabela oficial de preços (em Reais)
  services: {
    'Corte com sobrancelha inclusa': 30.00,
    'Corte e barba': 35.00,
    'Sobrancelha avulsa': 5.00,
    'Corte com alisante': 50.00,
    'Corte com luzes': 60.00,
    'Barba avulsa': 10.00,
    'Plano mensal com corte e barba': 100.00
  }
};
