const RULES_KEY = 'focustime_rules';

let rules = [];

async function loadRules() {
  const result = await browser.storage.local.get(RULES_KEY);
  rules = result[RULES_KEY] || [];
}

function isTimeInSlot(slot) {
  const now = new Date();
  const currentDay = now.getDay();

  if (!slot.days.includes(currentDay)) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = slot.start.split(':').map(Number);
  const [endH, endM] = slot.end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

function shouldBlock(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');

    for (const rule of rules) {
      if (!rule.enabled) continue;

      const ruleDomain = rule.domain.replace(/^www\./, '').toLowerCase().trim();

      if (hostname === ruleDomain || hostname.endsWith('.' + ruleDomain)) {
        for (const slot of rule.timeSlots) {
          if (isTimeInSlot(slot)) return true;
        }
      }
    }
  } catch (_) {}
  return false;
}

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.type === 'main_frame' && shouldBlock(details.url)) {
      const blockedUrl =
        browser.runtime.getURL('blocked.html') +
        '?url=' +
        encodeURIComponent(details.url);
      return { redirectUrl: blockedUrl };
    }
    return {};
  },
  { urls: ['<all_urls>'], types: ['main_frame'] },
  ['blocking']
);

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[RULES_KEY]) {
    rules = changes[RULES_KEY].newValue || [];
  }
});

loadRules();
