import { StaffOnly } from "@/components/staff-only";
import { createFileRoute } from "@tanstack/react-router";

import {
  Bullets,
  Callout,
  ManualShell,
  ManualTable,
  QuickRef,
  Section,
  Steps,
} from "@/components/manuals/manual-kit";

export const Route = createFileRoute("/manuals/manager")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Manager Operations Manual — Days Inn Guest Hub" },
      {
        name: "description",
        content:
          "Running the property from the Guest Hub staff portal: people and roles, the turn plan, the board, the response standard and reporting.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ManagerManual,
});

const ROLES: [string, string, string][] = [
  [
    "Manager",
    "Everything: roles, invites, PIN resets, schedules, assignments, analytics, all room and request actions.",
    "Nothing — so keep the number of managers small.",
  ],
  [
    "Front desk",
    "Change room status, triage and close requests, edit guest records, dispatch maintenance.",
    "Add or remove people, change roles, see analytics.",
  ],
  [
    "Housekeeping",
    "See their route, start and finish rooms, claim unassigned rooms, flag issues.",
    "Sell or block rooms, see other wings' assignments, close guest requests.",
  ],
  [
    "View only",
    "Watch the queue and the board. This is what a brand-new account gets.",
    "Change anything at all until a manager grants a role.",
  ],
];

const PRIORITY: [string, string][] = [
  [
    "At the morning plan",
    "Put every room with a named arrival at the top of its housekeeper's route.",
  ],
  [
    "Two hours before check-in",
    "Check arrival rooms still not turned. Prioritise them and message the housekeeper.",
  ],
  [
    "Ninety minutes before an arrival",
    "The board raises it as the next action. Reassign to whoever is closest and free.",
  ],
  [
    "Guest arrives, room not ready",
    "Offer another comparable room first. Only offer a wait with a specific time and somewhere to sit.",
  ],
];

const REQUEST_TYPES: [string, string, string][] = [
  [
    "Fresh Towels & Linens",
    "Housekeeping on that wing",
    "10 minutes to acknowledge, 20 to deliver",
  ],
  [
    "Housekeeping Refresh",
    "Housekeeping on that wing",
    "10 minutes to acknowledge, then at the guest's stated time",
  ],
  [
    "Maintenance & Repairs",
    "Maintenance, dispatched by name",
    "10 minutes to acknowledge, same day to attend",
  ],
  ["Front Desk Assistance", "Whoever is on desk", "10 minutes, usually immediate"],
  [
    "Late Checkout",
    "Front desk, subject to arrivals",
    "Answer before 11:00 AM, approve to 1:00 PM",
  ],
];

const METRICS: [string, string, string][] = [
  [
    "Occupancy",
    "In line with the same weekday last month",
    "Check whether out-of-order rooms are inflating the picture.",
  ],
  [
    "Average turnover",
    "Under 45 minutes per departure room",
    "Look at routes and geography before looking at people.",
  ],
  [
    "Average response",
    "Under 10 minutes on the queue",
    "Usually one shift or one request type. Find which before changing staffing.",
  ],
  [
    "Breached requests",
    "Zero on most days",
    "Any pattern by hour means the desk is unstaffed at that hour.",
  ],
];

const ONBOARDING: [string, string][] = [
  [
    "Create the account and set the role",
    "Team & Invites → add name, role Housekeeping, send invite.",
  ],
  [
    "Set a PIN together",
    "Let them choose four digits. Watch them type it once. Do not record it anywhere.",
  ],
  [
    "Install the app on their phone",
    "Open the invite link, Add to Home Screen, allow notifications.",
  ],
  [
    "Sign on together",
    "Name tap, then PIN. Confirm they land on their own route and not someone else's.",
  ],
  ["Walk one room with them", "Start room, clean to standard, mark clean. Let them do the taps."],
  [
    "Flag one real issue",
    "Find something minor, flag it with a photo, and show them where it lands on your board.",
  ],
  [
    "Show the offline banner",
    "Walk into the Building 2 dead spot so they see the amber bar and the waiting-to-send count.",
  ],
  [
    "Cover the three guest answers",
    "Breakfast, Wi-Fi name, checkout time — and the rule that anything else goes to the front desk.",
  ],
  ["Set the day's route", "Assign a short first-day route, well under capacity, in one wing."],
  [
    "Book a check-in at 11 AM",
    "Fifteen minutes mid-shift catches confusion before it becomes a habit.",
  ],
];

