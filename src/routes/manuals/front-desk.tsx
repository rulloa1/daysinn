import { StaffOnly } from "@/components/staff-only";
import { createFileRoute } from "@tanstack/react-router";

import {
  Bullets,
  Callout,
  ManualShell,
  ManualTable,
  QuickRef,
  Section,
  StatusName,
  Steps,
} from "@/components/manuals/manual-kit";

export const Route = createFileRoute("/manuals/front-desk")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Front Desk Training Manual — Days Inn Guest Hub" },
      {
        name: "description",
        content:
          "How to run the board, sell rooms from live status, work the request queue and hand over a clean shift on the Guest Hub ops portal.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FrontDeskManual,
});

const CARDS: [string, string][] = [
  [
    "Occupancy",
    "Rooms sold against rooms available right now. Compared with the same weekday, not yesterday.",
  ],
  ["Ready to sell", "Turned and inspected. This is the number you can promise a walk-in."],
  [
    "Avg turnover",
    "How long a departure room is taking to turn today, against the 45-minute target.",
  ],
  ["Open requests", "Guest and staff requests not yet closed, with today's average response time."],
];

const STATUSES: { name: string; color: string; owner: string; action: string }[] = [
  {
    name: "Vacant dirty",
    color: "#B45309",
    owner: "Falls here at check-out",
    action: "Cannot be sold. Prioritise it if a guest is arriving.",
  },
  {
    name: "Vacant clean",
    color: "#0F7B4F",
    owner: "Housekeeping",
    action: "Sell it. This is your inventory.",
  },
  {
    name: "Occupied",
    color: "#0065AB",
    owner: "You, at check-in",
    action: "Nothing until check-out. Stayover service is on the route.",
  },
  {
    name: "Occupied / DND",
    color: "#7C3AED",
    owner: "Guest or housekeeping",
    action: "Call the guest if service is needed. Do not send anyone up.",
  },
  {
    name: "Reserved / arriving",
    color: "#0E7490",
    owner: "You, when you assign",
    action: "Held for a named guest today. Do not sell it to someone else.",
  },
  {
    name: "Out of order",
    color: "#B91C1C",
    owner: "Maintenance or manager",
    action: "Off sale until cleared. Never override to fill a night.",
  },
];

const REQUEST_TYPES: [string, string, string][] = [
  ["Fresh towels & linens", "Housekeeping on shift", "20 minutes"],
  ["Housekeeping refresh", "Housekeeping route", "Same day, guest picks window"],
  [
    "Maintenance & repairs",
    "Maintenance, manager if urgent",
    "Acknowledge 10 min, on site same day",
  ],
  ["Late checkout", "Front desk — you decide", "Answer immediately"],
  ["Anything else", "Front desk, reassign as needed", "Acknowledge 10 minutes"],
];

const GUEST_CASES: [string, string][] = [
  [
    "Room is not ready at 3:00 PM",
    "Apologise once, give a realistic time from the board, take a mobile number, offer the lobby and breakfast area. Message them the moment it flips to ready.",
  ],
  [
    "Walk-in with no rooms ready",
    "Quote only ready rooms. If there are none, say so plainly and offer to call the next property rather than selling a room you cannot deliver.",
  ],
  [
    "Complaint about the room",
    "Offer a move to the same room type first — it is faster than any repair. Log a maintenance request either way so the next guest does not meet the same problem.",
  ],
  [
    "Guest asks for a rate change or refund",
    "Do not quote a figure. Log it, tell them a manager will confirm, and give a time you know the manager is on site.",
  ],
  [
    "Guest reports something unsafe",
    "Take the room off sale as out of order, move the guest, then call the manager. In that order.",
  ],
  [
    "Guest cannot sign in to Guest Hub",
    "Check the room number and last name match the folio. If they still cannot, take the request at the desk and log it for them.",
  ],
  [
    "Guest is aggressive or intoxicated",
    "Do not argue and do not leave the desk unattended. Call the manager; call police if anyone is at risk.",
  ],
];

const QUICK_REF = [
  { label: "Front desk", value: "(352) 748-7766" },
  { label: "Guest Wi-Fi", value: "Days Inn · password Sunshine" },
  { label: "Check-in / check-out", value: "3:00 PM / 11:00 AM" },
  { label: "Late checkout", value: "Until 1:00 PM, front desk approves" },
  { label: "Minimum check-in age", value: "21 with photo ID and credit card" },
  { label: "Request acknowledgement target", value: "10 minutes" },
  { label: "Towel request target", value: "20 minutes" },
  { label: "Room turn target", value: "45 minutes" },
];

