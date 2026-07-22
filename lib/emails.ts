import { Resend } from 'resend';
import { createEvent, EventAttributes } from 'ics';

// Pomocná funkce pro bezpečné získání Resend instance až ve chvíli volání
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Chybí RESEND_API_KEY v proměnných prostředí (.env.local).');
  }
  return new Resend(apiKey);
}

interface ReservationEmailProps {
  customerEmail: string;
  customerName: string;
  trainerEmails: string[]; // Přijímáme pole e-mailů trenérů
  trainerName: string;
  startTime: Date;
  endTime: Date;
  serviceName: string;
}

// Pomocná funkce pro sestavení odkazu do Google Kalendáře bez UTC posunu
function getGoogleCalendarUrl(title: string, start: Date, end: Date, description: string) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const formatGCalDate = (d: Date) => {
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
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
async function generateIcsBuffer(title: string, start: Date, end: Date, description: string): Promise<Buffer> {
  const event: EventAttributes = {
    start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
    end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
    title: title,
    description: description,
    location: 'EMS Znojmo',
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
  };

  return new Promise((resolve, reject) => {
    createEvent(event, (error, value) => {
      if (error) reject(error);
      resolve(Buffer.from(value));
    });
  });
}

export async function sendReservationEmails({
  customerEmail,
  customerName,
  trainerEmails,
  trainerName,
  startTime,
  endTime,
  serviceName,
}: ReservationEmailProps) {
  // Inicializujeme klienta až při odesílání
  const resend = getResendClient();

  const formattedDate = startTime.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  const formattedTime = `${startTime.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })} – ${endTime.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`;

  const title = `EMS Trénink: ${serviceName}`;
  const description = `Rezervace EMS tréninku v EMS Znojmo.\nKlient: ${customerName}\nTrenér: ${trainerName}`;

  const googleCalUrl = getGoogleCalendarUrl(title, startTime, endTime, description);
  const icsBuffer = await generateIcsBuffer(title, startTime, endTime, description);

  // HTML Šablona pro Klienta
  const customerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;">
      <h2 style="color: #059669; margin-top: 0;">Potvrzení rezervace – EMS Znojmo</h2>
      <p>Ahoj <strong>${customerName}</strong>,</p>
      <p>tvoje rezervace byla úspěšně vytvořena!</p>
      
      <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
        <p style="margin: 4px 0;"><strong>Služba:</strong> ${serviceName}</p>
        <p style="margin: 4px 0;"><strong>Datum:</strong> ${formattedDate}</p>
        <p style="margin: 4px 0;"><strong>Čas:</strong> ${formattedTime}</p>
        <p style="margin: 4px 0;"><strong>Trenér:</strong> ${trainerName}</p>
      </div>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${googleCalUrl}" target="_blank" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          📅 Přidat do Google Kalendáře
        </a>
      </div>

      <p style="font-size: 0.85em; color: #6b7280; text-align: center;">
        V příloze tohoto e-mailu najdeš také soubor <code>.ics</code> pro Apple Kalendář nebo Outlook.
      </p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="margin-bottom: 0;">Těšíme se na tebe!<br><strong>Tým EMS Znojmo</strong></p>
    </div>
  `;

  // HTML Šablona pro Trenéra / Trenéry
  const trainerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; color: #1f2937;">
      <h2 style="color: #2563eb; margin-top: 0;">Nová rezervace / žádost o trénink! 🏋️‍♂️</h2>
      <p>Ahoj,</p>
      <p>máš novou rezervaci/žádost od klienta <strong>${customerName}</strong>.</p>
      
      <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 4px 0;"><strong>Služba:</strong> ${serviceName}</p>
        <p style="margin: 4px 0;"><strong>Datum:</strong> ${formattedDate}</p>
        <p style="margin: 4px 0;"><strong>Čas:</strong> ${formattedTime}</p>
        <p style="margin: 4px 0;"><strong>Klient:</strong> ${customerName} (${customerEmail})</p>
        <p style="margin: 4px 0;"><strong>Vybraný trenér:</strong> ${trainerName}</p>
      </div>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${googleCalUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          📅 Přidat do svého Kalendáře
        </a>
      </div>
    </div>
  `;

  // Pole asynchronních operací pro odeslání
  const emailPromises: Promise<any>[] = [
    // 1. E-mail klientovi
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
    }),
  ];

  // 2. E-mail trenérům (odesílá se pouze, pokud seznam obsahuje alespoň jednu adresu)
  if (trainerEmails && trainerEmails.length > 0) {
    emailPromises.push(
      resend.emails.send({
        from: 'EMS Znojmo <registrace@emsznojmo.cz>',
        to: trainerEmails, // Resend akceptuje pole e-mailových adres
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

  // Odeslání všech e-mailů paralelně
  await Promise.all(emailPromises);
}