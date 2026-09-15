"use client";
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
const examples = [
  {title: 'Restaurant', request: 'Book a restaurant in Jaipur tomorrow at 7 pm for 2 people', detail: 'A table in the simulated restaurant service. Up to 12 people.'},
  {title: 'Appointment', request: 'Book an appointment in Jaipur tomorrow at 10 am', detail: 'One person per appointment in the simulated service.'},
  {title: 'Event', request: 'Book an event in Jaipur tomorrow at 8 pm for 3 people', detail: 'Up to 12 places in the simulated event service.'},
  {title: 'Workshop', request: 'Book two places in the photography workshop, reserve a camera, and add it to my calendar.', detail: 'Linked workshop, camera and calendar actions with selective recovery.'},
];
export function RequestGuide({open, onOpenChange, onChoose, busy}: {open: boolean; onOpenChange: (v: boolean) => void; onChoose: (text: string) => void; busy: boolean}) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="request-guide"><DialogHeader><DialogTitle>What can I plan?</DialogTitle><DialogDescription>Four sample services. Saved actions, with a preview before every booking or change.</DialogDescription></DialogHeader><div className="request-guide-scroll">{examples.map(example => <section key={example.title}><h3>{example.title}</h3><p>{example.detail}</p><Button variant="outline" disabled={busy} onClick={() => {onChoose(example.request); onOpenChange(false);}}>Try {example.title.toLowerCase()}</Button></section>)}<section><h3>Change your mind</h3><p>For a reservation, try “make it four people” or “tomorrow at 8 pm”. If you have several reservations, select Change or Cancel on the exact card. You can always use the form.</p></section><section><h3>What to expect</h3><p>This is a guided conversation, so some wording needs clarification. No real businesses are contacted. Payments, travel bookings and external messages are not connected.</p><a className="text-link" href="/demo">Explore the recovery stories →</a></section></div></DialogContent></Dialog>;
}