const STANDARDS = [
  { label: "Guest request response", value: "10 minutes" },
  { label: "Departure room turn", value: "40 minutes target · 45 max" },
  { label: "Turn plan published by", value: "8:00 AM" },
  { label: "Assign to capacity", value: "85%, rest left unclaimed" },
  { label: "Check-in / check-out", value: "3:00 PM / 11:00 AM" },
  { label: "Late checkout", value: "Until 1:00 PM, availability permitting" },
  { label: "Out-of-order rooms reviewed", value: "Every morning" },
  { label: "Access removed when someone leaves", value: "Same day" },
];

function ManagerManualContent() {
  return (
    <ManualShell
      runningHead="Manager Operations Manual"
      title="Manager Operations Manual"
      intro="Running the property from the Guest Hub staff portal: adding people, building the day's turn plan, working the front desk board, holding the response standard, and keeping the property running when the system does not."
    >
      <Callout tone="gold" title="What this portal is for">
        <p>
          One live picture of every room, every guest request and every person on shift. It is the
          source of truth for what is sellable. If the board and reality disagree, fix the board
          first — the front desk sells from it and housekeeping works from it.
        </p>
      </Callout>

      <Section n={1} title="People, roles and invites">
        <p>
          Access is by role, not by shared login. Everyone gets their own account so room work,
          status changes and request resolutions are recorded against a name.
        </p>
        <ManualTable columns={["Role", "Can do", "Cannot do"]} rows={ROLES.map((r) => [...r])} />
        <p>
          Add someone under <strong>Team &amp; invites</strong>: name, role, zone, and a mobile or
          email for the invite. The invite carries an install link and nothing else — never send a
          PIN or a password in it. Until you grant the role, a new account is <em>view only</em>: it
          can watch the board and the queue and change nothing. That is deliberate, so an invite
          that arrives while nobody is around cannot touch live rooms.
        </p>
        <p>
          The same screen lists everyone with access, how they sign on, and when they last worked.{" "}
          <strong>Roles</strong> holds the full permission matrix — what each of the five roles can
          and cannot do, and a log of every grant and removal with the name of whoever made it. That
          log is what an audit asks for.
        </p>
        <p>
          Remove access the same day someone leaves. A departed account with a live PIN is the one
          real security hole in the system.
        </p>
        <Callout tone="amber" title="Keep a second manager">
          <p>
            Manager is the only role that can reset a PIN, change a role or add a person. With one
            manager account, a forgotten PIN on a Saturday morning has no fix until that person is
            on property. Grant the role to one senior desk lead as well.
          </p>
        </Callout>
      </Section>

      <Section n={2} title="PINs">
        <p>
          Housekeeping and maintenance sign on with a name tap and a 4-digit PIN. You set it when
          you add them and you reset it when they forget.
        </p>
        <Bullets
          items={[
            <>
              Set the PIN together on their first shift and let them choose the four digits — the
              add-person form offers <em>Set PIN with them now</em> or <em>Set on first sign-on</em>
              . Never 1234, never the room number they work, never a sequence you assign down a
              list.
            </>,
            <>
              Reset from <strong>Team &amp; invites</strong>. Forgot-PIN taps arrive as a text at
              the desk; a reset takes seconds and does not require a new invite. A PIN locked by
              repeated wrong attempts shows in the access table and clears the same way.
            </>,
            "Reset immediately if a phone is lost or a PIN is shared. Then sign that device out remotely from the person's record.",
            "Front desk and manager accounts keep email and password, and go through the password-reset gate on first sign-in.",
          ]}
        />
      </Section>

      <Section n={3} title="Building the turn plan">
        <p>
          The turn plan is the morning's most valuable half hour. Done well, nobody has to be chased
          all day.
        </p>
        <Steps
          items={[
            <>
              <strong>Read the day first.</strong> Arrivals, departures, stayovers and anything out
              of order. The six figures at the top of the board give you this in one look.
            </>,
            <>
              <strong>Assign by geography.</strong> One wing or floor per housekeeper. Walking the
              property is the single biggest waste of a shift.
            </>,
            <>
              <strong>Front-load arrival rooms.</strong> Any room with a named arrival goes at the
              top of the assigned housekeeper's route, ahead of stayovers.
            </>,
            <>
              <strong>Leave slack.</strong> Assign to roughly 85% of capacity. The remaining rooms
              sit unclaimed and get picked up by whoever is running ahead.
            </>,
            <>
              <strong>Publish before 8 AM.</strong> Housekeepers see their route the moment they tap
              their PIN, so a late plan is a late start.
            </>,
          ]}
        />
        <p>
          Use <strong>Auto-assign</strong> to fill the plan by wing and workload, then adjust by
          hand. It will not know that one housekeeper is training or that Building 2 has a lift out
          of service.
        </p>
      </Section>

      <Section n={4} title="Priority turns before arrivals">
        <p>
          The one thing guests never forgive is a room that is not ready at check-in. The board
          watches this for you and surfaces it as the next action.
        </p>
        <ManualTable columns={["When", "Do this"]} rows={PRIORITY.map(([w, d]) => [w, d])} />
        <p>
          <strong>Prioritise</strong> pushes a room to the top of the assigned housekeeper's phone
          and sends them a notification. Use it for real priority only — if everything is priority,
          the signal is worthless.
        </p>
      </Section>

      <Section n={5} title="Working the front desk board">
        <p>
          The board is the shift's home screen. It is ordered by urgency, not by room number, and
          rows that breach a standard are tinted so they cannot be scrolled past.
        </p>
        <Bullets
          items={[
            <>
              <strong>Do this next</strong> — the one situation that needs a decision now, with the
              action attached. Clear it or dismiss it; do not leave it sitting all afternoon.
            </>,
            <>
              <strong>Metrics row</strong> — occupancy, ready to sell, average turnover, open
              requests. These are today against target, not month-to-date.
            </>,
            <>
              <strong>Room board</strong> — every room with status, guest, housekeeper and last
              update. Tap a room to change status, add a note or send it to maintenance.
            </>,
            <>
              <strong>Side panel</strong> — open guest requests, housekeeping progress by person,
              arrivals and departures.
            </>,
          ]}
        />
        <p>
          Change a status from the board the moment reality changes: a walk-in taking a vacant clean
          room, a guest extending, a room you have just blocked. Every minute the board is wrong is
          a minute someone works from the wrong picture.
        </p>
      </Section>

      <Section n={6} title="The request queue and the response standard">
        <p>
          Guests are told on the website that requests are answered in about ten minutes. That
          promise is the standard the queue is measured against.
        </p>
        <ManualTable
          columns={["Request type", "Goes to", "Answer within"]}
          rows={REQUEST_TYPES.map((r) => [...r])}
        />
        <p>
          Every request moves through three states: <strong>new</strong>,{" "}
          <strong>in progress</strong>, <strong>done</strong>. Tap <em>Start</em> when someone owns
          it — that stops the clock on response time and shows the guest's request as acknowledged.
          Tap <em>Complete</em> only when the guest actually has what they asked for.
        </p>
        <p>
          A request older than ten minutes with no owner is a breach and shows at the top of the
          queue. Assign it or handle it yourself; do not close it to clear the count.
        </p>
        <Callout tone="amber" title="Never close a request the guest has not received">
          <p>
            The queue count is not a scoreboard. Closing an unfulfilled request hides it from the
            next shift and the guest asks a second time — which is the complaint they remember.
          </p>
        </Callout>
      </Section>

      <Section n={7} title="Maintenance tickets and dispatch">
        <p>
          Housekeeping flags issues from inside the room, usually with a photo. Those become tickets
          under <strong>Maintenance</strong>.
        </p>
        <Steps
          items={[
            <>
              <strong>Triage on sellability first.</strong> Anything that stops the room being sold
              — no AC in summer, no hot water, a bed that cannot be slept in, a lock fault — gets
              the room marked out of order immediately, before you think about the repair.
            </>,
            <>
              <strong>Dispatch by name.</strong> Assign a ticket to a person, not to “maintenance”.
              Unassigned tickets sit.
            </>,
            <>
              <strong>Group by trip.</strong> Three lamp issues in Building 2 are one walk, not
              three.
            </>,
            <>
              <strong>Close with what was done.</strong> One line. Next month's recurring-fault
              pattern comes out of those lines.
            </>,
            <>
              <strong>Bring the room back deliberately.</strong> Out of order returns to vacant
              dirty, gets turned, and only then goes on sale — never straight to vacant clean.
            </>,
          ]}
        />
        <p>
          A ticket waiting on a part gets a note with the expected date, so the front desk stops
          asking and the room stays correctly blocked.
        </p>
      </Section>

      <Section n={8} title="Shifts and coverage">
        <p>
          The <strong>Shifts</strong> screen is where next week is built. It holds the rota for
          everyone on the property, and it checks that rota against the departures actually booked
          for each day.
        </p>
        <Steps
          items={[
            <>
              <strong>Start from last week.</strong> <em>Copy last week</em> brings the pattern
              across; adjust from there rather than building from empty.
            </>,
            <>
              <strong>Read the coverage row before the rota.</strong> Each day shows how many
              housekeepers are on and how many departures are booked. A day marked <em>Short</em>{" "}
              means the early starts cannot cover the departures before 3:00 PM — it is not about
              headcount, it is about start times.
            </>,
            <>
              <strong>Fix the flagged day.</strong> The blue panel names the single worst day and
              offers the specific change, usually moving two starts earlier. Moving a start costs
              nothing; adding a shift costs money.
            </>,
            <>
              <strong>Post open shifts rather than calling round.</strong> An open shift goes to
              everyone qualified and the first to accept takes it. Anything still unfilled two days
              out needs a phone call.
            </>,
            <>
              <strong>Publish.</strong> Nothing is visible to staff until you do. Housekeepers see
              only their own shifts.
            </>,
          ]}
        />
        <p>
          One housekeeper covers about eleven rooms in a shift. That figure is the basis of every
          coverage warning on the screen — check it against your own numbers after the first month
          and tell us if it is wrong for this property.
        </p>
        <Callout tone="gold" title="Saturdays">
          <p>
            Saturday is the day this property misses the 3:00 PM target, and it is almost always the
            same cause: the heaviest departure day paired with the latest start times. It is visible
            a week ahead on this screen. Fix it there, not at 2:00 PM on the day.
          </p>
        </Callout>
      </Section>

      <Section n={9} title="Reports: what Guest Hub makes measurable">
        <p>
          None of these numbers existed at this property before Guest Hub. They are produced by work
          staff record as it happens, not estimated — and the <strong>Reports</strong> screen
          states, for each one, how complete the data behind it is. Read them weekly, not hourly;
          daily noise is not signal.
        </p>
        <ManualTable
          columns={["Metric", "Healthy", "If it drifts"]}
          rows={METRICS.map((m) => [...m])}
        />
        <p>
          Turnover time is measured from <em>Start room</em> to <em>Mark clean</em>, so it only
          means anything if housekeepers tap start. If a person's average looks impossibly fast, the
          problem is usually the taps, not the cleaning. Per-person figures are medians, not
          averages, so one difficult room does not distort someone's week.
        </p>
        <p>
          Use the per-person table to find where help is needed, never as a leaderboard. It is
          visible to managers only — the front desk cannot see it, and neither can the housekeepers
          themselves.
        </p>
      </Section>

      <Section n={10} title="When the system is offline">
        <p>
          Phones queue their changes locally and send them when coverage returns, so a Wi-Fi drop in
          Building 2 needs no intervention. A wider outage does.
        </p>
        <Steps
          items={[
            <>
              <strong>Check the status strip.</strong> It shows whether the data service is
              reachable and whether you are in live production. A red database indicator means the
              portal is reading stale data — stop changing statuses.
            </>,
            <>
              <strong>Print or photograph the room board.</strong> Do this first, while you still
              can. That sheet becomes the source of truth.
            </>,
            <>
              <strong>Move to paper for arrivals.</strong> Mark rooms ready on the printout as
              housekeeping radios them in.
            </>,
            <>
              <strong>Tell housekeeping to keep working.</strong> Their phones keep the route and
              keep recording. Nothing needs to be redone.
            </>,
            <>
              <strong>Reconcile once before reopening the board.</strong> When the service returns,
              let the queued changes land, then walk the printout against the board room by room
              before anyone sells from it again.
            </>,
          ]}
        />
        <p>
          Do not enter the same status change on two devices during an outage. Duplicate entries are
          harder to unpick than a gap.
        </p>
      </Section>

      <Section n={11} title="Onboarding a new housekeeper: day one">
        <p>
          Work through this in order. It takes about forty minutes and it prevents nearly every
          first-week problem.
        </p>
        <ul className="mt-2 space-y-0">
          {ONBOARDING.map(([title, detail]) => (
            <li
              key={title}
              className="flex items-start gap-3 border-b border-border-guest py-2.5 break-inside-avoid"
            >
              <span
                aria-hidden
                className="mt-1 inline-block h-3.5 w-3.5 shrink-0 border-2 border-slate-400"
              />
              <span>
                <strong className="text-brand-blue">{title}</strong>
                <span className="mt-0.5 block text-sm leading-relaxed text-slate-700">
                  {detail}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p>
          Give them the Housekeeping Training Manual at the end of the session, not the start — they
          will read it once they have seen the app.
        </p>
      </Section>

      <QuickRef title="Standards at a glance" rows={STANDARDS} />
    </ManualShell>
  );
}

function ManagerManual() {
  return (
    <StaffOnly title="Manager manual">
      <ManagerManualContent />
    </StaffOnly>
  );
}
