# Walk 4 — Money: the paywall, the packs, and telling the truth

Date: 2026-08-17 · Build walked: HEAD at `dd3773e` (Walks 1–3 fixed), debug APK built and
installed fresh, `pm clear` before the run. Device: Samsung SM-N975F, Android 12.
Browser half at 412x915 against the dev server on port 5199.

Every device capture in this folder predates commit `10b24bf`
("refactor(paywall): one subscription surface, not two"), which a parallel session landed
at 11:41 while this walk was running. See finding 2 — that commit is right, but its stated
reason is wrong, and this walk has the evidence.

## Findings, ranked

### 1. BLOCKER — the paywall's one primary action cannot be bought, and fails in product-id

The sheet's single brass CTA reads **"Get Plus — $3.99/mo"**. It looks completely live.
Tapping it produces a red error toast reading, verbatim:

> Subscription "plus_monthly_399" not found.

Captures `D10-paywall-tiers.png` (the CTA), `D11-get-plus-result.png` (the toast).
Selecting Studio and tapping does the same with `studio_monthly_999`.

Standing rule 3 says these CTAs read "Coming soon" and told me not to file them. They do
not read "Coming soon". `PaywallSheet.tsx` falls back to that label only when
`chosen.productId` is absent, and `src/lib/tiers.ts` now carries `productId` for both paid
tiers — so the honest state was switched off the moment those ids were filled in, and
nobody re-walked the button. This is not the known blocker; it is a different and worse
one. A person who wants to pay taps the one thing on the screen built for them and gets an
internal identifier in a red box.

This is the walk's answer to "which pretended".

### 2. BLOCKER — two subscription systems on one sheet, and the buyable one was the old one

One scroll below the new Free/Plus/Studio cards sat a second tab bar, **Credit Packs /
Plans**. The Plans tab rendered live, purchasable products:

- **Plus Annual** — "840 credits / year (70 a month)" — **₦83,500.00/yr** — "SAVE 40%", 3-day free trial
- **Pro Annual** — "1,800 credits / year (150 a month)" — **₦158,000.00/yr**

Capture `D13-plans-tab.png`, which shows "Get Plus — $3.99/mo" and "Plus Annual
₦83,500.00/yr" **in the same screenshot**. Two products called Plus, two prices, two
currencies, two languages (looks vs credits-per-year), and a tier ("Pro") that does not
exist in the new system at all. The one you can buy is the retired one; the one wearing
brass is inert. They are separated by a divider that reads "OR TOP UP", which is also
untrue — annual subscriptions are not top-ups.

**Correcting the record, because it matters.** Commit `10b24bf` removed this tab, which is
the right fix. Its message says the tab "was gated behind `hasSubscriptions`, and no
RevenueCat subscription products exist yet, so it has not been rendering — it would have
appeared the moment those products were created". That is not what the handset shows. The
products exist now. RevenueCat's `credits_paywall` offering returned seven packages on this
device, quoted from the app's own debug line in `D12-paywall-packs.png`:

```
RC: OK: 7 pkgs [pro_annual:pro-annual-1y, plus_annual:plus-annual-1y,
credits250, credits100, credits25, credits10, credits3]
| offerings: [credits_paywall] | catalog: 5s/7c | pkgs: 7
```

and the tab was on screen and tappable. It was not a trap waiting to spring; it had already
sprung. Same fix, but it was live breakage rather than latent, which changes how urgently
the rest of this list should be read.

### 3. SERIOUS — the tier prices are hardcoded dollars; the store charges naira

`tiers.ts` writes `$3.99/mo` and `$9.99/mo` as literals. Google Play on this handset quotes
everything in NGN (₦83,500.00, ₦325.00 — `D12`, `D13`). A user reads a dollar price and is
charged in another currency at a number they were never shown.

Plan §7.4 step 3 calls this out by name: "paywall reads the offering (already
catalog-driven — no app-store price hardcoding)". The packs obey it (`priceString` comes
from RevenueCat). The new tier cards do not.

### 4. SERIOUS — the live purchase path is still credit arithmetic, with emoji as icons

Below the divider, every purchasable thing is priced in credits and iconed in emoji
(`D12-paywall-packs.png`):

| | | |
|---|---|---|
| 🎯 Beginners Pack | 3 credits | ₦325.00 |
| ⚡ Novies Pack | 10 credits | ₦1,530.00 |
| 🔥 Starter Pack | 25 credits | ₦2,400.00 |
| 💎 Essential Pack (BEST VALUE) | 100 credits | ₦8,550.00 |
| 👑 Stylist Pack | 250 credits | ₦18,500.00 |

The tab is literally labelled "Credit Packs". A look costs 2 credits, so "3 credits" is one
and a half looks — the exact arithmetic §7.4 was written to abolish, on the only screen
that has ever taken money. Emoji-as-icon is killed by plan §1.3.

