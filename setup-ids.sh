#!/usr/bin/env bash
#
# setup-ids.sh — stamp the real tracking IDs into the Regency House site.
#
# Run ONCE after the GA4 property, the Google Ads account and the conversion
# actions exist. It edits the SOURCE files (templates/, content/, assets/js)
# and then rebuilds public/, so you never hand-edit tags across 14 pages.
#
#   ./setup-ids.sh --ga4 G-ABC123XYZ \
#                  --ads AW-123456789 \
#                  --form-label MnOpQr_StUvWx456 \
#                  --lead-email office@example.com
#
# Options:
#   --ga4         GA4 measurement ID        (G-XXXXXXXXXX)
#   --ads         Google Ads conversion ID  (AW-XXXXXXXXX)
#   --form-label  Ads label for the form conversion (label only, not AW-.../...)
#   --lead-email  Second address CC'd on every lead from the contact form
#   --phone       Change the phone number everywhere (10 digits)
#   --revert      Put the placeholder tokens back
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GA4=""; ADS=""; FORM_LABEL=""; LEAD_EMAIL=""; PHONE=""; REVERT=0

usage() { sed -n '2,22p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ga4)        GA4="${2:-}"; shift 2 ;;
    --ads)        ADS="${2:-}"; shift 2 ;;
    --form-label) FORM_LABEL="${2:-}"; shift 2 ;;
    --lead-email) LEAD_EMAIL="${2:-}"; shift 2 ;;
    --phone)      PHONE="${2:-}"; shift 2 ;;
    --revert)     REVERT=1; shift ;;
    -h|--help)    usage 0 ;;
    *) echo "Unknown option: $1" >&2; usage 1 ;;
  esac
done

# Source files only — public/ is generated and gets rebuilt at the end.
srcs() { printf '%s\n' "$ROOT/templates/base.html" "$ROOT/content/contact-us.html" "$ROOT/public/assets/js/main.js"; }

if [[ "$REVERT" == "1" ]]; then
  while IFS= read -r f; do
    sed -i -E -e 's/G-[A-Z0-9]{8,12}/GA4_MEASUREMENT_ID/g' -e 's/AW-[0-9]{9,11}/AW_CONVERSION_ID/g' "$f"
  done < <(srcs)
  sed -i -E 's/var FORM_CONVERSION_LABEL = "[^"]*";/var FORM_CONVERSION_LABEL = "";/' "$ROOT/public/assets/js/main.js"
  (cd "$ROOT" && python3 build.py >/dev/null)
  echo "Reverted to placeholders and rebuilt."; exit 0
fi

fail=0
[[ -n "$GA4"        && ! "$GA4" =~ ^G-[A-Z0-9]{8,12}$ ]]        && { echo "ERROR: --ga4 looks like G-ABC123XYZ (got '$GA4')" >&2; fail=1; }
[[ -n "$ADS"        && ! "$ADS" =~ ^AW-[0-9]{9,11}$ ]]          && { echo "ERROR: --ads looks like AW-123456789 (got '$ADS')" >&2; fail=1; }
[[ -n "$FORM_LABEL" && ! "$FORM_LABEL" =~ ^[A-Za-z0-9_-]{10,40}$ ]] && { echo "ERROR: --form-label is the label only, e.g. MnOpQr_StUvWx456 — not the whole AW-…/… string (got '$FORM_LABEL')" >&2; fail=1; }
[[ -n "$LEAD_EMAIL" && ! "$LEAD_EMAIL" =~ ^[^@[:space:]]+@[^@[:space:]]+\.[A-Za-z]{2,}$ ]] && { echo "ERROR: --lead-email is not a valid address (got '$LEAD_EMAIL')" >&2; fail=1; }
[[ -n "$FORM_LABEL" && -z "$ADS" ]] && { echo "ERROR: --form-label needs --ads too." >&2; fail=1; }
[[ "$fail" == "0" ]] || exit 1
[[ -z "$GA4$ADS$LEAD_EMAIL$PHONE" ]] && usage 1

changed=0
while IFS= read -r f; do
  before="$(cksum < "$f")"
  [[ -n "$GA4" ]]        && sed -i "s/GA4_MEASUREMENT_ID/${GA4}/g" "$f"
  [[ -n "$ADS" ]]        && sed -i "s/AW_CONVERSION_ID/${ADS}/g" "$f"
  [[ -n "$LEAD_EMAIL" ]] && sed -i "s/SECOND_LEAD_EMAIL/${LEAD_EMAIL}/g" "$f"
  if [[ -n "$PHONE" ]]; then
    d="$(printf '%s' "$PHONE" | tr -cd '0-9')"
    [[ "${#d}" == "10" ]] || { echo "ERROR: --phone needs 10 digits (got '$PHONE')" >&2; exit 1; }
    sed -i -e "s/(423) 870-0050/(${d:0:3}) ${d:3:3}-${d:6:4}/g" -e "s/tel:4238700050/tel:${d}/g" "$f"
  fi
  [[ "$(cksum < "$f")" != "$before" ]] && { changed=$((changed+1)); echo "  updated ${f#$ROOT/}"; }
done < <(srcs)

if [[ -n "$FORM_LABEL" ]]; then
  sed -i -E "s/var FORM_CONVERSION_LABEL = \"[^\"]*\";/var FORM_CONVERSION_LABEL = \"${FORM_LABEL}\";/" "$ROOT/public/assets/js/main.js"
  echo "  set FORM_CONVERSION_LABEL"
fi

echo; echo "Rebuilding…"; (cd "$ROOT" && python3 build.py | tail -2)

echo
left="$(grep -rl -E 'GA4_MEASUREMENT_ID|AW_CONVERSION_ID|SECOND_LEAD_EMAIL' "$ROOT/templates" "$ROOT/content" "$ROOT/public/assets/js" 2>/dev/null || true)"
if [[ -n "$left" ]]; then
  echo "STILL PLACEHOLDER (tracking/lead delivery incomplete in these):"
  echo "$left" | sed "s|$ROOT/|  |"
else
  echo "No placeholders left — tracking and lead delivery are fully wired."
fi
grep -q 'FORM_CONVERSION_LABEL = ""' "$ROOT/public/assets/js/main.js" \
  && echo "NOTE: FORM_CONVERSION_LABEL is still empty — the form conversion will not fire."
