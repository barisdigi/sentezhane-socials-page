import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';

export const prerender = false;

interface ClickDspPayload {
  name: 'ClickDsp';
  eventId: string;
  params: {
    dsp: string;
    releaseSlug: string;
    trackSlug?: string;
    lang?: string;
    placement?: string;
  };
  url?: string;
  fbp?: string;
  fbc?: string;
}

interface RuntimeEnv {
  META_CAPI_TOKEN?: string;
  META_TEST_EVENT_CODE?: string;
}

/**
 * Returns the Meta click identifier (`fbc`). Uses the value forwarded from the
 * browser when present, otherwise reconstructs it from the `fbclid` query
 * parameter on the event source URL so CAPI never sends an empty `fbc`.
 */
function deriveFbc(rawFbc: string | undefined, url: string | undefined): string | undefined {
  if (rawFbc) return rawFbc;
  if (!url) return undefined;
  try {
    const fbclid = new URL(url).searchParams.get('fbclid');
    if (fbclid) return `fb.1.${Date.now()}.${fbclid}`;
  } catch {
    /* invalid url */
  }
  return undefined;
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  let body: ClickDspPayload;
  try {
    body = (await request.json()) as ClickDspPayload;
  } catch (err) {
    console.error('[capi] body json parse failed', err);
    return new Response(null, { status: 204 });
  }

  
  if (!body || body.name !== 'ClickDsp' || !body.eventId || !body.params) {
    console.warn('[capi] payload shape rejected', body);
    return new Response(null, { status: 204 });
  }

  const env = ((locals as { runtime?: { env?: RuntimeEnv } }).runtime?.env ?? {}) as RuntimeEnv;
  const token = env.META_CAPI_TOKEN;
  if (!token) {
    console.error('[capi] META_CAPI_TOKEN missing from env');
    return new Response(null, { status: 204 });
  }

  const artist = await getEntry('artist', 'artist');
  const pixelId = artist?.data.metaPixelId;
  if (!pixelId) {
    console.error('[capi] metaPixelId missing from artist entry');
    return new Response(null, { status: 204 });
  }

  console.log('[capi] forwarding event', body.eventId, 'test_code=', env.META_TEST_EVENT_CODE || '(none)');

  const p = body.params;
  const contentId = p.trackSlug || p.releaseSlug;
  const ua = request.headers.get('user-agent') || '';
  const ip = clientAddress || request.headers.get('cf-connecting-ip') || '';

  const userData: Record<string, unknown> = {};
  if (ip) userData.client_ip_address = ip;
  if (ua) userData.client_user_agent = ua;
  if (body.fbp) userData.fbp = body.fbp;
  const fbc = deriveFbc(body.fbc, body.url);
  if (fbc) userData.fbc = fbc;

  const payload = {
    data: [
      {
        event_name: 'ViewContent',
        event_time: Math.floor(Date.now() / 1000),
        event_id: body.eventId,
        event_source_url: body.url,
        action_source: 'website',
        user_data: userData,
        custom_data: {
          content_name: contentId,
          content_category: p.dsp,
          content_type: 'music',
          content_ids: [contentId],
          value: 1,
          currency: 'TRY',
          dsp: p.dsp,
          placement: p.placement || 'inline',
        },
      },
    ],
    ...(env.META_TEST_EVENT_CODE ? { test_event_code: env.META_TEST_EVENT_CODE } : {}),
  };

  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[capi] Meta responded', res.status, res.statusText, text);
    }
  } catch (err) {
    console.error('[capi] Meta fetch threw', err);
  }

  return new Response(null, { status: 204 });
};
