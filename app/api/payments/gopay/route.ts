// app/api/payments/gopay/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userEmail, packageId, credits, amountCZK, packageName } = body;

    // 1. Zde zavoláš oficiální GoPay REST API (získáš access token a vytvoříš platbu)
    /*
    const gopayResponse = await fetch('https://gate.gopay.cz/api/payments/payment', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GOPAY_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        payer: {
          default_payment_instrument: "PAYMENT_CARD",
          contact: {
            email: userEmail,
          }
        },
        amount: amountCZK * 100, // GoPay vyžaduje částku v haléřích (např. 79000 Pro 790 Kč)
        currency: "CZK",
        order_number: `CREDIT_${Date.now()}`,
        order_description: `Nákup kreditů - ${packageName}`,
        callback: {
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/kredity?status=success`,
          notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/gopay/webhook`,
        }
      }),
    });
    const gopayData = await gopayResponse.json();
    return NextResponse.json({ gw_url: gopayData.gw_url });
    */

    // Testovací výstup před kompletací s reálnými GoPay klíči:
    return NextResponse.json({
      success: true,
      gw_url: 'https://gw.sandbox.gopay.com/', // Zde bude reálná URL od GoPay
    });

  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Chyba serveru při vytváření platby' },
      { status: 500 }
    );
  }
}