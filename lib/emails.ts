import { Resend } from 'resend';
import { createEvent, EventAttributes } from 'ics';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Chybí RESEND_API_KEY v proměnných prostředí (.env.local).'
    );
  }

  return new Resend(apiKey);
}

interface ReservationEmailProps {
  customerEmail: string;
  customerName: string;
  trainerEmails: string[];
  trainerName: string;
  startTime: Date;
  endTime: Date;
  serviceName: string;
}

interface CancellationEmailProps {
  customerEmail: string;
  customerName: string;
  trainerEmails: string[];
  trainerName: string;
  startTime: Date;
  endTime: Date;
  serviceName: string;
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(date: Date) {
  return date.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getGoogleCalendarUrl(
  title: string,
  start: Date,
  end: Date,
  description: string
) {
  const pad = (n: number) => String(n).padStart(2, '0');

  const formatGCalDate = (d: Date) => {
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(
      d.getDate()
    )}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatGCalDate(start)}/${formatGCalDate(end)}`,
    details: description,
    location: 'EMS Znojmo',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

async function generateIcsBuffer(
  title: string,
  start: Date,
  end: Date,
  description: string
): Promise<Buffer> {
  const event: EventAttributes = {
    start: [
      start.getFullYear(),
      start.getMonth() + 1,
      start.getDate(),
      start.getHours(),
      start.getMinutes(),
    ],
    end: [
      end.getFullYear(),
      end.getMonth() + 1,
      end.getDate(),
      end.getHours(),
      end.getMinutes(),
    ],
    title,
    description,
    location: 'EMS Znojmo',
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
  };

  return new Promise((resolve, reject) => {
    createEvent(event, (error, value) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(Buffer.from(value));
    });
  });
}

/**
 * NOVÁ REZERVACE
 */
export async function sendReservationEmails({
  customerEmail,
  customerName,
  trainerEmails,
  trainerName,
  startTime,
  endTime,
  serviceName,
}: ReservationEmailProps) {
  const resend = getResendClient();

  const formattedDate = formatDate(startTime);
  const formattedTime = `${formatTime(startTime)} – ${formatTime(endTime)}`;

  const title = `EMS Trénink: ${serviceName}`;

  const description =
    `Rezervace EMS tréninku v EMS Znojmo.\n` +
    `Klient: ${customerName}\n` +
    `Trenér: ${trainerName}`;

  const googleCalUrl = getGoogleCalendarUrl(
    title,
    startTime,
    endTime,
    description
  );

  const icsBuffer = await generateIcsBuffer(
    title,
    startTime,
    endTime,
    description
  );

  const customerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;color:#1f2937;">
      <h2 style="color:#059669;">Potvrzení rezervace – EMS Znojmo</h2>

      <p>Ahoj <strong>${escapeHtml(customerName)}</strong>,</p>
      <p>tvoje rezervace byla úspěšně vytvořena.</p>

      <div style="background:#f9fafb;padding:16px;border-radius:8px;border-left:4px solid #059669;margin:20px 0;">
        <p><strong>Služba:</strong> ${escapeHtml(serviceName)}</p>
        <p><strong>Datum:</strong> ${escapeHtml(formattedDate)}</p>
        <p><strong>Čas:</strong> ${escapeHtml(formattedTime)}</p>
        <p><strong>Trenér:</strong> ${escapeHtml(trainerName)}</p>
      </div>

      <div style="text-align:center;margin:25px 0;">
        <a
          href="${googleCalUrl}"
          target="_blank"
          style="background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;"
        >
          📅 Přidat do Google Kalendáře
        </a>
      </div>

      <p style="color:#6b7280;font-size:14px;text-align:center;">
        V příloze je také kalendářový soubor .ics.
      </p>

      <hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0;">

      <p>
        Těšíme se na tebe!<br>
        <strong>Tým EMS Znojmo</strong>
      </p>
    </div>
  `;

  const trainerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;color:#1f2937;">
      <h2 style="color:#2563eb;">Nová rezervace 🏋️‍♂️</h2>

      <p>Ahoj,</p>

      <p>
        klient <strong>${escapeHtml(customerName)}</strong>
        vytvořil novou rezervaci.
      </p>

      <div style="background:#eff6ff;padding:16px;border-radius:8px;border-left:4px solid #2563eb;margin:20px 0;">
        <p><strong>Služba:</strong> ${escapeHtml(serviceName)}</p>
        <p><strong>Datum:</strong> ${escapeHtml(formattedDate)}</p>
        <p><strong>Čas:</strong> ${escapeHtml(formattedTime)}</p>
        <p><strong>Klient:</strong> ${escapeHtml(customerName)} (${escapeHtml(customerEmail)})</p>
        <p><strong>Trenér:</strong> ${escapeHtml(trainerName)}</p>
      </div>
    </div>
  `;

  const promises: Promise<any>[] = [];

  if (customerEmail) {
    promises.push(
      resend.emails.send({
        from: 'EMS Znojmo <registrace@emsznojmo.cz>',
        to: [customerEmail],
        subject: `Potvrzení rezervace: ${serviceName} – ${formattedDate}`,
        html: customerHtml,
        attachments: [
          {
            filename: 'rezervace-ems.ics',
            content: icsBuffer,
          },
        ],
      })
    );
  }

  for (const trainerEmail of trainerEmails || []) {
    if (!trainerEmail) continue;

    promises.push(
      resend.emails.send({
        from: 'EMS Znojmo <registrace@emsznojmo.cz>',
        to: [trainerEmail],
        subject: `Nová rezervace: ${customerName} – ${formattedDate}`,
        html: trainerHtml,
        attachments: [
          {
            filename: 'rezervace-ems.ics',
            content: icsBuffer,
          },
        ],
      })
    );
  }

  await Promise.all(promises);
}

/**
 * ZRUŠENÍ REZERVACE
 */
export async function sendReservationCancellationEmails({
  customerEmail,
  customerName,
  trainerEmails,
  trainerName,
  startTime,
  endTime,
  serviceName,
}: CancellationEmailProps) {
  const resend = getResendClient();

  const formattedDate = formatDate(startTime);
  const formattedTime = `${formatTime(startTime)} – ${formatTime(endTime)}`;

  const promises: Promise<any>[] = [];

  // -----------------------------------------
  // EMAIL UŽIVATELI
  // -----------------------------------------

  if (customerEmail) {
    const customerHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;color:#1f2937;">
        <h2 style="color:#dc2626;margin-top:0;">
          Rezervace byla zrušena
        </h2>

        <p>
          Ahoj <strong>${escapeHtml(customerName)}</strong>,
        </p>

        <p>
          tvoje rezervace byla úspěšně zrušena.
        </p>

        <div style="background:#fef2f2;padding:16px;border-radius:8px;border-left:4px solid #dc2626;margin:20px 0;">
          <p><strong>Služba:</strong> ${escapeHtml(serviceName)}</p>
          <p><strong>Datum:</strong> ${escapeHtml(formattedDate)}</p>
          <p><strong>Čas:</strong> ${escapeHtml(formattedTime)}</p>
          <p><strong>Trenér:</strong> ${escapeHtml(trainerName)}</p>
        </div>

        <p>
          Kredit za tuto rezervaci byl vrácen zpět na tvůj účet.
        </p>

        <hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0;">

        <p>
          S pozdravem<br>
          <strong>Tým EMS Znojmo</strong>
        </p>
      </div>
    `;

    promises.push(
      resend.emails.send({
        from: 'EMS Znojmo <registrace@emsznojmo.cz>',
        to: [customerEmail],
        subject: `Zrušení rezervace: ${serviceName} – ${formattedDate}`,
        html: customerHtml,
      })
    );
  }

