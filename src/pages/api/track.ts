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

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  let body: ClickDspPayload;
  try {
    body = (await request.json()) as ClickDspPayload;
  } catch {
    return new Response(null, { status: 204 });
  }

  if (!body || body.name !== 'ClickDsp' || !body.eventId || !body.params) {
    return new Response(null, { status: 204 });
  }

  const env = ((locals as { runtime?: { env?: RuntimeEnv } }).runtime?.env ?? {}) as RuntimeEnv;
  const token = env.META_CAPI_TOKEN;
  if (!token) return new Response(null, { status: 204 });

  const artist = await getEntry('artist', 'artist');
  const pixelId = artist?.data.metaPixelId;
  if (!pixelId) return new Response(null, { status: 204 });

  const p = body.params;
  const contentId = p.trackSlug || p.releaseSlug;
  const ua = request.headers.get('user-agent') || '';
  const ip = clientAddress || request.headers.get('cf-connecting-ip') || '';

  const userData: Record<string, unknown> = {};
  if (ip) userData.client_ip_address = ip;
  if (ua) userData.client_user_agent = ua;
  if (body.fbp) userData.fbp = body.fbp;
  if (body.fbc) userData.fbc = body.fbc;

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