### 5. SERIOUS — a debug string ships to the user on the purchase screen

The line quoted in finding 2 renders in grey 8px under Terms/Privacy on every paywall view
(`D12-paywall-packs.png`). It leaks internal product ids, the offering name and package
counts. It is marked `{/* Temporary debug info */}` in `PaywallScreen.tsx`.

### 6. SERIOUS — restore tells a signed-out past customer there is nothing to restore

Run signed out, Restore Purchases reports **"Nothing to restore on this account."**
(`D15-restore-guest-toast.png`).

That sentence is not earned. `POST /api/payments/restore-purchases` is behind `protect`, so
signed out it returns 401:

```
$ curl -s -X POST https://167-86-112-90.sslip.io/api/payments/restore-purchases
{"success":false,"message":"Not authorized, no token provided"}   HTTP 401
```

and `usePayment.restorePurchases` reads `packs?.data?.grantedCredits || 0`, so a 401 and a
genuinely empty account are indistinguishable to the user. The server was never asked.

This matters more than its size. Per the M5 appendix the production database lost every
user record, so **every past customer is a signed-out user right now**, and this is the one
screen that can give them back what they paid for. It tells them there is nothing there,
and never says "sign in first".

### 7. SERIOUS — "30-day guarantee", which nothing in the product backs

The paywall footer reads "Secure payment · 30-day guarantee · Credits never expire"
(`D10-paywall-tiers.png`). There is no refund path in the app, no 30-day policy in the
backend, and purchases go through Google Play, whose consumable refund window is Google's
and is not 30 days. The string appears exactly once and nothing implements it.

Worth noting the app already agrees with me: `backend/services/aiNudgeService.js` instructs
its copy generator "no salon prices, no fake discounts, **no guarantees**".

### 8. SERIOUS — the rewards sheet pays in "0.5 credit"

The menu row reads **"Free looks & referrals"**. The sheet it opens is titled "Rewards /
Earn free credits & track activity" and offers (`D3-rewards.png`):

> Watch a short ad to receive **0.5 credit** instantly.  ·  chip: **+0.5 credit**  ·  **Buy credit packs**

Half a credit is a quarter of a look. The user is asked to watch four ads to earn one try-on
and to work that out themselves, one tap after a menu item that promised looks. The
Referrals tab continues it: "Sign in to unlock referrals and earn credits."
(`D4-rewards-referrals.png`).

### 9. SERIOUS — the second-cheapest pack is the worst value in the list

At the quoted naira prices: 3 credits = ₦108/credit, **10 credits = ₦153/credit**,
25 = ₦96, 100 = ₦85.50, 250 = ₦74. A customer who liked the smallest pack and steps up to
the next one pays **41% more per credit** than they did before. The ladder is monotonic
everywhere except the rung most people take second.

Separately, "BEST VALUE" sits on the 100-pack while the 250-pack is ₦11.50/credit cheaper.

### 10. SERIOUS — Studio costs 3 looks at the till and 4 units on the meter