  // -----------------------------------------
  // EMAIL TRENÉRŮM
  // KAŽDÝ TRENÉR DOSTANE VLASTNÍ EMAIL
  // -----------------------------------------

  for (const trainerEmail of trainerEmails || []) {
    if (!trainerEmail) continue;

    const trainerHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;color:#1f2937;">
        <h2 style="color:#dc2626;margin-top:0;">
          Rezervace byla zrušena
        </h2>

        <p>Ahoj,</p>

        <p>
          rezervace klienta
          <strong>${escapeHtml(customerName)}</strong>
          byla zrušena.
        </p>

        <div style="background:#fef2f2;padding:16px;border-radius:8px;border-left:4px solid #dc2626;margin:20px 0;">
          <p><strong>Služba:</strong> ${escapeHtml(serviceName)}</p>
          <p><strong>Datum:</strong> ${escapeHtml(formattedDate)}</p>
          <p><strong>Čas:</strong> ${escapeHtml(formattedTime)}</p>
          <p><strong>Klient:</strong> ${escapeHtml(customerName)}</p>
          <p><strong>E-mail klienta:</strong> ${escapeHtml(customerEmail)}</p>
          <p><strong>Trenér:</strong> ${escapeHtml(trainerName)}</p>
        </div>

        <p>
          Tento termín je nyní opět volný.
        </p>

        <hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0;">

        <p>
          <strong>EMS Znojmo</strong>
        </p>
      </div>
    `;

    promises.push(
      resend.emails.send({
        from: 'EMS Znojmo <registrace@emsznojmo.cz>',
        to: [trainerEmail],
        subject: `Zrušená rezervace: ${customerName} – ${formattedDate}`,
        html: trainerHtml,
      })
    );
  }

  await Promise.all(promises);
}