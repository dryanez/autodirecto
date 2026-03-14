import { Resend } from 'resend';

const resend = new Resend('re_ADBAANdB_841RWx1tDi2qWgDww6mnBucn');

const clientHtml = `
<div style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;">
  <div style="background:#171719;padding:28px;text-align:center;border-radius:12px 12px 0 0;">
    <img src="https://mrcar-cotizacion.vercel.app/static/logo-rounded.png"
         alt="Auto Directo" style="width:80px;height:80px;border-radius:50%;object-fit:contain;padding:8px;background:#fff;">
    <h2 style="color:#f86120;margin:14px 0 4px;">Auto Directo</h2>
    <p style="color:#aaa;margin:0;font-size:13px;">autodirecto.cl</p>
  </div>

  <div style="background:#fff;border:1px solid #eee;padding:32px;border-radius:0 0 12px 12px;">
    <h2 style="color:#1a202c;margin-top:0;">✅ ¡Tu cita está confirmada, Felipe!</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;">
      Hemos registrado tu inspección gratuita con éxito.
      Aquí tienes el resumen de tu cita:
    </p>

    <div style="background:#f9f9f9;border-radius:10px;padding:20px;margin:24px 0;">
      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        <tr>
          <td style="padding:10px 8px;color:#888;width:35%;">📅 Fecha</td>
          <td style="padding:10px 8px;font-weight:700;color:#f86120;font-size:18px;">2026-03-15</td>
        </tr>
        <tr style="border-top:1px solid #eee;">
          <td style="padding:10px 8px;color:#888;">🕐 Hora</td>
          <td style="padding:10px 8px;font-weight:700;color:#f86120;font-size:18px;">10:30 hrs</td>
        </tr>
        <tr style="border-top:1px solid #eee;">
          <td style="padding:10px 8px;color:#888;">🚗 Vehículo</td>
          <td style="padding:10px 8px;font-weight:600;">Toyota Corolla (2020)</td>
        </tr>
        <tr style="border-top:1px solid #eee;">
          <td style="padding:10px 8px;color:#888;">🔖 Patente</td>
          <td style="padding:10px 8px;font-weight:600;">ABCD12</td>
        </tr>
        <tr style="border-top:1px solid #eee;">
          <td style="padding:10px 8px;color:#888;">📍 Lugar</td>
          <td style="padding:10px 8px;font-weight:600;">Viña del Mar, Región de Valparaíso</td>
        </tr>
      </table>
    </div>

    <div style="background:#fff8f5;border-left:4px solid #f86120;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
        📞 <strong>¿Qué sigue?</strong><br>
        Un ejecutivo de Auto Directo se comunicará contigo al
        <strong>+56 9 4044 1470</strong> dentro de las próximas
        <strong>24 horas</strong> para confirmar los detalles de la visita.
      </p>
    </div>

    <p style="font-size:13px;color:#888;line-height:1.6;">
      ¿Tienes alguna duda? Escríbenos por WhatsApp al
      <a href="https://wa.me/56940441470" style="color:#f86120;text-decoration:none;">+56 9 4044 1470</a>
      o responde este correo.
    </p>
  </div>

  <div style="text-align:center;padding:20px;">
    <a href="https://autodirecto.cl" style="color:#f86120;font-size:12px;text-decoration:none;">autodirecto.cl</a>
    <span style="color:#ccc;margin:0 8px;">·</span>
    <span style="color:#aaa;font-size:12px;">Wiackowska Group SpA</span>
  </div>
</div>`;

try {
    const result = await resend.emails.send({
        from:    'Auto Directo <contacto@autodirecto.cl>',
        to:      ['dr.felipeyanez@gmail.com'],
        subject: '✅ [TEST] Cita confirmada — 15 marzo 2026 a las 10:30 hrs',
        html:    clientHtml,
    });
    console.log('✅ Email sent successfully!', JSON.stringify(result, null, 2));
} catch (err) {
    console.error('❌ Resend error:', err.message, err);
}
