// Netlify Serverless Function: create-payment
// Baro Cortes - Barbearia do Guilherme

function crc16(data) {
  let crc = 0xFFFF;
  const bytes = Buffer.from(data, 'utf-8');
  for (let i = 0; i < bytes.length; i++) {
    crc ^= (bytes[i] << 8);
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

function buildPix(key, name, city, amount, txid = '***') {
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
    field('62', field('05', txid.slice(0, 25))) +
    '6304';

  const checksum = crc16(raw);
  return raw + checksum;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const service = data.service || 'Corte e barba';
    const amount = Number(data.amount) || 35.0;
    const clientName = data.clientName || 'Cliente';
    const orderId = `BC-${Math.floor(10000 + Math.random() * 90000)}`;

    const pixKey = process.env.BARO_PIX_KEY || '51524549800';
    const pixName = process.env.BARO_PIX_NAME || 'GUILHERME';
    const pixCity = process.env.BARO_PIX_CITY || 'SAO PAULO';

    const pixCode = buildPix(pixKey, pixName, pixCity, amount, '***');

    // Optional Mercado Pago Preference integration if MP_ACCESS_TOKEN is provided in Netlify
    let mpInitPoint = '';
    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (mpToken) {
      try {
        const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mpToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: [{
              title: `${service} - Baro Cortes`,
              quantity: 1,
              currency_id: 'BRL',
              unit_price: amount
            }],
            payer: { name: clientName },
            external_reference: orderId,
            back_urls: {
              success: 'https://barocortes.netlify.app/?status=approved'
            }
          })
        });
        const mpJson = await mpRes.json();
        mpInitPoint = mpJson.init_point || '';
      } catch (err) {
        console.error('MP preference error:', err);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        order_id: orderId,
        service,
        amount,
        client_name: clientName,
        pix_code: pixCode,
        mercadopago_init_point: mpInitPoint,
        status: 'pending',
        expires_in: 900
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
