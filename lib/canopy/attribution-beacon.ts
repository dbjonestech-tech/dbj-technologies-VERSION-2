import { getDb } from "@/lib/db";

export type MetricKind =
  | "pageview"
  | "session_start"
  | "conversion"
  | "form_submit"
  | "core_web_vital"
  | "custom";

export interface BeaconRow {
  id: number;
  contact_id: number;
  metric_kind: MetricKind;
  value: string | number | null;
  payload: Record<string, unknown>;
  origin: string | null;
  user_agent: string | null;
  recorded_at: string;
}

export interface AttributionEvent {
  id: number;
  contact_id: number | null;
  deal_id: number | null;
  event_type:
    | "scan_sent"
    | "meeting_booked"
    | "proposal_sent"
    | "deal_won"
    | "site_launched"
    | "metric_recorded"
    | "milestone";
  payload: Record<string, unknown>;
  recorded_at: string;
}

/* The snippet the operator pastes into the client's site. Two
 * placeholders are baked in: the contact id and the canopy origin. The
 * client sees a tiny async script that posts pageview + form submits
 * to /api/canopy/beacon/<contactId>. No third-party calls; no PII. */
export function generateBeaconSnippet(input: {
  contactId: number;
  canopyOrigin: string;
}): string {
  const origin = input.canopyOrigin.replace(/\/$/, "");
  return `<script>(function(){
  var ID=${JSON.stringify(input.contactId)};
  var BASE=${JSON.stringify(origin)};
  var URL=BASE+"/api/canopy/beacon/"+ID;
  function send(kind,extra){
    try{
      var body=JSON.stringify({metric_kind:kind,payload:extra||{},value:null,origin:location.origin});
      if(navigator.sendBeacon){
        navigator.sendBeacon(URL,new Blob([body],{type:"application/json"}));
      }else{
        fetch(URL,{method:"POST",headers:{"content-type":"application/json"},body:body,keepalive:true,mode:"no-cors"}).catch(function(){});
      }
    }catch(_){}
  }
  send("pageview",{path:location.pathname,referrer:document.referrer||null});
  document.addEventListener("submit",function(e){
    var t=e.target;
    if(t&&t.tagName==="FORM"){send("form_submit",{form_id:t.id||null,form_name:t.getAttribute("name")||null});}
  },true);
})();</script>`;
}

export async function recordBeaconPing(input: {
  contactId: number;
  metricKind: MetricKind;
  value: number | null;
  payload: Record<string, unknown>;
  origin: string | null;
  userAgent: string | null;
}): Promise<number> {
  const sql = getDb();
  const rows = (await sql`
    INSERT INTO attribution_beacon_data (
      contact_id, metric_kind, value, payload, origin, user_agent
    ) VALUES (
      ${input.contactId},
      ${input.metricKind},
      ${input.value},
      ${JSON.stringify(input.payload)}::jsonb,
      ${input.origin},
      ${input.userAgent}
    )
    RETURNING id
  `) as Array<{ id: number }>;
  return rows[0]?.id ?? 0;
}

export async function recordAttributionEvent(input: {
  contactId: number | null;
  dealId: number | null;
  eventType: AttributionEvent["event_type"];
  payload: Record<string, unknown>;
}): Promise<number> {
  const sql = getDb();
  const rows = (await sql`
    INSERT INTO attribution_events (contact_id, deal_id, event_type, payload)
    VALUES (
      ${input.contactId},
      ${input.dealId},
      ${input.eventType},
      ${JSON.stringify(input.payload)}::jsonb
    )
    RETURNING id
  `) as Array<{ id: number }>;
  return rows[0]?.id ?? 0;
}

/* Validate the metric_kind string at the API boundary so we don't
 * write garbage rows when a client's snippet drifts. */
export function isValidMetricKind(s: unknown): s is MetricKind {
  return (
    s === "pageview" ||
    s === "session_start" ||
    s === "conversion" ||
    s === "form_submit" ||
    s === "core_web_vital" ||
    s === "custom"
  );
}
