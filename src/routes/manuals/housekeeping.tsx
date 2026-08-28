import { createFileRoute } from "@tanstack/react-router";

import {
  Bullets,
  Callout,
  Checklist,
  ManualShell,
  ManualTable,
  QuickRef,
  Section,
  StatusName,
  Steps,
} from "@/components/manuals/manual-kit";

export const Route = createFileRoute("/manuals/housekeeping")({
  head: () => ({
    meta: [
      { title: "Housekeeping Training Manual — Days Inn Guest Hub" },
      {
        name: "description",
        content:
          "Using the Guest Hub app on your phone, what each room status means, and the standard every room is cleaned to.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HousekeepingManual,
});

const STATUSES: { name: string; color: string; means: string; action: string }[] = [
  {
    name: "Vacant dirty",
    color: "#B45309",
    means: "Guest has checked out. Room needs a full turn.",
    action: "Turn it. This is most of your day.",
  },
  {
    name: "Vacant clean",
    color: "#0F7B4F",
    means: "Turned and ready to sell.",
    action: "Nothing. Do not re-enter.",
  },
  {
    name: "Occupied",
    color: "#0065AB",
    means: "Guest is still staying — a stayover.",
    action: "Refresh only. Never pack their things.",
  },
  {
    name: "Occupied / DND",
    color: "#7C3AED",
    means: "Guest asked not to be disturbed.",
    action: "Do not knock. Leave it and move on.",
  },
  {
    name: "Reserved / arriving",
    color: "#0E7490",
    means: "A named guest arrives today.",
    action: "Highest priority. Turn before check-in.",
  },
  {
    name: "Out of order",
    color: "#B91C1C",
    means: "Cannot be sold — something is broken.",
    action: "Do not turn until maintenance clears it.",
  },
];

const CHECKLIST: { area: string; items: string[] }[] = [
  {
    area: "Strip and reset",
    items: [
      "Open curtains, check for guest property, empty all trash",
      "Strip bed linens and used towels straight to the cart — never onto the floor",
      "Check under the bed, behind the headboard and in every drawer",
      "Check the safe is empty and unlocked",
    ],
  },
  {
    area: "Bathroom",
    items: [
      "Toilet, tub, shower walls and sink cleaned and dried, no water spots on chrome",
      "Mirror streak-free; hair removed from every surface and the drain",
      "Fresh towel set: two bath, two hand, two washcloths, one bath mat",
      "Amenities restocked; two toilet rolls, one started and one spare",
      "Floor cleaned last, corners included",
    ],
  },
  {
    area: "Beds",
    items: [
      "Fresh sheets, no stains, tight corners, no hair on the pillow slips",
      "Mattress pad checked for stains — flag it if you find any",
      "Pillows plumped, four to a king, four to a double queen",
      "Decorative cover straight and even on both sides",
    ],
  },
  {
    area: "Room surfaces",
    items: [
      "Dust top-down: light fixtures, art, headboard, desk, nightstands, TV frame, baseboards",
      "TV screen and remote wiped; remote batteries checked",
      "Fridge and microwave wiped inside and out; nothing left behind",
      "Coffee setup restocked; ice bucket and glasses fresh",
      "AC filter grille wiped; unit set to 72°F and switched off",
      "Phone, alarm clock, lamp switches, outlets and USB ports all working",
    ],
  },
  {
    area: "Floors and entry",
    items: [
      "Vacuum the whole floor including under the desk and along the walls",
      "Wipe the entry door, handle, deadbolt, latch and peephole",
      "Check the door closes and locks on its own",
      "Confirm the rate card and emergency exit map are on the door",
    ],
  },
  {
    area: "Final look",
    items: [
      "Stand in the doorway and look at the room the way a guest will see it",
      "Curtains even, lamps aligned, chairs square to the desk",
      "Smell the room — flag anything musty, smoky or damp",
      "Lights off, door locked, then mark the room clean in the app",
    ],
  },
];

const GUEST_CASES: [string, string][] = [
  [
    "Guest opens the door mid-knock",
    "Step back, greet them, ask if they would like the room serviced now or later, and set the status accordingly.",
  ],
  [
    "Guest asks for towels or amenities",
    "Give them from your cart if you have them. If not, log it in the app as a Fresh Towels & Linens request so nothing depends on memory.",
  ],
  [
    "Guest asks about breakfast, Wi-Fi or checkout",
    "Answer if you know it — see the facts below. If you are unsure, walk them to the front desk rather than guessing.",
  ],
  [
    "Guest complains about the room",
    "Apologise once, do not explain or defend, and get the front desk. Log a request if the guest is standing in front of you.",
  ],
  [
    "Guest asks you to enter another room",
    "Politely decline and refer them to the front desk. Only enter rooms on your own route.",
  ],
  [
    "Guest is upset or aggressive",
    "Leave the area and call the front desk immediately. Do not stay to resolve it.",
  ],
];

const QUICK_REF = [
  { label: "Front desk", value: "(352) 748-7766" },
  { label: "Guest Wi-Fi network", value: "DaysInn_Guest · no password" },
  { label: "Check-in / check-out", value: "3:00 PM / 11:00 AM" },
  { label: "Late checkout", value: "Until 1:00 PM, front desk approves" },
  { label: "Target turn time", value: "40 minutes per departure room" },
  { label: "Towel set per room", value: "2 bath · 2 hand · 2 washcloths · 1 mat" },
  { label: "AC left at", value: "72°F, switched off" },
];

function HousekeepingManual() {
  return (
    <ManualShell
      runningHead="Housekeeping Training Manual"
      title="Housekeeping Training Manual"
      intro="How to use the Guest Hub app on your phone, what each room status means, and the standard every room is cleaned to at Days Inn® by Wyndham Wildwood I-75."
    >
      <Callout tone="gold" title="Start here">
        <p>
          You need three things before your first shift: the Guest Hub app installed on your phone,
          your name on the schedule, and a 4-digit PIN from your manager. Sections 1 and 2 cover all
          three. If anything on your phone does not match this manual, ask the front desk — do not
          guess.
        </p>
      </Callout>

      <Section n={1} title="Installing the app">
        <p>
          Guest Hub runs in your phone's browser, but you should install it to the home screen.
          Installed, it keeps you signed in, keeps working when the Wi-Fi drops, and can send you room
          alerts from the front desk.
        </p>
        <Steps
          items={[
            "Open the link your manager texts you.",
            <>
              Tap <strong>Add to Home Screen</strong> on the welcome screen. If your browser does not
              show the prompt, tap the browser's <strong>Share</strong> button, then{" "}
              <strong>Add to Home Screen</strong>.
            </>,
            "Open Guest Hub from your home screen from now on — not from the browser tab.",
            <>
              When the phone asks to <strong>allow notifications</strong>, tap allow. This is how the
              front desk tells you a room jumped the queue.
            </>,
          ]}
        />
        <p>
          Installing does not use your personal phone number, contacts, photos or location. The app
          only uses the camera when you attach a photo to a maintenance issue.
        </p>
      </Section>

      <Section n={2} title="Signing on">
        <p>There is no email or password to type. Sign-on is two taps: your name, then your PIN.</p>
        <Steps
          items={[
            <>
              <strong>Tap your name.</strong> The list shows everyone on today's schedule by name and
              role only — nobody's room count or workload is visible until they sign in. If your name
              is not there, tap <em>I'm not on this list</em> and call the front desk; you may be
              scheduled under a different date.
            </>,
            <>
              <strong>Enter your 4-digit PIN.</strong> Your manager sets it with you when you are
              added to the team. There is no submit button — sign-on happens on the fourth digit. A
              wrong PIN clears the dots so you can try again; nothing locks after one mistake. Do not
              share it, and do not write it on the phone case.
            </>,
          ]}
        />
        <p>
          You stay signed in between shifts, so the next morning you only tap your PIN. Use{" "}
          <em>Sign out of this phone</em> only if you are getting a new phone or handing yours in.
        </p>
        <Callout title="If you forget your PIN">
          <p>
            Tap <em>Forgot PIN</em> and the front desk gets a message. A manager resets it in a few
            seconds — you do not need to wait for a new invite link. Never borrow someone else's PIN:
            room work is recorded under whoever signed in.
          </p>
        </Callout>
      </Section>

      <Section n={3} title="Starting a shift">
        <p>
          Open the app when you arrive and tap <strong>Start shift</strong>. This is your clock-in and
          it sets the start time on every room you turn today.
        </p>
        <p>
          The front desk pre-assigns your rooms overnight — usually one wing or floor so you are not
          walking the property. Before you tap start:
        </p>
        <Bullets
          items={[
            "Check the assigned list matches your cart and your wing.",
            <>
              If you have capacity, tap any room under <strong>Unclaimed nearby</strong> to add it.
              Claimed rooms show your name to everyone else, so no one doubles up.
            </>,
            "If the list is too long for your shift, say so at the start, not at 2 PM. The manager can move rooms while there is still time.",
          ]}
        />
        <p>
          The estimate next to your room count uses a 40-minute average turn. Treat it as a guide, not
          a target you have to beat.
        </p>
      </Section>

      <Section n={4} title="Room status words">
        <p>
          Every room on the property carries one status. The front desk sells rooms from these words,
          so they have to be accurate.
        </p>
        <ManualTable
          columns={["Status", "What it means", "What you do"]}
          rows={STATUSES.map((s) => [
            <StatusName color={s.color} name={s.name} />,
            s.means,
            s.action,
          ])}
        />
        <p>
          <strong>Stayover</strong> means the guest has not checked out yet — refresh the room, change
          linens if they asked, and never pack or move their belongings.{" "}
          <strong>Do not disturb</strong> means you do not knock at all: leave it, and it stays on
          your list until the flag clears or the front desk calls the guest.
        </p>
      </Section>

      <Section n={5} title="Working your route">
        <p>
          The app always shows one room at the top under <strong>Do this next</strong>. That is the
          room the front desk needs most — usually one with a guest arriving. Work top-down and you
          will not have to think about priority.
        </p>
        <Steps
          items={[
            <>
              <strong>Tap Start room.</strong> This tells the front desk the room is being worked, so
              they stop asking.
            </>,
            <>
              <strong>Clean to the standard in section 6.</strong>
            </>,
            <>
              <strong>Tap Mark clean</strong> before you leave the room, not at the end of the day.
              The front desk sells the room within a minute of that tap.
            </>,
            <>
              <strong>Tap Skip</strong> if you cannot get in — do not disturb, guest inside, door
              blocked. Choose the reason so the room goes back to the front desk instead of going
              quiet.
            </>,
          ]}
        />
        <p>
          If the room needs more than a normal turn — a stain that will not lift, a smell, a bed that
          needs a mattress change — mark the issue (section 7) instead of quietly spending an extra 40
          minutes. Someone else can be moved to cover your route.
        </p>
        <Callout tone="gold" title="When the front desk changes your order">
          <p>
            Sometimes a room jumps the queue — usually an arrival landing earlier than booked. A gold{" "}
            <em>Route changed</em> banner appears with the room number and the reason.{" "}
            <strong>Go to</strong> moves that room to the top; <strong>Later</strong> only closes the
            banner — the route has already been reordered either way, so the room is still coming. If
            you were part-way through a room when it appears, finish that room first.
          </p>
        </Callout>
        <Callout tone="amber" title="Never mark a room clean early">
          <p>
            Marking clean puts the room on sale. A guest can be standing at the desk holding a key for
            it thirty seconds later. If you are interrupted mid-room, leave it started — do not mark
            it clean to keep your numbers tidy.
          </p>
        </Callout>
      </Section>

      <Section n={6} title="The cleaning standard">
        <p>
          Every departure room is turned to the same standard, in this order. Working in order keeps
          you from re-touching surfaces you have already wiped.
        </p>
        {CHECKLIST.map((c) => (
          <Checklist key={c.area} area={c.area} items={c.items} />
        ))}
        <p>
          <strong>Stayover rooms</strong> get the bathroom, trash, towels, bed straightening, amenity
          restock and a floor pass — not a full strip. <strong>Suites</strong> add the sitting area,
          sofa cushions and the second TV surface.
        </p>
        <p>
          Guest property found in a departure room goes to the front desk the same day with the room
          number and date. Do not keep it on your cart overnight and do not throw away anything that
          looks personal — chargers, medication, papers, jewellery.
        </p>
      </Section>

      <Section n={7} title="Flagging a maintenance issue">
        <p>
          Anything broken, leaking, stained or missing gets flagged from inside the room while you are
          looking at it. A flagged issue becomes a maintenance ticket the front desk can dispatch.
        </p>
        <Steps
          items={[
            <>
              Tap <strong>Flag issue</strong> on the room.
            </>,
            "Pick what it is — AC, plumbing, electrical, TV, furniture, linen, pest, other.",
            <>
              <strong>Take one clear photo.</strong> One photo of the actual problem saves a
              walk-through later. Never photograph a guest or a guest's belongings.
            </>,
            <>
              Say in one line what you saw: <em>“AC blowing warm, thermostat set to 68”</em> beats{" "}
              <em>“AC broken”</em>.
            </>,
            <>
              Choose whether the room can still be sold. If it cannot — no hot water, no AC in summer,
              a bed that cannot be slept in — mark it <strong>out of order</strong>. That takes the
              room off sale immediately.
            </>,
          ]}
        />
        <p>
          Do not fix electrical or plumbing yourself, and do not move heavy furniture alone. Flag it
          and move on to the next room.
        </p>
      </Section>

      <Section n={8} title="When there is no signal">
        <p>
          Coverage drops in parts of Building 2 and in some stairwells. The app is built for this.
          When you lose signal you will see an amber bar across the top:{" "}
          <em>No signal — keep working.</em>
        </p>
        <p>Offline, you can still:</p>
        <Bullets
          items={[
            "see your whole route and every room note",
            "start rooms and mark them clean",
            "flag issues and take photos",
          ]}
        />
        <p>
          Each of those is saved on your phone and shows in a <strong>Waiting to send</strong> list
          with a count. When you walk back into coverage they send by themselves, usually within a few
          seconds. Nothing is lost and you do not need to redo anything.
        </p>
        <p>
          Two rules: do not force-close the app while the waiting list has items in it, and do not end
          your shift on a dead spot. The app will not let you clock out while changes are still
          waiting — walk back into coverage, watch the header change to <em>All synced</em>, then
          clock out. If it will not clear, tell the front desk before you leave so they know the board
          is behind.
        </p>
      </Section>

      <Section n={9} title="Guests">
        <p>
          Most guest contact is a few seconds in a hallway. What you say in those seconds is what they
          remember about the stay.
        </p>
        <ManualTable
          columns={["Situation", "What to do"]}
          rows={GUEST_CASES.map(([c, d]) => [c, d])}
        />
        <p>
          Three facts you will be asked constantly: breakfast is complimentary in the lobby every
          morning, the Wi-Fi is <strong>DaysInn_Guest</strong> with no password, and check-out is
          11:00 AM with late checkout to 1:00 PM subject to availability from the front desk.
        </p>
        <p>
          You never have to negotiate a rate, a refund, a room change or a complaint. Say{" "}
          <em>“Let me get the front desk for you”</em> and hand it over. That is the correct answer
          every time.
        </p>
      </Section>

      <Section n={10} title="Clocking out and handover">
        <p>
          At the end of your shift, open the app and check three things before you tap{" "}
          <strong>Clock out</strong>:
        </p>
        <Steps
          items={[
            <>
              <strong>Nothing is waiting to send.</strong> The header should read <em>All synced</em>.
            </>,
            <>
              <strong>Every room you touched has a status.</strong> A room left <em>started</em> looks
              like work in progress to the next shift.
            </>,
            <>
              <strong>Anything unfinished is written down.</strong> Rooms you could not get into,
              rooms you skipped or flagged, and anything still on your route appear automatically
              under <em>Left for the next shift</em> — you do not type this, the app builds it from
              your day. Read it before you tap clock out and tell the desk if a reason is not obvious.
            </>,
          ]}
        />
        <p>Clocking out ends your shift but keeps you signed in. Tomorrow you only tap your PIN.</p>
      </Section>

      <QuickRef rows={QUICK_REF} />
    </ManualShell>
  );
}
