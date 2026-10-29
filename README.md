# Shaam-e-Dawat Catering: "The evening of the feast"

[**Live demo**](https://shaam-e-dawat.vercel.app) · [Source files](./src/) · [Local setup](#run-it)

## Project at a glance

Guest-count and menu-based estimates, procedural venue layouts, and formatted enquiry generation.

**Scope:** Frontend concept with sample pricing. Estimates and message preparation do not create or manage real bookings.

Concept project 7 of 8 for the Aqoa Systems portfolio. A fictional Karachi caterer for weddings, corporate dinners and private functions.

## What's in it
| Page | Signature moment |
|---|---|
| Home | A 3D walk into a shamiana at dusk: pleated ivory canopy, emerald carpet, a flower-wall stage and marigold strands at the entrance. As you scroll (a clock runs from 6:40 to 9:30 pm), you walk down the aisle while the fairy lights switch on string by string, the crystal chandeliers and wall uplights warm up, the clothed tables are dressed with gold chairs, chargers and floral centrepieces from the stage outward, and the degs begin to steam, until it's a full celebration at night. |
| Menus & packages | Three covered copper degs on a long table, sealed with dough the way dum is cooked. Choose one and its lid lifts with a puff of steam to reveal the full menu. A side-by-side table follows. |
| Events | Drag sideways across one wide venue: a wedding stage under fairy lights, a corporate dinner at long candlelit tables, and a birthday with a balloon arch and cake table, each with its own lighting. Real photographs and details follow. |
| Gallery | Photographs of past evenings orbit a candlelit brass chandelier. Switch between a ring and a spiral, drag to spin and click to open. A filterable album sits below. |
| Get a quote | The estimator below. |
| 404 | "This page isn't on the menu." |

**Signature interaction:** on Get a Quote, move the guest-count slider and the 3D hall grows and fills with tables and chairs to match, from an intimate 50 to a 1,000-guest wedding. Switching the menu tier changes the dishes on the tables, and the estimate counts up live. Add-ons and event type adjust it. The enquiry arrives complete with date, guests, menu and the estimate, as a ready-to-send WhatsApp message.

Also included:
- A palette taken from the hall itself: deep emerald (the carpet and velvet), ivory cloth, champagne gold and a marigold accent.
- A page transition where gold-embroidered emerald velvet curtains draw closed, then part to reveal the next page.
- Buttons with a fine mehndi pattern that fills in on hover.
- Photos that fade in and lean gently toward the cursor.

The site has no sound. The brief suggests a shehnai toggle; it's left out by design.

## Stack
Vite · Three.js · GSAP + ScrollTrigger · Lenis · Barba.js · SplitType

The venues are procedural, with no model files. Tables, chairs, place settings, centrepieces and candles are instanced meshes, so a 1,000-guest hall stays smooth. The pleats and folds are real geometry with their shading baked into vertex colours, and tables sit on soft blob shadows, so there are no real-time shadows to slow scrolling. The scenes use three lamps at most, render at up to 1.5× pixel density and pause when off screen, and the header and panels avoid backdrop blur over the 3D.

## Run it
From a terminal:
```bash
npm ci
npm run dev
```
The site uses ES modules, so it needs a server. Opening `index.html` by double-clicking won't work. Testing flags: `?lite` forces the lighter version, `?full` forces 3D.

## Deploy on Vercel
Import the repo, leave **Root Directory** at the repository root (`./`), and keep the detected **Vite** preset. `vercel.json` turns on clean URLs. Links like `/quote?tier=shahi&event=corporate` preselect the estimator.

## Phones and lighter devices
- **Home:** lighter devices get the evening as 8 pre-rendered stills that crossfade as you scroll (`public/img/evening/`), as the brief asks.
- **Quote page:** the hall becomes a simple grid of table dots.
- **Gallery:** the orbit becomes the album.

## Before publishing
- Search "Shaam-e-Dawat Catering" on Google to check no real caterer uses the name.
- Menus, prices, rules and contact details are placeholders. Everything lives in `src/data.js`.
- Nothing is sent. A real caterer would connect enquiries to DawatKhata, Aqoa Systems' event and catering management app, so bookings flow into menu planning, staffing and payments.

Photos from Unsplash (free licence), self-hosted as WebP in `public/img/p/`.
