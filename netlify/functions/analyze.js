exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = JSON.parse(event.body);
    const D = body.data || {};

    // ── SERVER-SIDE CRAWL via Jina AI ──
    let pageContent = 'Page crawl unavailable.';
    if (D.url) {
      try {
        const jinaResp = await fetch('https://r.jina.ai/' + D.url, {
          headers: {
            'Accept': 'text/plain',
            'X-Timeout': '8'
          }
        });
        if (jinaResp.ok) {
          const text = await jinaResp.text();
          if (text && text.length > 100) {
            pageContent = text.substring(0, 8000);
          }
        }
      } catch (crawlErr) {
        pageContent = 'Page crawl failed: ' + crawlErr.message;
      }
    }

    // ── BUILD PROMPT ──
    const userPrompt =
      'Funnel URL: ' + (D.url || 'unknown') + '\nDomain: ' + (D.domain || 'unknown') + '\n\n' +
      '═══ ACTUAL PAGE CONTENT (crawled live) ═══\n' +
      pageContent + '\n\n' +
      '═══ AUTO-DETECTED SIGNALS ═══\n' +
      '- VSL / video detected on page: ' + (D.hasVSL ? 'YES' : 'NO') + '\n' +
      '- Social proof / testimonials detected: ' + (D.hasSocialProof ? 'YES' : 'NO') + '\n' +
      '- Application / typeform detected: ' + (D.hasTypeform ? 'YES' : 'NO') + '\n' +
      '- Primary CTA text detected: ' + (D.ctaText || 'none detected') + '\n' +
      '- Authority markers (press, features): ' + (D.hasAuthority ? 'YES' : 'NO') + '\n\n' +
      '═══ SALES PROCESS (self-reported) ═══\n' +
      '- Minutes to first text: ' + (D.textDelay != null ? D.textDelay : 'not provided') + '\n' +
      '- Minutes to first dial: ' + (D.dialDelay != null ? D.dialDelay : 'not provided') + '\n' +
      '- Text sender type: ' + (D.textSender || 'not provided') + '\n' +
      '- Double dial policy: ' + (D.doubleDial || 'not provided') + '\n' +
      '- Booking window: ' + (D.booking || 'not provided') + '\n' +
      '- CRM: ' + (D.crm || 'not provided') + '\n' +
      '- Follow-up emails before call: ' + (D.emails || 0) + '\n' +
      '- Follow-up texts before call: ' + (D.texts || 0) + '\n' +
      '- Lead notification system: ' + (D.notify || 'not provided') + '\n' +
      '- Setter framing / first text: ' + (D.framing || 'not provided') + '\n' +
      '- Post-booking value sent: ' + (D.postbook || 'not provided') + '\n' +
      '- Financial qualification intensity: ' + (D.qual || 'not provided');

    const systemPrompt = `You are VANTAGE — an elite sales funnel intelligence engine. You went into this funnel like a trojan horse — crawled the actual page as a lead would experience it, AND received self-reported sales process data. Analyze both layers together.

You think like a fractional VP of Sales who has personally gone through dozens of high-ticket info product funnels undercover. You notice everything — weak headlines, scripted VSLs, buried CTAs, fake urgency, cold post-booking sequences, slow setters, number inconsistency. You name specific things you actually saw on the page.

SALES PROCESS BENCHMARKS:
- First text: <3min=elite, 3-8min=ok, 8-20min=bad, 20min+=critical
- First dial: <10min=elite, 10-20min=ok, 20-40min=bad, 40min+=critical
- Booking window: same day=elite, 1-2 days=ok, 3+ days=show rate killer
- Double dial: non-negotiable — recovers 15-20% of missed contacts
- Number consistency: different unexplained number erodes subconscious trust
- First text must invite reply — "STOP to opt out" endings kill FMRR
- Setter title matters — "assistant" kills authority, "director/strategist" builds it
- Nothing sent post-booking = cold lead = no-show

PAGE/FUNNEL BENCHMARKS:
- Headline: outcome clear in under 5 seconds?
- VSL: present? Too long? Scripted? Does presenter actually know the content?
- CTA: one clear action or competing CTAs?
- Social proof: specific names + numbers, or generic vague testimonials?
- Offer clarity: cold lead understands exactly what they're buying?
- Urgency: real or fake?
- Qualification: over-filtering leads with aggressive financial questions raises CPL

Respond ONLY in valid JSON. No markdown, no preamble, nothing outside the JSON.
{
  "overallScore": number,
  "verdict": "ALL-CAPS verdict based on score tier: 0-20=CRITICAL REVENUE EMERGENCY, 21-35=BROKEN FROM THE START, 36-50=LEAKING MONEY EVERYWHERE, 51-65=AMATEUR HOUR FUNNEL, 66-75=LEAVING MONEY ON TABLE, 76-85=SOLID BUT FIXABLE, 86-94=NEARLY DIALED IN, 95-100=ELITE FUNNEL OPERATION",
  "summary": "2 punchy sentences. Name specific things from the actual crawled page AND the sales process. Sound like someone who just went through their funnel undercover.",
  "categories": [
    {"name":"Speed to Lead","score":number,"color":"green|gold|orange|red"},
    {"name":"Sales Process","score":number,"color":"green|gold|orange|red"},
    {"name":"Funnel Structure","score":number,"color":"green|gold|orange|red"},
    {"name":"Lead Nurture","score":number,"color":"green|gold|orange|red"},
    {"name":"CRM & Ops","score":number,"color":"green|gold|orange|red"}
  ],
  "timeline":[
    {"label":"Opt-in","time":"0:00","status":"green"},
    {"label":"First Text","time":"Xmin","status":"green|gold|red"},
    {"label":"First Dial","time":"Xmin","status":"green|gold|red"},
    {"label":"Booked Call","time":"X days","status":"green|gold|red"}
  ],
  "findings":[
    {
      "severity":"critical|warning|good",
      "icon":"single emoji",
      "title":"Specific punchy title — reference actual page elements or data when possible",
      "body":"2-3 sentences. Direct operator tone. Quote or reference actual copy/elements from the page when you can. Name the exact revenue impact — show rate, FMRR, CPL, close rate.",
      "fix":"One specific actionable fix. Start with →",
      "tag":"SPEED TO LEAD|SETTER PROCESS|AUTHORITY|SHOW RATE|LEAD NURTURE|CRM & OPS|FUNNEL STRUCTURE|QUALIFICATION|VSL|COPY"
    }
  ]
}

7-9 findings. Critical first. At least 4 must reference something specific from the actual crawled page content. If sales process fields are missing, flag and score worst case.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await response.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
