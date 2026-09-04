/*import { NextResponse, NextRequest } from 'next/server';
import https from 'https';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Vynucení Node.js runtime na Vercelu pro podporu modulu 'https' a mTLS
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // 0. Bezpečnostní kontrola pro Cron / Monitor
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const clientId = process.env.MONETA_CLIENT_ID;
    const accountId = process.env.MONETA_ACCOUNT_ID;
    const certRaw = process.env.MONETA_CERT;
    const keyRaw = process.env.MONETA_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Chybí Supabase konfigurace.' }, { status: 500 });
    }

    if (!certRaw || !keyRaw || !clientId || !accountId) {
      return NextResponse.json({ 
        error: 'Chybí mTLS certifikáty nebo konfigurace Monety v env variables.' 
      }, { status: 500 });
    }

    // Ošetření odřádkování v PEM certifikátech z env variables
    const cert = certRaw.replace(/\\n/g, '\n');
    const key = keyRaw.replace(/\\n/g, '\n');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Vytvoření HTTPS agenta s klientským mTLS certifikátem pro Monetu
    const agent = new https.Agent({
      cert,
      key,
      rejectUnauthorized: true,
    });

    // 2. Přímý dotaz na B2B API Moneta Money Bank
    const bankData = await new Promise<any>((resolve, reject) => {
      const options = {
        hostname: 'api.moneta.cz', // Produkční B2B endpoint Monety
        port: 443,
        path: `/v1/accounts/${accountId}/transactions`,
        method: 'GET',
        agent,
        headers: {
          'Accept': 'application/json',
          'Client-Id': clientId,
          'X-Request-ID': crypto.randomUUID(),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Banka vrátila status ${res.statusCode}: ${body}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('Chyba při zpracování JSON odpovědi z banky.'));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    const transactions = bankData.transactions || [];
    let processedCount = 0;

    // 3. Procházení a párování plateb
    for (const tx of transactions) {
      const amount = parseFloat(tx.amount?.value || tx.amount || '0');
      if (amount <= 0) continue; // Odchozí platby ignorujeme

      // Získání variabilního symbolu
      const vs = (
        tx.variableSymbol || 
        tx.details?.variableSymbol || 
        tx.remittanceInformation?.variableSymbol || 
        ''
      ).toString().trim();

      // Získání zprávy pro příjemce
      const message = (
        tx.remittanceInformation || 
        tx.userMessage || 
        tx.details?.userMessage || 
        ''
      ).toString();

      // Hledání UUID v poznámce pro případ, že platba proběhla bez VS
      const uuidMatch = message.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      const uuidFromMessage = uuidMatch ? uuidMatch[0] : null;

      if (!vs && !uuidFromMessage) continue;

      const txIdentifier = `Moneta ID: ${tx.transactionId || tx.id}`;

      // Kontrola, zda transakce už nebyla zpracována
      const { data: existingTx } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('description', txIdentifier)
        .single();

      if (existingTx) continue;

      // Párování uživatele: Přednostně podle VS (rodné číslo), záložně podle UUID z poznámky
      let profile = null;

      if (vs) {
        const { data: profileByVs } = await supabase
          .from('profiles')
          .select('id, credit_balance, role')
          .eq('birth_number', vs)
          .single();

        profile = profileByVs;
      }

      if (!profile && uuidFromMessage) {
        const { data: profileByUuid } = await supabase
          .from('profiles')
          .select('id, credit_balance, role')
          .eq('id', uuidFromMessage)
          .single();

        profile = profileByUuid;
      }

      if (!profile) continue; // Uživatel nenalezen

      // Výpočet kreditů podle role
      let creditsToAdd = 0;
      const userRole = profile.role;

      if (userRole === 'Swimmer' || userRole === 'Trainer') {
        // Zvýhodněná cena: 300 Kč = 1 kredit
        creditsToAdd = Math.floor(amount / 300);
      } else {
        // Standardní klient (Client)
        if (amount >= 12800) {
          creditsToAdd = 20;
        } else if (amount >= 6990) {
          creditsToAdd = 10;
        } else {
          creditsToAdd = Math.floor(amount / 790);
        }
      }

      if (creditsToAdd <= 0) continue;

      // Přičtení kreditů
      await supabase
        .from('profiles')
        .update({ credit_balance: (profile.credit_balance || 0) + creditsToAdd })
        .eq('id', profile.id);

      // Zápis do historie transakcí
      await supabase.from('credit_transactions').insert({
        user_id: profile.id,
        amount: creditsToAdd,
        type: 'ADD',
        description: txIdentifier,
      });

      processedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Zpracováno ${processedCount} nových plateb z Monety.`,
    });

  } catch (error: any) {
    console.error('Moneta Direct API Error:', error);
    return NextResponse.json({ error: error.message || 'Chyba při komunikaci s Monetou.' }, { status: 500 });
  }
}
*/

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}