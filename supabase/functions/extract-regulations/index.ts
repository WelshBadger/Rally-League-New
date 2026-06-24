import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.30.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { rallyId, pdfBase64, websiteUrl } = await req.json()

    if (!rallyId || !pdfBase64) {
      throw new Error('Missing rallyId or pdfBase64')
    }

    // Optionally fetch website content
    let websiteText = ''
    if (websiteUrl) {
      try {
        const res = await fetch(websiteUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RallyLeague/1.0)' },
          signal: AbortSignal.timeout(8000),
        })
        const html = await res.text()
        // Strip HTML tags and collapse whitespace
        websiteText = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .slice(0, 8000) // cap at 8k chars to keep prompt size reasonable
      } catch {
        // Website fetch failed — continue without it
      }
    }

    const client = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
    })

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            } as any,
            {
              type: 'text',
              text: `Extract the following information from this rally supplementary regulations document and return it as a valid JSON object with no other text:

{
  "eventName": "full official event name",
  "dates": "event dates as a readable string e.g. 31 January - 1 February 2026",
  "rallyHQ": "rally HQ full address",
  "organiser": {
    "club": "organising club name",
    "contact": "primary contact person name",
    "phone": "phone number",
    "email": "email address or null"
  },
  "clerkOfCourse": "name of clerk of course",
  "safetyDelegate": "name of safety delegate or null",
  "keyOfficials": [
    { "role": "exact role title from the document", "name": "person name" }
  ],
  "stageCount": 0,
  "totalStageDistance": "e.g. 200km",
  "totalItineraryDistance": "e.g. 578km",
  "stages": [
    { "number": 1, "name": "stage name", "distance": "24.3km" }
  ],
  "schedule": [
    { "day": "Day 1 / Friday etc", "time": "time string", "event": "what is happening", "location": "location if given" }
  ],
  "serviceArea": "service park / service area location or null",
  "reconDate": "reconnaissance date as string or null",
  "entryFeesSummary": "brief summary of entry fee structure e.g. €1,395 International, €845 Junior",
  "vehicleClasses": "brief list of classes e.g. RC2, RC3, RC4, RC5"
}

For keyOfficials, extract EVERY named official listed in the document — stewards, scrutineers, medical officer, radio coordinator, safety car driver, results manager, timekeeper, competitor relations officer, chief marshal, etc. Include everyone with a named role. Do not include Clerk of Course or Safety Delegate here as they have their own fields.

${websiteText ? `\n\nAdditional source — rally website content (use to supplement or fill gaps from the PDF):\n\n${websiteText}` : ''}

Return ONLY valid JSON. Use null for fields not found.`,
            },
          ],
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type from AI')

    // Strip markdown code fences if present
    const raw = content.text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

    let extractedData: Record<string, unknown>
    try {
      extractedData = JSON.parse(raw)
    } catch {
      throw new Error('AI returned invalid JSON — extraction failed')
    }

    // Save to rallies table
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { error } = await supabase
      .from('rallies')
      .update({ regulations_data: extractedData })
      .eq('id', rallyId)

    if (error) throw error

    return new Response(JSON.stringify({ data: extractedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