function FrontDeskManualContent() {
  return (
    <ManualShell
      runningHead="Front Desk Training Manual"
      title="Front Desk Training Manual"
      intro="How to run the board, sell rooms from live status, handle the request queue, and hand over a clean shift on the Guest Hub ops portal at Days Inn® by Wyndham Wildwood I-75."
    >
      <Callout tone="gold" title="Start here">
        <p>
          The board is the property. If the board says a room is ready, you can sell it; if it does
          not, you cannot. Your job at the desk is to keep those two facts true — take the guest's
          request into the queue, and keep the board honest for housekeeping and for the manager.
          Sections 1 through 4 are what you need on day one.
        </p>
      </Callout>

      <Section n={1} title="Signing on to the portal">
        <p>
          The ops portal runs in the browser on the desk computer. It stays open all day — do not
          close the tab at the end of a shift, just sign out of your name.
        </p>
        <Steps
          items={[
            <>
              Open <strong>Guest Hub → Front desk</strong> from the bookmark bar.
            </>,
            <>
              Tap your name and enter your 4-digit PIN. Every booking, refund note and request you
              touch is recorded under that name.
            </>,
            <>
              Check the <strong>System</strong> panel in the right column. Database connected, mode
              live, last sync under a minute. If it says otherwise, read section 9 before you take a
              booking.
            </>,
          ]}
        />
        <p>
          Never share a PIN or leave the portal signed in to your name when you step away for more
          than a few minutes. Lock the screen instead.
        </p>
        <Callout title="The screens down the left">
          <p>
            Seven icons, always in the same order. <strong>Board</strong> is your home screen and
            where you should sit by default. <strong>Queue</strong> is guest requests.{" "}
            <strong>Rooms</strong> shows housekeeping's routes as they see them.{" "}
            <strong>Team</strong>, <strong>Roles</strong>, <strong>Shifts</strong> and{" "}
            <strong>Reports</strong> are manager screens — you can open Team to look up who is on
            today and Shifts to check who is covering tomorrow, but you cannot add people, change
            roles, publish a rota or see per-person timings.
          </p>
        </Callout>
      </Section>

      <Section n={2} title="Reading the board">
        <p>
          The board lists every room with one status, sorted by urgency — rooms tied to an arriving
          guest float to the top. The four cards above it are the shape of your day.
        </p>
        <ManualTable
          columns={["Card", "What it tells you"]}
          rows={CARDS.map(([label, means]) => [label, means])}
        />
        <p>
          <strong>Ready to sell</strong> is the only number you may quote to a walk-in. Do not add
          rooms you expect to be ready — you will be wrong in front of a guest holding a card.
        </p>
        <Callout title="Do this next">
          <p>
            The blue panel at the top of the board names the single most urgent thing on the
            property — usually arrivals landing against rooms that are not turned. Clear it or
            dismiss it deliberately. If it has been sitting untouched for an hour, something is
            going wrong that a guest is about to notice.
          </p>
        </Callout>
      </Section>

      <Section n={3} title="Status words and who owns them">
        <p>
          You and housekeeping share one set of words. Housekeeping owns clean and dirty; you own
          sold, reserved and blocked. Changing someone else's word is how the board goes wrong.
        </p>
        <ManualTable
          columns={["Status", "Set by", "What you can do with it"]}
          rows={STATUSES.map((s) => [
            <StatusName color={s.color} name={s.name} />,
            s.owner,
            s.action,
          ])}
        />
        <Callout tone="amber" title="Never mark a room clean from the desk">
          <p>
            If a room is late and you are under pressure, the temptation is to flip it to clean and
            hand over the key. Do not. Call the housekeeper on the room instead — the app tells you
            who is in it and when they started. A guest walking into an unturned room costs more
            than fifteen minutes of waiting.
          </p>
        </Callout>
      </Section>

      <Section n={4} title="Arrivals and departures">
        <p>
          Check-in is 3:00 PM, check-out 11:00 AM, late checkout to 1:00 PM at your discretion. Work
          arrivals from the board, not from memory.
        </p>
        <Steps
          items={[
            <>
              <strong>Morning.</strong> Look at today's arrivals against rooms to turn. If arrivals
              outnumber ready rooms by more than a few, tell the manager before 10:00 AM — that is
              when rooms can still be reassigned.
            </>,
            <>
              <strong>At check-in.</strong> Confirm ID and card, assign from <em>ready</em> rooms
              only, and hand over the Wi-Fi and Guest Hub card. Mention that towels, housekeeping
              and maintenance can be requested from the room.
            </>,
            <>
              <strong>Early arrival.</strong> Never promise a time you do not control. Say the room
              is being turned, take their mobile number, and message them when the board flips to
              ready.
            </>,
            <>
              <strong>At check-out.</strong> Close the folio and let the room fall to{" "}
              <em>vacant dirty</em>. Do not hold rooms in <em>occupied</em> to be tidy about it.
            </>,
            <>
              <strong>Late checkout.</strong> Approve it in the portal so housekeeping sees the new
              time on their route. An approval that only exists in your head is a knock on the
              guest's door.
            </>,
          ]}
        />
        <p>
          Guests aged under 21 cannot check in. Photo ID and a credit card in the guest's own name
          are required every time, including for prepaid bookings.
        </p>
      </Section>

      <Section n={5} title="Working the request queue">
        <p>
          Requests arrive from guest phones, from housekeeping, and from you when a guest calls or
          walks up. They all land in one queue with four filters that switch the list: urgent, new,
          in progress, done.
        </p>
        <Steps
          items={[
            <>
              <strong>Acknowledge within the target.</strong> Every request should be picked up
              inside ten minutes. Acknowledging is not fixing — it tells the guest a person has it.
            </>,
            <>
              <strong>Assign it to a name</strong>, not to a department. Unassigned requests are the
              ones that breach.
            </>,
            <>
              <strong>Log a phone or walk-up request yourself.</strong> Anything you promise a guest
              goes into the queue in front of them, so it survives your shift.
            </>,
            <>
              <strong>Close it only when the work is done</strong> — not when you have dispatched
              it. The guest sees the status change.
            </>,
          ]}
        />
        <ManualTable
          columns={["Request type", "Goes to", "Target"]}
          rows={REQUEST_TYPES.map((r) => [...r])}
        />
        <p>
          A request marked <strong>urgent</strong> means a guest cannot use the room as sold — no
          hot water, no AC in summer, a lock that will not close, a safety issue. Urgent goes to the
          manager as well as the assignee. Do not use it for towels.
        </p>
      </Section>

      <Section n={6} title="Working with housekeeping">
        <p>
          You can see every housekeeper's route, who claimed which room, and how long a room has
          been started. Use it instead of the radio for anything that is not urgent.
        </p>
        <Bullets
          items={[
            <>
              <strong>Need a room sooner:</strong> prioritise it on the board. It moves to the top
              of that housekeeper's route and they get a notification.
            </>,
            <>
              <strong>Room unassigned with a guest arriving:</strong> assign it, or tell the manager
              if nobody has capacity.
            </>,
            <>
              <strong>Room started over an hour ago:</strong> call the housekeeper before you assume
              it is nearly done. Long turns usually mean a problem in the room.
            </>,
            <>
              <strong>Skipped room:</strong> read the reason. Do-not-disturb rooms come back to you
              — call the guest, do not send anyone back up.
            </>,
          ]}
        />
      </Section>

      <Section n={7} title="Guests at the desk">
        <ManualTable
          columns={["Situation", "What to do"]}
          rows={GUEST_CASES.map(([c, d]) => [c, d])}
        />
        <p>
          Rate authority, refunds and compensation are the manager's. You may always move a guest to
          another room of the same type, replace an amenity, and apologise. Anything with money
          attached goes to the manager — log the request so the conversation is not lost when your
          shift ends.
        </p>
      </Section>

      <Section n={8} title="The Ops Assistant">
        <p>
          The assistant panel answers questions about the property in plain language —{" "}
          <em>which rooms are ready in building 2</em>, <em>who is on 114</em>,{" "}
          <em>what is still open from this morning</em>. It reads the same board you do.
        </p>
        <p>
          Two rules. Check anything it tells you against the board before you say it to a guest, and
          never type a guest's card number, ID number or medical detail into it. If the assistant is
          unavailable, everything in this manual still works — it is a shortcut, not a system of
          record.
        </p>
      </Section>

      <Section n={9} title="When the portal is down">
        <p>
          If the System panel shows the database disconnected, or the board has not synced in more
          than five minutes, switch to paper and tell the manager. Do not keep taking bookings into
          a screen that is not saving them.
        </p>
        <Steps
          items={[
            "Print or photograph the current board so you know what was true when it stopped.",
            "Write arrivals, departures and requests on the desk log sheet with times.",
            "Keep selling only from rooms the board showed as ready — nothing else.",
            "When the portal returns, enter the log in order, oldest first, then reconcile against housekeeping before you trust the board again.",
          ]}
        />
      </Section>

      <Section n={10} title="Shift handover">
        <p>
          Before you sign out, walk the next person through four things. Two minutes here prevents
          most of the next shift's problems.
        </p>
        <Steps
          items={[
            <>
              <strong>Arrivals still to come</strong> and which rooms they are on.
            </>,
            <>
              <strong>Rooms not yet ready</strong> and who is working them.
            </>,
            <>
              <strong>Open requests</strong> — anything urgent, anything you promised a guest,
              anything waiting on the manager.
            </>,
            <>
              <strong>Guests to watch</strong> — a complaint in progress, a late checkout approved,
              a guest owed a call back.
            </>,
          ]}
        />
        <p>Then sign out of your name and leave the portal open on the board.</p>
      </Section>

      <QuickRef rows={QUICK_REF} />
    </ManualShell>
  );
}

function FrontDeskManual() {
  return (
    <StaffOnly title="Front desk manual">
      <FrontDeskManualContent />
    </StaffOnly>
  );
}
