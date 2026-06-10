import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';

export const prerender = false;

interface TrackPayload {
  name: string;
  eventId: string;
  params: Record<string, string | number | undefined>;
  url?: string;
  fbp?: string;
  fbc?: string;
  externalId?: string;
}

interface RuntimeEnv {
  META_CAPI_TOKEN?: string;
  META_TEST_EVENT_CODE?: string;
}

/**
 * Maps a client `track()` event onto the Meta event name and `custom_data`
 * payload that CAPI expects. `ClickDsp` is reported as a standard `ViewContent`
 * (the raw `ClickDsp` event is no longer sent); everything else is forwarded as
 * a custom event of the same name. Returns `null` for unknown events so the
 * endpoint can reject them.
 */
function buildMetaEvent(
  name: string,
  params: Record<string, string | number | undefined>,
): { eventName: string; customData: Record<string, unknown> } | null {
  const releaseSlug = params.releaseSlug as string | undefined;
  const trackSlug = params.trackSlug as string | undefined;
  const contentId = trackSlug || releaseSlug;
  const contentIds = contentId ? [contentId] : undefined;

  switch (name) {
    case 'PageView':
      return {
        eventName: 'PageView',
        customData: {
          lang: params.lang,
        },
      };
    case 'ClickDsp':
      return {
        eventName: 'ViewContent',
        customData: {
          content_name: contentId,
          content_category: params.dsp,
          content_type: 'music',
          content_ids: contentIds,
          value: 1,
          currency: 'TRY',
          dsp: params.dsp,
          placement: params.placement || 'inline',
          lang: params.lang,
        },
      };
    case 'VideoPlay':
      return {
        eventName: 'VideoPlay',
        customData: {
          content_name: contentId,
          content_type: 'music',
          content_ids: contentIds,
          lang: params.lang,
        },
      };
    case 'Share':
      return {
        eventName: 'Share',
        customData: {
          content_name: contentId,
          content_type: 'music',
          content_ids: contentIds,
          network: params.network,
          lang: params.lang,
        },
      };
    case 'Engaged15s':
      return {
        eventName: 'Engaged15s',
        customData: {
          threshold_ms: params.thresholdMs,
          lang: params.lang,
        },
      };
    default:
      return null;
  }
}

/**
 * Returns the raw, still-encoded value of a query-string parameter. Using
 * `URL.searchParams.get()` would URL-decode the value and mutate the `fbclid`,
 * which Meta rejects as a "modified fbclid", so we extract the substring
 * verbatim from the query string instead.
 */
function rawQueryParam(url: string, key: string): string | undefined {
  const queryStart = url.indexOf('?');
  if (queryStart === -1) return undefined;
  const hashStart = url.indexOf('#', queryStart);
  const search = url.slice(queryStart + 1, hashStart === -1 ? undefined : hashStart);
  for (const pair of search.split('&')) {
    if (pair.startsWith(key + '=')) return pair.slice(key.length + 1);
  }
  return undefined;
}

/**
 * Returns the real end-user IP address. On Cloudflare the authoritative client
 * IP is exposed via `cf-connecting-ip` (or `true-client-ip` on Enterprise);
 * `clientAddress` and the proxy chain can resolve to a shared edge IP that Meta
 * flags as "associated with multiple users", so those are only used as a last
 * resort. The first hop of `x-forwarded-for` is the originating client.
 */
function deriveClientIp(
  headers: Headers,
  clientAddress: string | undefined,
): string | undefined {
  const cfIp = headers.get('cf-connecting-ip') || headers.get('true-client-ip');
  if (cfIp) return cfIp.trim();
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return clientAddress || undefined;
}

/**
 * Returns the Meta click identifier (`fbc`). Uses the value forwarded from the
 * browser when present, otherwise reconstructs it from the `fbclid` query
 * parameter on the event source URL so CAPI never sends an empty `fbc`. The
 * forwarded `_fbc` cookie value and the raw `fbclid` parameter are passed
 * through unchanged so the value Meta receives is never modified.
 */
function deriveFbc(rawFbc: string | undefined, url: string | undefined): string | undefined {
  if (rawFbc) return rawFbc;
  if (!url) return undefined;
  const fbclid = rawQueryParam(url, 'fbclid');
  if (fbclid) return `fb.1.${Date.now()}.${fbclid}`;
  return undefined;
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  let body: TrackPayload;
  try {
    body = (await request.json()) as TrackPayload;
  } catch (err) {
    console.error('[capi] body json parse failed', err);
    return new Response(null, { status: 204 });
  }

  
  if (!body || !body.name || !body.eventId || !body.params) {
    console.warn('[capi] payload shape rejected', body);
    return new Response(null, { status: 204 });
  }

  const metaEvent = buildMetaEvent(body.name, body.params);
  if (!metaEvent) {
    console.warn('[capi] unknown event rejected', body.name);
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

  console.log('[capi] forwarding event', metaEvent.eventName, body.eventId, 'test_code=', env.META_TEST_EVENT_CODE || '(none)');

  const ua = request.headers.get('user-agent') || '';
  const ip = deriveClientIp(request.headers, clientAddress);

  const userData: Record<string, unknown> = {};
  if (ip) userData.client_ip_address = ip;
  if (ua) userData.client_user_agent = ua;
  if (body.fbp) userData.fbp = body.fbp;
  const fbc = deriveFbc(body.fbc, body.url);
  if (fbc) userData.fbc = fbc;
  if (body.externalId) userData.external_id = body.externalId;

  const payload = {
    data: [
      {
        event_name: metaEvent.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: body.eventId,
        event_source_url: body.url,
        action_source: 'website',
        user_data: userData,
        custom_data: metaEvent.customData,
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
