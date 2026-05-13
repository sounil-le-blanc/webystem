import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).json({ error: 'Signature invalide' });
    }

    // Paiement réussi
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { name, email, slot, slotLabel } = session.metadata || {};

        if (slot) {
            // Marquer le créneau comme réservé dans Supabase
            const supabaseUrl = 'https://zjywzpyuiverfxmzjlpq.supabase.co';
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

            const supabaseRes = await fetch(`${supabaseUrl}/rest/v1/slots?value=eq.${slot}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey,
                },
                body: JSON.stringify({
                    booked: true,
                    booked_by: email || session.customer_email,
                    booked_at: new Date().toISOString(),
                }),
            });

            if (!supabaseRes.ok) {
                console.error('Erreur Supabase:', await supabaseRes.text());
            }
        }

        // Envoyer l'email de confirmation
        if (email && slotLabel) {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: 'Webystem <contact@webystem.com>',
                    to: [email],
                    bcc: ['contact@webystem.com'],
                    subject: '✅ Coaching Webystem confirmé — ' + slotLabel,
                    html: `
                        <p>Bonjour ${name || ''},</p>
                        <p>Ton coaching est confirmé pour le <strong>${slotLabel}</strong>.</p>
                        <p>Le lien Zoom te sera envoyé la veille.</p>
                        <p>À bientôt,<br>Sounil — Webystem</p>
                    `,
                }),
            }).catch(err => console.error('Erreur Resend:', err));
        }
    }

    res.status(200).json({ received: true });
}