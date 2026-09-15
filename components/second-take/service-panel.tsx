"use client";
import {useEffect, useState} from 'react';
import {Utensils, CalendarDays, Ticket, ShieldCheck, Check, ArrowRight, RotateCcw, Download, Pencil} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {services} from '@/lib/second-take/services';
import type {BookingDraft, ServicePlan, ReservationDetails, Reservation} from '@/lib/second-take/services';

export const serviceIcons = {restaurant: Utensils, appointment: CalendarDays, event: Ticket};
type PreviewDetails = ReservationDetails & {reservationId?: string; expectedVersion?: number};
const labels = {venue: 'Venue / provider', location: 'Location', date: 'Date', time: 'Time', timeZone: 'Time zone', people: 'People'};
function detailRows(d: ReservationDetails) {
  return Object.entries(labels).map(([key, label]) => [label, String(d[key as keyof typeof labels])]);
}
export function ServicePanel({draft, plan, busy, onPreview, onApprove, onEdit, onRevise, onRenewCancellation, onDiscard}: {
  draft?: BookingDraft; plan?: ServicePlan; busy: boolean;
  onPreview: (d: PreviewDetails) => void; onApprove: (p: ServicePlan) => void;
  onEdit: (id: string) => void; onRevise: (id: string) => void;
  onRenewCancellation: (id: string) => void; onDiscard: () => void;
}) {
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {const timer = setInterval(() => setClock(Date.now()), 10000); return () => clearInterval(timer);}, []);
  if (plan) {
    const Icon = serviceIcons[plan.details.service];
    const pending = ['awaiting_approval', 'approved'].includes(plan.status);
    const expired = pending && Date.parse(plan.expiresAt) <= clock;
    const changes = plan.before && plan.type === 'update'
      ? Object.entries(labels).filter(([key]) => plan.before![key as keyof typeof labels] !== plan.details[key as keyof typeof labels]) : [];
    return <div className="service-plan">
      <div className="service-type"><Icon size={24}/><span>{services[plan.details.service].label}</span><span className="simulation-tag">Simulated</span></div>
      <h3>{plan.status === 'completed' ? (plan.type === 'cancel' ? 'Your reservation is cancelled' : plan.type === 'update' ? 'Your changes are saved' : 'Your reservation is saved') : expired ? 'This preview has expired' : plan.type === 'cancel' ? 'Cancel this reservation?' : plan.type === 'update' ? 'Review your changes' : 'Review your reservation'}</h3>
      <p className="service-disclosure">This uses our sample service. No real restaurant, venue or appointment provider is contacted.</p>
      {changes.length > 0 && <div className="reservation-changes"><h4>What will change</h4>{changes.map(([key, label]) => <div key={key}><strong>{label}</strong><span>From {String(plan.before![key as keyof typeof labels])}</span><span>To {String(plan.details[key as keyof typeof labels])}</span></div>)}</div>}
      <dl className="reservation-details">{detailRows(plan.details).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      {plan.type === 'cancel' && pending && <p className="service-disclosure">This cancels only the reservation above. Calendar files you imported will need to be removed from your calendar yourself.</p>}
      {plan.status === 'completed' ? <div className="reservation-success"><Check size={19}/><div><strong>{plan.type === 'cancel' ? 'Simulated reservation cancelled' : plan.type === 'update' ? 'Simulated change saved' : 'Simulated reservation saved'}</strong><p>Recorded once. Repeating this execution will not duplicate it.</p></div></div>
        : expired ? <div className="resolution-box"><strong>Review a fresh preview before continuing.</strong><p>No reservation is changed by renewing a preview. You will approve the new details separately.</p><Button disabled={busy} onClick={() => plan.type === 'cancel' ? onRenewCancellation(plan.reservationId) : onRevise(plan.id)}><RotateCcw size={16}/>{plan.type === 'cancel' ? 'Refresh cancellation preview' : 'Review details again'}</Button></div>
        : pending ? <><Button className="full-width" disabled={busy} onClick={() => onApprove(plan)}><ShieldCheck size={16}/>{plan.type === 'cancel' ? 'Approve cancellation' : plan.type === 'update' ? 'Approve changes' : 'Approve simulated reservation'}</Button><p className="service-approval-note">Only this exact preview is authorized. Valid for 15 minutes from creation.</p>{plan.type !== 'cancel' && <Button variant="outline" className="full-width" disabled={busy} onClick={() => onRevise(plan.id)}><Pencil size={15}/>Edit these details</Button>}</>
        : <div className="resolution-box"><strong>{plan.status === 'conflict' ? 'A newer change needs your review' : 'This preview has been replaced'}</strong><p>{plan.error ?? 'Use the newest preview or start another reservation.'}</p>{plan.type !== 'create' && <Button variant="outline" disabled={busy} onClick={() => onEdit(plan.reservationId)}>Open current details</Button>}</div>}
      <p className="service-reference">Plan {plan.id.slice(0, 8)} · {expired ? 'expired' : plan.status.replaceAll('_', ' ')}{plan.approvedAt ? ' · approval recorded' : ''}</p>
    </div>;
  }
  if (draft) return <ServiceForm draft={draft} busy={busy} onPreview={onPreview} onDiscard={onDiscard}/>;
  return <div className="service-plan"><h3>Choose your next plan.</h3><p>Ask for a restaurant reservation, an appointment or an event. I’ll collect the details before preparing a simulated booking.</p></div>;
}
function ServiceForm({draft, busy, onPreview, onDiscard}: {draft: BookingDraft; busy: boolean; onPreview: (d: PreviewDetails) => void; onDiscard: () => void}) {
  const initial = () => ({venue: draft.venue ?? services[draft.service].name, location: draft.location ?? '', date: draft.date ?? '', time: draft.time ?? '', timeZone: draft.timeZone, people: String(draft.people ?? (draft.service === 'appointment' ? 1 : 2))});
  const [form, setForm] = useState(initial);
  useEffect(() => setForm(initial()), [draft]);
  const Icon = serviceIcons[draft.service];
  const field = (key: keyof typeof form, value: string) => setForm(s => ({...s, [key]: value}));
  return <form className="service-plan service-form" onSubmit={e => {e.preventDefault(); onPreview({...form, service: draft.service, people: Number(form.people), ...(draft.reservationId ? {reservationId: draft.reservationId, expectedVersion: draft.expectedVersion} : {})});}}>
    <div className="service-type"><Icon size={24}/><span>{services[draft.service].label}</span><span className="simulation-tag">Simulated</span></div>
    <h3>{draft.reservationId ? 'Change your reservation' : 'Let’s get the details.'}</h3>
    <p className="service-disclosure">Answer in the conversation or fill in this form. This is a simulated booking, not a reservation with a real provider.</p>
    <label>Venue / provider name<input required maxLength={100} value={form.venue} onChange={e => field('venue', e.target.value)}/></label>
    <label>City or area<input required maxLength={100} placeholder="For example, Jaipur" value={form.location} onChange={e => field('location', e.target.value)}/></label>
    <div className="service-form-row"><label>Date<input type="date" required value={form.date} onChange={e => field('date', e.target.value)}/></label><label>Time<input type="time" required value={form.time} onChange={e => field('time', e.target.value)}/></label></div>
    <div className="service-form-row"><label>People<input type="number" required min={1} max={services[draft.service].capacity} value={form.people} onChange={e => field('people', e.target.value)}/></label><label>Time zone<input required maxLength={80} value={form.timeZone} onChange={e => field('timeZone', e.target.value)}/></label></div>
    <p className="service-approval-note">Availability is simulated within your workspace. The preview checks the date, time and capacity.</p>
    <Button type="submit" className="full-width" disabled={busy}>Preview {draft.reservationId ? 'changes' : 'reservation'} <ArrowRight size={16}/></Button>
    <Button type="button" variant="ghost" className="full-width" disabled={busy} onClick={onDiscard}>Discard unfinished draft</Button>
  </form>;
}
export function ServiceReservationCard({reservation, busy, onEdit, onCancel, onCalendar}: {reservation: Reservation; busy: boolean; onEdit: () => void; onCancel: () => void; onCalendar: () => void}) {
  const Icon = serviceIcons[reservation.service];
  return <div className="record-card service-record"><div className="flex-between"><Icon size={18}/><span className="simulation-tag">Simulated</span></div><h4>{reservation.venue}</h4><p>{reservation.location}<br/>{reservation.date} · {reservation.time}<br/>{reservation.timeZone}<br/>{reservation.people} {reservation.people === 1 ? 'person' : 'people'}</p><div className="record-buttons"><Button size="sm" variant="ghost" disabled={busy} onClick={onEdit}>Change</Button><Button size="sm" variant="ghost" disabled={busy} onClick={onCancel}><RotateCcw size={13}/>Cancel</Button><Button size="sm" variant="ghost" onClick={onCalendar}><Download size={13}/>Calendar file</Button></div><p className="calendar-snapshot-note">Calendar download is a demo snapshot. Changes do not sync.</p></div>;
}