`generationTiers.ts` and the backend `MODE_PRICING` agree: pro = 6 credits = 3 looks, which
is what the confirm screen quotes (`W4-08-confirm-studio-shortfall.png`, "Need 2 more
looks"). But `backend/services/entitlements.js` has `UNIT_COST = { standard: 1, hd: 2, pro: 4 }`
under a comment claiming it "mirrors MODE_PRICING credits/2" — and 6/2 is 3, not 4.

`consume()` is called on every generation regardless of `isEnforced()`, so the usage data
that plan §7.2 says the ceilings must be set from is already over-counting Studio by a
third; and on the day enforcement flips on, a Studio look will burn 4 of a tier's daily
units after the screen quoted 3.

### 11. PAPER CUT — "Novies Pack"

Not a word. Presumably "Novice". It is a product name on the live purchase path
(`D12-paywall-packs.png`).

### 12. PAPER CUT — the Profile screen is a credit balance with a coin glyph

`MobileProfileHub.tsx` renders a stat card labelled **"Credits"** whose value is
`Number(user.credits).toFixed(1)` — a decimal — beside a `Coins` icon, then a row reading
"Buy credits / Top up your credit balance". A top-level destination, entirely in the old
currency. Not captured on device: the run stayed signed out, so the card had no value to
show. Read from source, not walked — flagged as such deliberately.

### 13. PAPER CUT — a third deliberate-looking "credits" mention on the paywall

Two mentions are sanctioned: "no credits to track" in the headline, and "your existing
credits … never expire". The footer adds a third, **"Earn free credits"**
(`D10-paywall-tiers.png`), and the sign-in modal a fourth ("Create your account to get more
credits and access premium features.").

### 14. WITHDRAWN — the paywall does NOT lose its place when you leave the app

Filed mid-walk as serious: return from Google Play and the sheet is gone, back on the feed.
It is my harness. I had been running `adb shell am force-stop` to wrestle the foreground
back, which kills the app and takes its React state with it.

Retested honestly — open the paywall, `KEYCODE_HOME`, resume via `am start`, compare pids:
`15858` before and `15858` after, sheet intact and still scrolled where it was.
`D16-paywall-before-home.png` / `D17-paywall-after-resume.png`. Nothing is wrong.

Recorded rather than deleted for the same reason Walk 2 kept its scroll-position mistake:
the fix I nearly wrote would have been state persistence for a sheet that already persists.

## Process notes, so nobody repeats them

- **This handset is the operator's daily driver.** Twice a blind `adb input tap` landed in
  another app because a background app had taken the foreground — once in a banking app
  showing a session dialog, once in Nerve. Three screenshots caught personal data and were
  deleted rather than committed. Every device action after that went through a wrapper that
  reads `mCurrentFocus` and refuses unless Hair Studio is on top. Anyone walking this device
  should do the same.
- **`am force-stop` is what was stealing the foreground.** Killing Hair Studio's task makes
  Android resume whatever is next in the stack, and my next `am start` then raced it. It
  also caused finding 14. Use `am start` in a retry loop, never force-stop.
- **The dev server on 5199 was already running** from an earlier session. Verified it served
  this tree before trusting it (`curl localhost:5199/src/lib/tiers.ts` matched disk), per the
  port-5173 lesson in Walk 1.

## What passed, and is worth protecting

- **The shortfall state on the confirm screen is the best money copy in the app.** At one
  look with Studio selected: "Need 2 more looks — our closest likeness and finish", "You
  need 2 more looks", one brass "Get more looks", and "Not charged if it fails" sitting
  beside "~20 seconds". No arithmetic, no currency, no dead end.
  `W4-05-confirm-credits0.png`, `W4-08-confirm-studio-shortfall.png`.
- **The result screen's low-balance nudge is right** — "Out of looks — get more", quiet,
  underlined, not competing with Share. `W4-09-results-nudge-0.png`. Walk 3's fix holds.
- **The anchoring works.** Selecting Free swaps the CTA to a disabled "Your current plan"
  rather than trying to sell you what you already have.
- **Restore cannot double-grant.** `Payment.revenueCat.transactionId` carries a
  `unique: true, sparse: true` index and `creditLedger.creditUser()` runs *after*
  `Payment.create()`, so a concurrent second restore fails at the database before any credit
  is written. Proved by reading the schema and the route rather than by buying something
  twice; run twice signed out, it granted nothing either time.
- **Menu language is clean** — "Saved looks", "Profile", "Free looks & referrals"
  (`D2-menu.png`). The credits only start once you are through the door.
- **Walk 1's fix holds on the photo screen**: "Free looks when you sign up", no emoji, no
  credits.

## Not judged this pass

**BUILD-GATED — a completed pack purchase.** The Play dialog opens from the pack row, but
Play refuses the transaction:

```
BillingWrapper purchases failed to update: DebugMessage: Please ensure the specific
App version has been published.. ErrorCode: DEVELOPER_ERROR
```

A debug APK is not a published version, so no purchase can complete on this build no matter
whose card is attached. Needs an internal-track build signed with the upload key. Until
then these stay unproven: the balance updating without a manual refresh, restore against an
account that really has a past pack, and the app's handling of a genuine cancel (the SDK's
`userCancelled` branch was never exercised — the DEVELOPER_ERROR path was).

**DEVICE-GATED, not reached:** the header "looks" chip as a paywall entry (it renders only
when authenticated, and the run stayed signed out); the low-balance nudge → paywall on real
hardware; the paywall opened while offline; tapping the primary button twice fast against a
product that exists.

## Verdict

**Which paths took money end to end: none, and not for the reason I expected.** The only
purchasable things on the sheet are the credit packs, and this build cannot complete a
purchase at all — Play rejects it as an unpublished version. That is a build problem, not a
product one, and it is the single largest hole in this walk.

**Which refused honestly:** the confirm screen, completely. It is the one money surface
written in the language the plan chose, and it refuses a purchase you cannot afford by
telling you exactly how short you are and offering one way forward. Restore also refuses
honestly when the account is genuinely empty.

**Which pretended:** the paywall itself, twice over. It leads with a brass button for a
product that does not exist and answers with a raw product id. One scroll below, it sold a
different Plus at a different price in a different currency under a heading that called it a
top-up. And it promised a 30-day guarantee that nothing in the codebase implements.

The headline is that the sheet's top half and bottom half were built for different products
and both were shipped. The top half speaks in looks and cannot take money; the bottom half
takes money and speaks in credits and emoji. A person deciding whether to spend reads both.
