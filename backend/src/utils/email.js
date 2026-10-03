// ═══════════════════════════════════════════════════════════════
//  BREVO — Envoi d'emails via API HTTP
//  Doc : https://developers.brevo.com/reference/sendtransacemail
// ═══════════════════════════════════════════════════════════════

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL =
  process.env.EMAIL_FROM || "Chat NSI <julientraineau17@gmail.com>";

// ═══════════════════════════════════════════════════════════════
//  TEMPLATE HTML
// ═══════════════════════════════════════════════════════════════
function buildVerificationEmail({ username, verifyUrl }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
              <div style="font-size:48px;line-height:1;">💬</div>
              <h1 style="color:#ffffff;margin:12px 0 0;font-size:22px;font-weight:600;">Chat NSI TERM</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="color:#1f2937;margin:0 0 16px;font-size:20px;">Salut ${username} 👋</h2>
              <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Merci pour ton inscription ! Pour activer ton compte et pouvoir te connecter,
                il te suffit de confirmer ton adresse email en cliquant sur le bouton ci-dessous.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="border-radius:8px;background:#6366f1;">
                    <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;border-radius:8px;">
                      ✅ Confirmer mon email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 8px;">
                Ou copie ce lien dans ton navigateur :
              </p>
              <p style="color:#6366f1;font-size:12px;word-break:break-all;margin:0 0 24px;padding:12px;background:#f9fafb;border-radius:6px;font-family:monospace;">
                ${verifyUrl}
              </p>
              <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;">
                ⏱️ Ce lien expire dans 24 heures.<br>
                Si tu n'es pas à l'origine de cette inscription, ignore simplement cet email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} Chat NSI TERM — Ne réponds pas à cet email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ═══════════════════════════════════════════════════════════════
//  ENVOI VIA API BREVO
// ═══════════════════════════════════════════════════════════════
async function sendVerificationEmail({ to, username, token }) {
  if (!BREVO_API_KEY) {
    console.error("═══════════════════════════════════════════");
    console.error("❌ BREVO_API_KEY manquante");
    console.error("═══════════════════════════════════════════");
    throw new Error("BREVO_API_KEY manquante");
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verifyUrl = `${frontendUrl}/verify-email/${token}`;

  // Parsing du format "Nom <email@domain.com>"
  const senderMatch = FROM_EMAIL.match(/^(.*?)\s*<(.+)>$/);
  const senderName = senderMatch ? senderMatch[1].trim() : "Chat NSI";
  const senderEmail = senderMatch ? senderMatch[2].trim() : FROM_EMAIL;

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to }],
    subject: "Confirme ton inscription à Chat NSI TERM",
    htmlContent: buildVerificationEmail({ username, verifyUrl }),
    textContent: `Salut ${username},\n\nConfirme ton email en cliquant ici : ${verifyUrl}\n\nCe lien expire dans 24h.`,
  };

  console.log("📤 [email] Tentative d'envoi via Brevo :");
  console.log("   FROM :", senderEmail);
  console.log("   TO   :", to);

  let res;
  try {
    res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (networkErr) {
    console.error("═══════════════════════════════════════════");
    console.error("❌ ERREUR RÉSEAU vers api.brevo.com");
    console.error("Message :", networkErr.message);
    console.error("═══════════════════════════════════════════");
    throw new Error(`Impossible de contacter Brevo : ${networkErr.message}`);
  }

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("═══════════════════════════════════════════");
    console.error("❌ BREVO A REFUSÉ L'ENVOI");
    console.error("Status HTTP    :", res.status);
    console.error("Réponse Brevo  :", errorBody);
    console.error("FROM utilisé   :", senderEmail);
    console.error("TO utilisé     :", to);
    console.error("═══════════════════════════════════════════");
    throw new Error(`Brevo API error (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  console.log(`✅ [email] Envoyé à ${to} (messageId: ${data.messageId})`);
  return data;
}

module.exports = { sendVerificationEmail };
