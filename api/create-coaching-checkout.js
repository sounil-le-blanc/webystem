import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1TWLJXFgmWe4T34gR73tRrxG',
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://webystem.com/succes-coaching.html',
      cancel_url: 'https://webystem.com/coaching.html',
      customer_email: req.body.email || undefined,
      metadata: {
        name: req.body.name || '',
        slot: req.body.slot || '',
        slotLabel: req.body.slotLabel || '',
      },
      payment_intent_data: {
        description: 'Coaching Orientation & IA - 2h',
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Erreur Stripe:', error);
    res.status(500).json({ error: error.message });
  }
}