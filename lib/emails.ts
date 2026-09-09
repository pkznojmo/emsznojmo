import { Resend } from 'resend';
import { createEvent, EventAttributes } from 'ics';

// Pomocná funkce pro bezpečné získání Resend instance až při volání
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
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Pomocná funkce pro Google Kalendář
function getGoogleCalendarUrl(
  title: string,
  start: Date,
  end: Date,
  description: string
) {
  const pad = (n: number) => n.toString().padStart(2, '0');

  const formatGCalDate = (d: Date) => {
    return `${d.getFullYear()}${pad(
      d.getMonth() + 1
    )}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
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

// Generování .ics souboru pro Apple/Outlook
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
 * EMAILY PRO NOVOU REZERVACI
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

  const safeCustomerName = escapeHtml(customerName);
  const safeTrainerName = escapeHtml(trainerName);
  const safeServiceName = escapeHtml(serviceName);

  const formattedDate = startTime.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = `${startTime.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  })} – ${endTime.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

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

  // -----------------------------------------
  // EMAIL KLIENTOVI
  // -----------------------------------------

  const customerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;">
      <h2 style="color: #059669; margin-top: 0;">
        Potvrzení rezervace – EMS Znojmo
      </h2>

      <p>Ahoj <strong>${safeCustomerName}</strong>,</p>

      <p>
        tvoje rezervace byla úspěšně vytvořena!
      </p>

      <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
        <p style="margin: 4px 0;">
          <strong>Služba:</strong> ${safeServiceName}
        </p>

        <p style="margin: 4px 0;">
          <strong>Datum:</strong> ${escapeHtml(formattedDate)}
        </p>

        <p style="margin: 4px 0;">
          <strong>Čas:</strong> ${escapeHtml(formattedTime)}
        </p>

        <p style="margin: 4px 0;">
          <strong>Trenér:</strong> ${safeTrainerName}
        </p>
      </div>

      <div style="margin: 28px 0; text-align: center;">
        <a
          href="${googleCalUrl}"
          target="_blank"
          style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;"
        >
          📅 Přidat do Google Kalendáře
        </a>
      </div>

      <p style="font-size: 0.85em; color: #6b7280; text-align: center;">
        V příloze tohoto e-mailu najdeš také soubor <code>.ics</code>
        pro Apple Kalendář nebo Outlook.
      </p>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

      <p style="margin-bottom: 0;">
        Těšíme se na tebe!<br>
        <strong>Tým EMS Znojmo</strong>
      </p>
    </div>
  `;

  // -----------------------------------------
  // EMAIL TRENÉRŮM
  // -----------------------------------------

  const trainerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;">
      <h2 style="color: #2563eb; margin-top: 0;">
        Nová rezervace 🏋️‍♂️
      </h2>

      <p>Ahoj,</p>

      <p>
        klient <strong>${safeCustomerName}</strong>
        vytvořil novou rezervaci.
      </p>

      <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 4px 0;">
          <strong>Služba:</strong> ${safeServiceName}
        </p>

        <p style="margin: 4px 0;">
          <strong>Datum:</strong> ${escapeHtml(formattedDate)}
        </p>

        <p style="margin: 4px 0;">
          <strong>Čas:</strong> ${escapeHtml(formattedTime)}
        </p>

        <p style="margin: 4px 0;">
          <strong>Klient:</strong>
          ${safeCustomerName} (${escapeHtml(customerEmail)})
        </p>

        <p style="margin: 4px 0;">
          <strong>Trenér:</strong> ${safeTrainerName}
        </p>
      </div>

      <div style="margin: 28px 0; text-align: center;">
        <a
          href="${googleCalUrl}"
          target="_blank"
          style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;"
        >
          📅 Přidat do svého Kalendáře
        </a>
      </div>
    </div>
  `;

  const emailPromises: Promise<any>[] = [];

  // E-mail klientovi
  emailPromises.push(
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

  // Každému trenérovi vlastní e-mail
  if (trainerEmails && trainerEmails.length > 0) {
    for (const trainerEmail of trainerEmails) {
      emailPromises.push(
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
  }

  await Promise.all(emailPromises);
}

/**
 * EMAILY PRO ZRUŠENÍ REZERVACE
 *
 * 1x klient
 * 1x každý trenér
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

  const safeCustomerName = escapeHtml(customerName);
  const safeTrainerName = escapeHtml(trainerName);
  const safeServiceName = escapeHtml(serviceName);

  const formattedDate = startTime.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = `${startTime.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  })} – ${endTime.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  // -----------------------------------------
  // EMAIL KLIENTOVI
  // -----------------------------------------

  const customerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;">
      <h2 style="color: #dc2626; margin-top: 0;">
        Rezervace byla zrušena
      </h2>

      <p>Ahoj <strong>${safeCustomerName}</strong>,</p>

      <p>
        tvoje rezervace byla úspěšně zrušena.
      </p>

      <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <p style="margin: 4px 0;">
          <strong>Služba:</strong> ${safeServiceName}
        </p>

        <p style="margin: 4px 0;">
          <strong>Datum:</strong> ${escapeHtml(formattedDate)}
        </p>

        <p style="margin: 4px 0;">
          <strong>Čas:</strong> ${escapeHtml(formattedTime)}
        </p>

        <p style="margin: 4px 0;">
          <strong>Trenér:</strong> ${safeTrainerName}
        </p>
      </div>

      <p>
        Kredit za rezervaci byl vrácen zpět na tvůj účet.
      </p>

      <p>
        Pokud budeš chtít, můžeš si vytvořit novou rezervaci.
      </p>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

      <p style="margin-bottom: 0;">
        S pozdravem<br>
        <strong>Tým EMS Znojmo</strong>
      </p>
    </div>
  `;

  // -----------------------------------------
  // EMAIL TRENÉRŮM
  // -----------------------------------------

  const trainerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;">
      <h2 style="color: #dc2626; margin-top: 0;">
        Rezervace byla zrušena
      </h2>

      <p>Ahoj,</p>

      <p>
        rezervace klienta
        <strong>${safeCustomerName}</strong>
        byla zrušena.
      </p>

      <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <p style="margin: 4px 0;">
          <strong>Služba:</strong> ${safeServiceName}
        </p>

        <p style="margin: 4px 0;">
          <strong>Datum:</strong> ${escapeHtml(formattedDate)}
        </p>

        <p style="margin: 4px 0;">
          <strong>Čas:</strong> ${escapeHtml(formattedTime)}
        </p>

        <p style="margin: 4px 0;">
          <strong>Klient:</strong>
          ${safeCustomerName} (${escapeHtml(customerEmail)})
        </p>

        <p style="margin: 4px 0;">
          <strong>Trenér:</strong> ${safeTrainerName}
        </p>
      </div>

      <p>
        Termín je nyní opět volný.
      </p>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

      <p style="margin-bottom: 0;">
        <strong>EMS Znojmo</strong>
      </p>
    </div>
  `;

  const emailPromises: Promise<any>[] = [];

  // 1. E-mail klientovi
  emailPromises.push(
    resend.emails.send({
      from: 'EMS Znojmo <registrace@emsznojmo.cz>',
      to: [customerEmail],
      subject: `Zrušení rezervace: ${serviceName} – ${formattedDate}`,
      html: customerHtml,
    })
  );

  // 2. Samostatný e-mail každému trenérovi
  if (trainerEmails && trainerEmails.length > 0) {
    for (const trainerEmail of trainerEmails) {
      emailPromises.push(
        resend.emails.send({
          from: 'EMS Znojmo <registrace@emsznojmo.cz>',
          to: [trainerEmail],
          subject: `Zrušená rezervace: ${customerName} – ${formattedDate}`,
          html: trainerHtml,
        })
      );
    }
  }

  await Promise.all(emailPromises);
}