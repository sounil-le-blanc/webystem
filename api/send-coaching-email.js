export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { email, name, slotLabel, type } = req.body;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
            },
            body: JSON.stringify({
                from: 'Webystem <contact@webystem.com>',
                to: [email],
                bcc: ['contact@webystem.com'],
                subject: type === 'reminder' 
                    ? '⏰ Rappel — Ton coaching Webystem demain'
                    : '✅ Confirmation — Ton coaching Webystem est réservé',
                html: type === 'reminder'
                    ? getReminderEmail(name, slotLabel)
                    : getConfirmationEmail(name, slotLabel),
            }),
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ success: true, id: data.id });
        } else {
            return res.status(500).json({ error: data.message });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

function getConfirmationEmail(name, slotLabel) {
    return `
        <p>Bonjour ${name},</p>
        <p>Ton coaching Webystem est confirmé pour le <strong>${slotLabel}</strong>.</p>
        <p>Le lien Zoom te sera envoyé la veille.</p>
        <p>Si tu as une question, réponds simplement à cet email.</p>
        <p>À bientôt,<br>Sounil — Webystem</p>
    `;
}

function getReminderEmail(name, slotLabel) {
    return `
        <p>Bonjour ${name},</p>
        <p>Petit rappel : ton coaching Webystem a lieu <strong>demain</strong>, le <strong>${slotLabel}</strong>.</p>
        <p>Voici le lien Zoom : <a href="#">[lien à ajouter]</a></p>
        <p>Si tu ne peux plus être présent, préviens-moi au plus vite.</p>
        <p>À demain,<br>Sounil — Webystem</p>
    `;
}