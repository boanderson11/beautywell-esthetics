'use client';

// Client component for the Apple/Google calendar export buttons on the booking
// success page. Pulled out of BookingForm.tsx so it can be reused after the
// Stripe redirect.

type Props = {
  serviceName: string;
  serviceDuration: string | null;
  date: string;
  time: string;
  totalCents: number;
  depositCents: number;
};

function buildEventTimes(date: string, time: string, durationStr: string | null) {
  const [timePart, meridiem] = time.split(' ');
  const [hoursRaw, minutes] = timePart.split(':').map(Number);
  let hours = hoursRaw;
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  const durationMins = durationStr?.includes('45') ? 45 : 60;

  const [y, m, d] = date.split('-').map(Number);
  const start = new Date(y, m - 1, d, hours, minutes, 0, 0);
  const end = new Date(start.getTime() + durationMins * 60 * 1000);

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return { start: fmt(start), end: fmt(end) };
}

export default function BookingCalendarExports(props: Props) {
  const { serviceName, serviceDuration, date, time, totalCents, depositCents } = props;
  const totalDollars = (totalCents / 100).toFixed(2);
  const depositDollars = (depositCents / 100).toFixed(2);

  const buildGoogleCalUrl = () => {
    const { start, end } = buildEventTimes(date, time, serviceDuration);
    if (!start) return '#';
    const title = encodeURIComponent(`Beautywell Esthetics – ${serviceName}`);
    const details = encodeURIComponent(
      `Your appointment at Beautywell Esthetics in Cypress, CA.\n\nService: ${serviceName}\nTotal: $${totalDollars} (deposit paid: $${depositDollars})`,
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  };

  const downloadICS = () => {
    const { start, end } = buildEventTimes(date, time, serviceDuration);
    if (!start) return;
    const title = `Beautywell Esthetics – ${serviceName}`;
    const description = `Your appointment at Beautywell Esthetics in Cypress, CA.\\nService: ${serviceName}\\nTotal: $${totalDollars} (deposit paid: $${depositDollars})`;
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Beautywell Esthetics//Booking//EN',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Beautywell appointment in 1 hour',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'beautywell-appointment.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
      <button
        type="button"
        className="booking-btn back"
        style={{ padding: '12px 20px', fontSize: 11 }}
        onClick={downloadICS}
      >
        🍎 Add to Apple Calendar
      </button>
      <a
        className="booking-btn back"
        style={{ padding: '12px 20px', fontSize: 11, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
        href={buildGoogleCalUrl()}
        target="_blank"
        rel="noopener noreferrer"
      >
        📅 Add to Google Calendar
      </a>
    </div>
  );
}
